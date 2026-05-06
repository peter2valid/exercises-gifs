-- ═══════════════════════════════════════════════════════════════════════════
-- Viewora Billing Schema
-- Run in Supabase SQL Editor (Settings → SQL Editor)
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE / DO NOTHING
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── GYMS ──────────────────────────────────────────────────────────────────
-- Core B2B entity. One gym admin manages the gym and pays the subscription.

CREATE TABLE IF NOT EXISTS public.gyms (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT        NOT NULL,
    slug          TEXT        UNIQUE,
    admin_user_id UUID        REFERENCES auth.users(id),
    logo_url      TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── GYM MEMBERSHIPS ──────────────────────────────────────────────────────
-- Links users to gyms. A user can belong to one gym.
-- Role determines permissions: member, coach, admin.

CREATE TABLE IF NOT EXISTS public.gym_memberships (
    id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id   UUID        NOT NULL REFERENCES auth.users(id),
    gym_id    UUID        NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    role      TEXT        NOT NULL DEFAULT 'member'
                          CHECK (role IN ('member', 'coach', 'admin')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, gym_id)
);

-- ─── GYM SUBSCRIPTIONS ───────────────────────────────────────────────────
-- One subscription per gym (UNIQUE on gym_id).
-- Plan: start | active | elite
-- Status lifecycle: active → past_due (grace) → canceled/expired

CREATE TABLE IF NOT EXISTS public.gym_subscriptions (
    id                         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id                     UUID        NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    plan                       TEXT        NOT NULL CHECK (plan IN ('start', 'active', 'elite')),
    status                     TEXT        NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'paused', 'expired')),
    paystack_customer_code     TEXT,
    paystack_subscription_code TEXT,
    current_period_start       TIMESTAMPTZ,
    current_period_end         TIMESTAMPTZ,
    grace_period_end           TIMESTAMPTZ, -- Set on payment failure; access retained until this date
    canceled_at                TIMESTAMPTZ,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (gym_id)
);

-- ─── USER SUBSCRIPTIONS (VIEWORA PLUS) ───────────────────────────────────
-- Personal premium for individual members, independent of gym plan.
-- Allows users on cheap gym plans to unlock premium features themselves.

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id                         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                    UUID        NOT NULL REFERENCES auth.users(id),
    plan                       TEXT        NOT NULL DEFAULT 'plus' CHECK (plan = 'plus'),
    billing_period             TEXT        NOT NULL CHECK (billing_period IN ('weekly', 'monthly', 'quarterly')),
    status                     TEXT        NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'paused', 'expired')),
    paystack_customer_code     TEXT,
    paystack_subscription_code TEXT,
    current_period_start       TIMESTAMPTZ,
    current_period_end         TIMESTAMPTZ,
    grace_period_end           TIMESTAMPTZ,
    trial_ends_at              TIMESTAMPTZ,
    canceled_at                TIMESTAMPTZ,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);

-- ─── PAYMENTS ─────────────────────────────────────────────────────────────
-- Immutable audit trail for every transaction attempt.
-- subject_type determines whether subject_id is a user_id or gym_id.

CREATE TABLE IF NOT EXISTS public.payments (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    reference         TEXT        UNIQUE NOT NULL,        -- Our reference (passed to Paystack)
    paystack_reference TEXT,                              -- Paystack's own reference
    subject_type      TEXT        NOT NULL CHECK (subject_type IN ('user_subscription', 'gym_subscription')),
    subject_id        TEXT        NOT NULL,               -- UUID as text (user_id or gym_id)
    amount_kobo       INTEGER     NOT NULL,               -- Amount in KES × 100
    currency          TEXT        NOT NULL DEFAULT 'KES',
    status            TEXT        NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'success', 'failed', 'abandoned', 'reversed')),
    metadata          JSONB       NOT NULL DEFAULT '{}',
    verified_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── WEBHOOK EVENTS ───────────────────────────────────────────────────────
-- Idempotency guard + audit log for Paystack webhook events.
-- processed_at is NULL until the event handler completes successfully.
-- Missing processed_at after >1h indicates a failed handler (for alerting).

