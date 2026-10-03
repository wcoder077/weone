# Push notifications (Web Push)

New message or notification -> a system notification on the device, even when the site is closed.

```
messages / notifications INSERT
  -> trigger (migration 27) -> send_push() -> pg_net http_post
  -> POST /api/push   (header x-push-secret)
  -> web-push encrypts + sends to FCM / Apple / Mozilla / Windows push service
  -> public/sw.js shows the notification; click opens the page
```

- The database sends raw facts (`kind`, `actor`, `text`, `url`) plus the recipient's subscriptions. The text is built in `lib/push/message.ts` in each device's language (`push_subscriptions.lang`).
- No service-role key anywhere. `/api/push` is protected by `PUSH_WEBHOOK_SECRET` (same value stored in `push_settings.secret`). Dead devices (404/410) are removed through `push_drop(secret, endpoints)`.
- Endpoints are only accepted from the push services' hosts (table check + `lib/push/endpoint.ts`), so the server cannot be pointed at internal addresses.
- `public/sw.js` shows nothing when a site window is visible and focused (the chat already updates live), except the settings test.
- iPhone: only works after "Add to Home Screen" (iOS 16.4+). The settings card explains it.

## Setup (once)

1. Generate keys on your own machine (never paste them in chat):
   `npx web-push generate-vapid-keys` and `openssl rand -hex 32`
2. Vercel env vars (Production): `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:you@example.com`), `PUSH_WEBHOOK_SECRET`. Redeploy.
3. Supabase SQL Editor: run `supabase/migrations/20261001000027_push_notifications.sql`, then
   `create extension if not exists pg_net with schema extensions;`
   `insert into public.push_settings (id, url, secret) values (1, 'https://weoneuz.vercel.app/api/push', '<same secret as PUSH_WEBHOOK_SECRET>');`
4. Settings -> Bildirishnomalar -> turn on -> "Sinab ko'rish".

Until step 3 is done the triggers do nothing (no settings row = no calls), so existing features are unaffected.
