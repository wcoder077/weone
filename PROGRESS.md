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
