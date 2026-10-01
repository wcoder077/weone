# Progress

## Phase 1 — Setup (done)
- Tokens from spec §2 as CSS variables in `app/globals.css` (shadcn names mapped onto them), Inter font, `.glass` utility, soft blue top glow. Dark only.
- shadcn/ui (base-nova) with Button, Input, Dialog, Sheet, Tabs, Select, Checkbox, Switch, Avatar, Sonner, DropdownMenu, Skeleton. Button/Input are pill and 44px; Dialog/Sheet use glass.
- Supabase: `lib/supabase/{client,server,proxy,env}.ts`; root `proxy.ts` (Next 16 rename of middleware) refreshes the session only, no route guards until Phase 3.
- Layout: `(app)` route group with glass Navbar + floating MobileTabBar; shared `EmptyState`, `ErrorState`, skeletons; `loading.tsx`, `error.tsx`, `not-found.tsx`; placeholder pages for home, discover, projects, messages, profile.
- Notes: `error.tsx` uses `retry` (Next 16.3), not `reset`. Navbar search posts to `/find` (built in Phase 6); bell and avatar are static until Phases 3 and 7. `.env.local` still has the `<<PROJECT_REF>>` placeholder URL. Not yet checked visually at 390px / 1440px.

## Phase 2 — Database (done, pushed with seed)
- 8 migrations in `supabase/migrations/` + `supabase/seed.sql` (42 skills, 20 users, 8 projects, journey, connections, chats). Tested on throwaway Postgres 17 with an auth/storage shim: RLS denials, verify/reset, join accept, start_conversation, find_people, anon previews.
- Decisions: `looking_for` limited to the 8 onboarding values (find_people maps "for" onto them); `open_to` left free text. "Open to collaboration" = `profiles.available`. Users may add skills only in category `Other`.
- Extra columns: `project_members.created_at`, `join_requests.created_at`, `conversation_members.last_read_at` (unread counts). Owner row added by trigger with role "Owner".
- Request tables (connections, collab, join) allow updating only `status`; accepting a join request adds the member by trigger. Editing a journey item's event fields resets `verified`.
- Demo users have no password (`@demo.weone.example`), cannot sign in. Seed is not idempotent: run on an empty DB.
- Types: `lib/types/database.ts` via `pnpm db:types`; both Supabase clients are typed. Migration 9 revokes EXECUTE on trigger functions and RLS helpers from anon (advisor 0028/0029). Remaining advisor warnings are intended (public previews, RLS helpers). Enable leaked password protection in the dashboard (Auth settings).

## Phase 3 — Auth + onboarding (done)
- Email/password + Google sign-in (`lib/actions/auth.ts`), `/auth/callback` (PKCE code exchange, safe `next`), proxy guards protected routes → `/login?next=…`; `(app)` layout sends non-onboarded users to `/onboarding`.
- Onboarding `?step=1|2|3`: avatar upload straight to `avatars/<uid>/` (browser client, storage RLS; action re-checks URL prefix), live username check, city datalist, 3–10 skills with level picker, looking-for chips + online switch. Finish requires ≥3 skills, sets `onboarded`.
- Navbar avatar menu (profile, settings, sign out); `/profile` redirects to `/u/[username]`. `typecheck` now runs `next typegen` first.
- Project settings to check: email confirmation is ON (sign-up shows "check your email"); Google provider is OFF in Supabase Auth — enable it and add `<site>/auth/callback` to redirect URLs. Signed-in flows not yet clicked through (no test account); verified via build + route checks.

## Phase 4 — Profile (done)
- `/u/[username]`: header (avatar + available dot, headline, city, looking for), left column (about, skills with computed evidence "N loyiha · N tadbir", education, looking for, languages, interests), URL tabs Journey (by year, Verified marks) · Projects · Highlights (journey items with result + launched projects).
- Journey add/edit/delete in a responsive dialog (bottom sheet on mobile); "Tasdiqlash" shows on others' hackathon/competition items when the viewer has a matching event (TS mirror of the DB rule; RLS re-checks).
- Add skill dialog: search or create (category Other), level, "Qayerda ishlatgansiz?" (owned projects + journey items) with live evidence preview; links synced exactly. Non-owned projects count but can't be edited.
- `/settings/profile`: profile form (+ bio, languages/interests tag inputs, looking for, available/online switches), skill level/remove, education add/remove.
- Connect / Message / Collaborate buttons on others' profiles come in Phase 7.

## Phase 5 — Projects (done)
- `/projects` tabs For you (open roles matching my skills, best match first; excludes my projects) · Looking for members · Mine; URL filters category / stack / status; cards show members + "Kerak: <roles>".
- `/projects/[slug]`: header (logo, status, owner, links), about, stack, team, open roles with my matched skills highlighted, details. Join dialog (role + message); owner accepts/declines (trigger adds member), removes members, closes/reopens roles (keeps `is_looking` in sync); members can leave; two-step delete.
- `/projects/new` + `/edit`: stack picker, roles editor (title, skills, open), logo upload on edit only (storage folder needs the project id). Slugs = name + 4-char suffix. Creator role stored as "Owner", shown as "Asoschi".
- Verification: local Supabase stack (`supabase/config.toml`, ports +100 to avoid another local project) + headless Playwright click-through of signup → onboarding → journey → skill → project → settings at 390px. Dialog/sheet glass made opaque (`glass-panel`) after screenshots showed text bleeding through.

## Phase 6 — Discover + Find people (done)
- `/discover` People · Projects: full-text (`search` tsvector, websearch syntax) OR skill-name prefix match via join (FIX 1); filters in the URL: skills (must have all), city, role keyword (headline), language, available, online; projects: skills + status. 20 per page, removable active-filter chips, "Need someone specific?" card → `/find`.
- `/find`: requirements form (role, for, skills, city, online, open-only) → `find_people()`; every result shows a "Nega mos" checklist (skills, role, hackathon experience, city/online, open, same goal). No percentages. Free text from Welcome (`?q=`) pre-fills purpose + role (filler words dropped).
- Navbar search now goes to `/discover` (people, skills, projects); `/find` stays the requirement-based search. Shared `PersonCard`, `MatchReasons`, `Pagination`, URL helpers in `lib/url.ts`.
- Connect / Collaborate buttons on cards arrive with Phase 7.
