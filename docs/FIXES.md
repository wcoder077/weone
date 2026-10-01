# WeOne — Fix list

Work through in priority order, one group per batch. After each group: `pnpm lint && pnpm typecheck && pnpm build`, commit, push to `origin main` (Vercel deploys from it), update `PROGRESS.md`.
Rules: no features beyond this list, do not edit `CLAUDE.md`, all UI text in Uzbek.

## Priority 1 — Auth (broken, investigate first)
- [x] Investigate frequent "Juda ko'p urinish" errors and accidental repeated account creation: signup/login flow, `proxy.ts` session refresh, redirect loops, double-submits, our vs Supabase rate limiting.
- [x] Email confirmation is OFF in Supabase: signup logs the user straight in and redirects to `/onboarding` with no resubmit.
- [x] Disable the submit button while a request is in flight; clear, specific error states.
- [x] Hide "Google orqali davom etish" and the "yoki" divider on `/login` and `/signup` behind one constant (`ENABLE_GOOGLE_AUTH = false`). Keep OAuth code and callback route.
- [x] `/forgot-password`: email → `resetPasswordForEmail` with `redirectTo` → `/reset-password`.
- [x] `/reset-password`: set a new password from the recovery session, then redirect. Expired/invalid links get a clear message.
- [x] "Parolni unutdingizmi?" link on `/login`.
- [x] Report the exact redirect URL(s) used so they can be checked against Supabase Redirect URLs.
- [x] **Stop after Priority 1 is pushed** so login can be tested on the deployed site.

## Priority 2 — Missing pieces
- [x] Notification bell: red badge with unread count (display caps at 9+), clears when `/notifications` is opened, live via Realtime.
- [x] Messages: edit and delete own messages — hover menu on desktop, long-press on touch. Confirm before delete.
- [x] Profile: compact "Connections + activity" summary (connections / following / projects counts + recent activity).
- [x] Profile banner: banner behind the profile header with overlapping avatar; owner can upload / reposition / remove. Push migration 15, regenerate types.

## Priority 3 — UX / polish
- [x] Desktop `/login` and `/signup`: proper centered desktop layout (wider card, better spacing), still mobile-friendly.
- [x] Top bar and bottom tab bar hide on scroll down, show on scroll up — consistent on desktop and touch.
- [x] Chat screen: hide both bars inside a conversation, clear back/exit button at the top, restore bars on leave.
- [x] Navigation feels laggy: smooth transitions and loading states (`loading.tsx`, `useTransition`, prefetch).
- [x] Long-press: disable native context menu and text callout on app chrome and interactive elements (text stays selectable in messages and inputs).
- [x] PWA manifest: write up tradeoffs only — do not add yet.
