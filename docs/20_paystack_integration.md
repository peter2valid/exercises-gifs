# 20. Paystack Integration

## Overview
Viewora uses Paystack for payment processing in Kenya. We support mobile money (M-Pesa), card, and bank transfer payments.

## Integration Architecture

### 1. Checkout Initialization (`/api/paystack/checkout`)
- **Action**: User clicks "Upgrade" or "View Plans".
- **Server**: 
    1. Verify user session.
    2. Initialize transaction with Paystack API.
    3. Generate a `reference` and link it to the user/gym ID.
    4. Store the `payment_attempt` in the database.
- **Client**: Redirect user to the `authorization_url` or open the Paystack popup.

### 2. Webhook Handling (`/api/paystack/webhook`)
- **Security**: Verifies the `x-paystack-signature` header using `PAYSTACK_SECRET_KEY`.
- **Event: `charge.success`**:
    1. Log the `webhook_event`.
    2. Mark the `payment` as `success`.
    3. Update `user_subscriptions` or `gym_subscriptions` status to `active`.
    4. Extend the `current_period_end`.
- **Event: `subscription.create` / `subscription.disable`**:
    1. Update the subscription state in Supabase.
    2. Real-time sync triggers entitlement refresh on user devices.

## Reconciliation
If a webhook is missed, the system uses a background job (edge function) to query the Paystack API for pending references older than 1 hour and reconcile their status.

## Environment Variables
- `PAYSTACK_SECRET_KEY`: Secret key for API and webhook signing.
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`: Public key for client-side popup (if used).

## Testing
- Use Paystack Test Cards (e.g., `4084 0840 8408 4081`).
- Simulate webhooks using the Paystack Dashboard or local proxy tools (ngrok).
