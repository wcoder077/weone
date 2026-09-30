# Progress

## Phase 1 — Setup (done)
- Tokens from spec §2 as CSS variables in `app/globals.css` (shadcn names mapped onto them), Inter font, `.glass` utility, soft blue top glow. Dark only.
- shadcn/ui (base-nova) with Button, Input, Dialog, Sheet, Tabs, Select, Checkbox, Switch, Avatar, Sonner, DropdownMenu, Skeleton. Button/Input are pill and 44px; Dialog/Sheet use glass.
- Supabase: `lib/supabase/{client,server,proxy,env}.ts`; root `proxy.ts` (Next 16 rename of middleware) refreshes the session only, no route guards until Phase 3.
- Layout: `(app)` route group with glass Navbar + floating MobileTabBar; shared `EmptyState`, `ErrorState`, skeletons; `loading.tsx`, `error.tsx`, `not-found.tsx`; placeholder pages for home, discover, projects, messages, profile.
- Notes: `error.tsx` uses `retry` (Next 16.3), not `reset`. Navbar search posts to `/find` (built in Phase 6); bell and avatar are static until Phases 3 and 7. `.env.local` still has the `<<PROJECT_REF>>` placeholder URL. Not yet checked visually at 390px / 1440px.
