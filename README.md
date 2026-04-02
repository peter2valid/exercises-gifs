# Supafast Gym App

Next.js app for browsing exercises, backed by Supabase (data). Cloudflare R2 is optional if you want hosted exercise media.

## Stack

- Frontend/runtime: Next.js on Vercel
- Database/API: Supabase
- Media hosting (optional): Cloudflare R2 public bucket URL

## 1) Environment Variables

Set these in Vercel Project Settings > Environment Variables for `Production` and `Preview`.

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MEMBER_QR_SECRET`

Optional (only if using Cloudflare R2 media):

- `NEXT_PUBLIC_R2_PUBLIC_URL`
- `R2_ACCOUNT_ID`
- `R2_BUCKET_NAME`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

Notes:

- `NEXT_PUBLIC_*` vars are exposed to the browser.
- `SUPABASE_SERVICE_ROLE_KEY` must stay server-side only.
- `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` must stay server-side only.

## 2) Supabase Setup

1. Open Supabase SQL Editor.
2. Run the schema from `scripts/supabase-schema.sql`.
3. Verify lints are clear.

Optional local data import:

```bash
npm run db:setup
```

## 3) Cloudflare R2 Setup (Optional)

Skip this section if R2 is not used.

1. Create R2 bucket (for example `virtualgym-media`).
2. Upload exercise media under `exercises/<id>.mp4` (for example `exercises/0001.mp4`).
3. Set `NEXT_PUBLIC_R2_PUBLIC_URL` to your R2 public URL or custom domain.
4. Create R2 API token with Object Read/Write for this bucket.

## 4) Vercel Setup

1. Import this repo into Vercel.
2. Framework preset: Next.js.
3. Add environment variables listed above.
4. Deploy.

The app already reads Supabase via `src/lib/supabase/client.ts`. If `NEXT_PUBLIC_R2_PUBLIC_URL` is not set, exercise videos may be unavailable, but the app will still run.

## 5) Domain + Cloudflare (Optional)

If your domain DNS is on Cloudflare:

1. Add your custom domain in Vercel.
2. Point DNS records in Cloudflare as instructed by Vercel.
3. Keep SSL/TLS mode as `Full` (or `Full (strict)` if cert chain is complete).
4. If proxying through Cloudflare, confirm no cache rule breaks dynamic routes.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.