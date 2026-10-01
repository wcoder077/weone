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

## Phase 7 — Connections, collaborate, notifications (done)
- `ConnectButton` is state-aware (connect / request sent → cancel / accept-decline / connected). Profile, Find cards: Connect + Message (if allowed) or Collaborate; Discover cards: Connect. Reconnecting after a decline clears the old declined row first (pair-unique index).
- Collaborate dialog: reason pills, optional project (my projects), message. Accept goes through new SQL `accept_collab_request()` (migration 10, pushed): marks accepted, opens the chat via `start_conversation`, posts the request text as the first message *from the sender*, returns the chat id.
- `/notifications` (All · Requests): readable Uzbek sentences per type with entity lookups, inline accept/decline for still-pending connection/collab/join requests; marked read on visit. Bell shows a live unread badge (Realtime INSERT on own notifications).
- E2E (two users, local stack): connect → collaborate → bell count → accept connection → accept join request (member added by trigger) → accept collab → redirected to the chat → sender now sees "Xabar".

## Phase 8 — Messages (done)
- `/messages` list (other person, last message, unread = others' messages after my `last_read_at`, newest first) + `/messages/[id]` chat; two panes on desktop, list or chat alone on mobile.
- Realtime INSERT subscription per chat (RLS: members only); own sends appended from the action result, Realtime duplicates dropped by id; chat marks itself read on open and on incoming messages, then refreshes the list counts.
- "Loyihaga taklif" sends a `project_invite` (RLS: sender must be a project member) rendered as a card with "Loyihani ko'rish" / "Qo'shilish". Join = join request (only owners can add members), so the owner accepts it in one tap.
- Chat list unread counts update on navigation/refresh, not live (only the open chat and the bell are live). Fixed 390px horizontal overflow on grids (`grid-cols-1` = minmax(0,1fr)); all main pages scanned at 390px.

## Phase 9 — Home + Welcome (done)
- `/home`: "Siz uchun odamlar" (not yet connected; ranked by shared skills ×2, shared goals, same city; each card shows ✓ reasons + Connect), "Siz uchun loyihalar" (open roles needing my skills), "Profilingizni kuchaytiring" (real gaps: bio, photo, education, first project, unproven skill), "Tarmog'ingizdan" (connections' activities; skips ones about me, one line per connected pair).
- `/` Welcome (signed-in users go to `/home`): hero, search, live previews via `public_people_preview` / `public_projects_preview` (FIX 2, anon), 3 "how it works" steps with real copy. Search → `/start` stores the text in a 1-hour httpOnly cookie → sign up → onboarding → lands on `/find?q=…` with role + purpose pre-filled (E2E verified).
- Remaining for Phase 10: Google provider + leaked-password protection in Supabase dashboard, README, final visual pass (all main pages already scanned for 390px overflow), chat list unread counts are not live.

## Audit before milestones 1–7 (done)
- Fixed: Tailwind `dark:` variant targeted a `.dark` class that was never set (all shadcn `dark:` styles were ignored) → now `[data-theme=dark]`; city matching ignored apostrophe variants (`Farg'ona` vs `Fargʻona`) → migration 11 `normalize_apostrophes()` in `find_people` + wildcard city filter in Discover; `/onboarding` for onboarded users streamed a meta refresh → redirect moved into a layout (real 307).
- Uzbek wording: "Yozishuv", "Foydalanuvchi nomi", "Ochiq manba", "Ko'ngillilik", "O'rganish", "hozirgina", "Kashf etish", "Qisqa tavsif", "Bo'sh — olishingiz mumkin", consistent "…ni yuborib bo'lmadi", "So'rov yuborildi", "Holat". UI uses the plain apostrophe (o', g'); city list too.
- Crawl of all pages at 390/1440 as a signed-in user: no console errors, page errors or failed requests.

## Milestone 1 — Connection requests with a first message (done)
- Migration 12 (pushed): `grapheme_length()` (matches Intl.Segmenter for emoji ZWJ/skin tone/flags/keycaps), `send_/update_/respond_connection_request()` security definer functions; clients can no longer insert/update `connections`; status `declined` → `rejected` + `responded_at`; rejected rows can't be deleted, so the pair-unique index blocks any new request in either direction. Each conversation has `connection_id`; chat inserts require an accepted connection, so a pending sender can't write more.
- First message: ≤ 200 graphemes and/or one image (private `message-images` bucket, 5 MB, jpg/png/webp, readable by uploader + conversation members via signed URLs). Edit replaces text/image (old image deleted); cancel deletes the request, its chat and image. Unsent uploads are removed when the modal closes.
- UI: `ConnectButton` states Bog'lanish → So'rov yuborildi (edit / cancel menu) → Xabar yozish; incoming Accept / Reject + view message; rejected disabled. Reusable `EmojiPicker` (built-in set, inserts at caret), `CharCounter`, image attachment. Collaborate removed (table kept read-only for history; `accept_collab_request` dropped).
- Also fixed: `backdrop-filter` was emitted only with the -webkit prefix (no blur anywhere); dialog/sheet panels now fully opaque.
- E2E (local): limit 201 blocked, emoji = 1, image attach/send, edit + remove image, Esc closes, recipient review + accept, chat unlocked, reject → sender disabled. SQL tests for every rule incl. direct API calls.

## Milestone 2 — Connections on profiles (done)
- Migration 13 (pushed): connections SELECT = accepted for every signed-in viewer, pending/rejected only for their two sides (was: only the two sides for everything).
- Profile tab "Bog'lanishlar": one row per pair (avatar, name, headline, link); badges "Jarayonda" / "Rad etildi" / "Muvaffaqiyatli" shown only when the viewer is one of the two people (or the profile owner); skeleton, empty ("Hali bog'lanishlar yo'q") and retryable error states. Reusable `Badge`, `RetryErrorState`.
- Verified per viewer: owner sees all with badges; a third party sees accepted only; the rejected sender sees only their own row with "Rad etildi".

## Milestone 3 — Light / dark theme (done)
- Tokens per theme under `[data-theme="dark"|"light"]` (bg, surface, card, border, text, muted, primary(+hover), success, danger, on-accent, glass, glow, chat tint, own-bubble). All text pairs ≥ 4.5:1 (WCAG AA), checked with a contrast script.
- Inline head script (`THEME_SCRIPT`, lib/theme.ts) applies localStorage `weone-theme` or prefers-color-scheme before first paint and follows OS changes while on "Tizim"; `<html suppressHydrationWarning>`. Settings → "Ko'rinish": Tizim / Yorug' / Qorong'i radio group (`useSyncExternalStore`). Toasts follow the theme; `themeColor` per scheme.
- Fixed: shadcn `hover:bg-muted` / skeleton `bg-muted` used our *text* grey as a background (washed-out hover); remapped to accent/surface/border. Last hard-coded colours replaced with tokens.

## Milestone 4 — Messaging (done)
- Only accepted connections can write (RLS from milestone 1); pending chats show the first message and, in the footer, edit/cancel (sender) or accept/reject (recipient) instead of a composer; rejected chats are hidden from the list.
- Chat rebuilt as `ChatView` + `MessageBubble` + `ChatComposer`: own bubbles right (`bubble-mine` token), others left, day separators (Bugun / Kecha / date), timestamps + "tahrirlangan", auto-scroll, emoji picker at caret, Enter sends / Shift+Enter new line, text + emoji only. `chat-surface` background = soft primary tint + faint dot grid from tokens (both themes).
- Conversation list: "Jarayonda" badge for pending, live refresh on new messages (Realtime, RLS-scoped, debounced). Mobile keeps list and chat as separate screens.
- E2E: multi-line + emoji message delivered live to the other user; list preview updates live.

## Milestone 5 — Navbar behaviour and style (done)
- `useHideOnScroll`: hides the sticky header on scroll down (8 px threshold, never in the top 64 px), shows on scroll up; stays visible while focused / a menu is open; keyboard focus reveals it; with prefers-reduced-motion it never hides.
- Glass = semi-opaque token fill (dark 72 %, light 75 %) + working `backdrop-filter: blur(24px)` on navbar and mobile tab bar; modals/sheets/popovers opaque.
- Motion defaults set once: every transition 180 ms ease-out; global reduced-motion rule disables animations/transitions.

## Milestone 6 — Posts; projects move into the profile (done)
- Migration 14 (pushed): `posts` (body 1–500 graphemes via `grapheme_length`, server zod too), RLS read for signed-in users, author-only insert/update/delete, column grants (author_id, body), `edited_at` set by trigger.
- `/posts` feed (navbar "Loyihalar" → "Postlar"): composer with emoji + live "x/500", newest first, 20 per page with "Oldingi postlar", skeleton / empty / retryable error; author menu → edit (dialog) / delete (confirmation). Body = 16 px, line-height 1.6, max 65ch, `whitespace-pre-wrap`, plain text (React-escaped; `<img onerror>` test stays text).
- Projects: profile "Loyihalar" tab gets "Loyiha qo'shish", and Tahrirlash / O'chirish on owned projects (`deleteProject` now returns a result; project page redirects to the owner's profile). Existing project pages, roles, join requests, Discover tab and Home suggestions keep working (no data migration needed).

## Milestone 7 — Profile card "Profilni ko'rish" + button styling (done)
- PersonCard action row: "Profilni ko'rish" (secondary) + state-aware connect button (primary), wrapping on narrow cards; used on Discover, Home and Find.
- Buttons: primary now has a distinct hover colour (`--primary-hover`) and pressed state instead of fading; disabled = neutral fill + muted text (no 50 % wash); outline/ghost/destructive get their own disabled cue.
- Fixed 390 px overflow on profile / project / find grids (`grid-cols-1`). Regression crawl (all pages, 390 light + 1440 dark): no console errors or failed requests.
- Spec updated: posts, connections tab, themes in scope; Collaborate replaced by connection requests. CLAUDE.md left untouched (your staged edit) — its "No emojis" design rule now only applies to UI chrome, not user messages.

## Round 3 / 1 — Hide-on-scroll fixed for both bars (done)
- Why it failed: the old hook kept the header visible whenever focus was inside it; clicking any header link/button leaves focus there, so after normal navigation it never hid. The mobile tab bar never had the logic at all.
- Now one `useScrollDirection` (rAF-throttled, 8 px threshold, always shown in the top 64 px, reset on route change, off with reduced motion) feeds a `BarsVisibilityProvider`; header slides up, tab bar slides down (translateY, 200 ms ease-out). Only keyboard focus (`:focus-visible`) reveals hidden bars. Chat pages scroll inside their own panel, so the bars stay put there.
