# Help & support and the hidden admin panel

## Users
- Avatar menu -> "Yordam va qo'llab-quvvatlash" -> `/support`.
- One note (max **100 words**, 1000 characters) and an optional screenshot (JPG/PNG/WEBP, 5 MB) in the private bucket `support-images/<user id>/<uuid>.<ext>`.
- Max 5 tickets per hour per user (`rate_limits`). A hidden honeypot field (`website`) silently drops bot submissions.
- Users see only their own tickets and screenshots (RLS). They cannot set `status`, `user_id` or the handler.

## Admin panel
- Lives at `/<ADMIN_PATH>`. It is not linked anywhere, not in the sitemap, `noindex`. Every other visitor (signed out, normal user, wrong path) gets the normal 404.
- Who is an admin: rows in `public.admins` (no API access; add them in the SQL Editor). `is_admin()` is checked in the page, in every admin action and again by RLS.
- Second step: Cloudflare Turnstile captcha + honeypot. After it passes, a signed cookie (`admin_gate`, HttpOnly, SameSite=Strict, 30 minutes, only for the hidden path, bound to the admin's user id) opens the panel. "Qulflash" removes it.
- Panel: open / resolved / all tickets, the sender, text, screenshot (signed URL), "Hal qilindi" / "Qayta ochish".

## Setup (once)
1. Turnstile: Cloudflare dashboard -> Turnstile -> Add widget (hostname `weoneuz.vercel.app`) -> copy the site key and the secret key.
2. Generate on your machine: `ADMIN_PATH` (random, 24+ letters/digits, e.g. `node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))"`) and `ADMIN_GATE_SECRET` (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
3. Vercel env vars (Production): `ADMIN_PATH`, `ADMIN_GATE_SECRET` (Secret), `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (Config), `TURNSTILE_SECRET_KEY` (Secret). Redeploy.
4. Supabase SQL Editor: run `supabase/migrations/20261001000028_support_and_admin.sql`, then make yourself admin:
   `insert into public.admins (user_id) select id from auth.users where email = 'YOUR_EMAIL';`
5. Open `https://weoneuz.vercel.app/<ADMIN_PATH>` while signed in as that account.

Without these env vars the panel simply does not exist (404 / "not set up"); nothing else is affected.