CREATE TABLE IF NOT EXISTS public.webhook_events (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    provider     TEXT        NOT NULL DEFAULT 'paystack',
    event_type   TEXT        NOT NULL,
    event_id     TEXT        UNIQUE NOT NULL,  -- Paystack event type + data.id
    payload      JSONB       NOT NULL,
    processed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PROMOTION RULES ──────────────────────────────────────────────────────
-- Flexible promotion/trial system.
-- subject_type=global applies to all users.
-- subject_type=user applies only to subject_id user.
-- subject_type=gym applies to all members of subject_id gym.
-- features is an array of Feature strings (matches TypeScript Feature type).

CREATE TABLE IF NOT EXISTS public.promotion_rules (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code         TEXT        UNIQUE NOT NULL,
    name         TEXT        NOT NULL,
    features     TEXT[]      NOT NULL DEFAULT '{}',
    subject_type TEXT        CHECK (subject_type IN ('user', 'gym', 'global')),
    subject_id   UUID,                                    -- user_id or gym_id (null for global)
    valid_from   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until  TIMESTAMPTZ,                             -- NULL = permanent
    max_uses     INTEGER,                                 -- NULL = unlimited
    use_count    INTEGER     NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_gym_memberships_user   ON public.gym_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_gym_memberships_gym    ON public.gym_memberships(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_subscriptions_gym  ON public.gym_subscriptions(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_subscriptions_status ON public.gym_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subs_user         ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subs_status       ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_reference     ON public.payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_subject       ON public.payments(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_payments_status        ON public.payments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_event_id       ON public.webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_unprocessed    ON public.webhook_events(processed_at) WHERE processed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_promos_subject         ON public.promotion_rules(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_promos_valid           ON public.promotion_rules(valid_until) WHERE valid_until IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.gyms               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_memberships    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_rules    ENABLE ROW LEVEL SECURITY;

-- gyms: members of the gym can read; admin can update
CREATE POLICY "gyms_select_members" ON public.gyms
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT gym_id FROM public.gym_memberships WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "gyms_update_admin" ON public.gyms
    FOR UPDATE TO authenticated
    USING (admin_user_id = auth.uid())
    WITH CHECK (admin_user_id = auth.uid());

-- gym_memberships: users see their own; gym admin sees all members of their gym
CREATE POLICY "gym_memberships_select_own" ON public.gym_memberships
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "gym_memberships_select_admin" ON public.gym_memberships
    FOR SELECT TO authenticated
    USING (
        gym_id IN (SELECT id FROM public.gyms WHERE admin_user_id = auth.uid())
    );

-- gym_subscriptions: members can read their gym's plan; service role writes
CREATE POLICY "gym_subscriptions_select_members" ON public.gym_subscriptions
    FOR SELECT TO authenticated
    USING (
        gym_id IN (
            SELECT gym_id FROM public.gym_memberships WHERE user_id = auth.uid()
        )
    );

-- user_subscriptions: users read only their own; service role writes via webhook/verify
CREATE POLICY "user_subscriptions_select_own" ON public.user_subscriptions
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- payments: users read their own member payments
CREATE POLICY "payments_select_own" ON public.payments
    FOR SELECT TO authenticated
    USING (
        subject_type = 'user_subscription'
        AND subject_id = auth.uid()::text
    );

-- webhook_events: no direct client access (service role only)
-- (no policies needed — RLS enabled but no anon/authenticated policies = deny all)

-- promotion_rules: users can read global promos and promos targeted at them
CREATE POLICY "promos_select" ON public.promotion_rules
    FOR SELECT TO authenticated
    USING (
        subject_type = 'global'
        OR (subject_type = 'user' AND subject_id = auth.uid())
        OR (
            subject_type = 'gym'
            AND subject_id IN (
                SELECT gym_id FROM public.gym_memberships WHERE user_id = auth.uid()
            )
        )
    );

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- REALTIME SUBSCRIPTIONS
-- Enable realtime on tables the client needs to listen to.
-- Run these separately in the Supabase Dashboard → Database → Replication
-- or via the SQL editor:
-- ═══════════════════════════════════════════════════════════════════════════

-- ALTER PUBLICATION supabase_realtime ADD TABLE public.user_subscriptions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.gym_subscriptions;
