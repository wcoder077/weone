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

## Round 3 / 2 — Bar shape (done)
- Header: floating glass bar inset 8–12 px from the edges, 20 px bottom radius (`rounded-b-bar`), border without top edge, soft themed shadow (`--bar-shadow`). Mobile tab bar: docked to the bottom, 20 px top radius, upward shadow, safe-area padding (`viewport-fit=cover`). Verified in both themes at 390 and 1440 px.

## Round 3 / 3 — Profile banner (done in Fixes P2)
- Done: migration 15 (applied locally only, NOT pushed): `profiles.banner_path` (check: own folder only) + `banner_position` 0–100, public `banners` bucket (5 MB, jpg/png/webp, owner-folder writes) — SQL-tested. `saveBanner()` server action (path regex, file exists, old file deleted). `lib/image.ts` client validate + downscale/WebP compression (reusable for post images).
- Left: banner display in `ProfileHeader` (image or brand gradient, bottom fade, avatar overlapping), owner editor dialog (upload / position slider / remove), push migration 15 + `pnpm db:types`.
- Then: milestone 4 (post images + feed as /home), milestone 5 (recommendations with `calculateMatchScore` + tests, /find default list).

## Fixes P1 — Auth (done, see docs/FIXES.md)
- Cause of "Juda ko'p urinish": Supabase's built-in email sender limit (`429 over_email_send_rate_limit` on `POST /signup` in auth logs), not our code (we have no rate limiting). Each signup sent a confirmation email; links pointed at localhost and PKCE links only worked in the same browser, so people retried → repeated accounts. No proxy redirect loop found; submit buttons were already disabled while pending.
- Email confirmation is now off: `signUp` returns a session → straight to `/onboarding`. Rate-limit, network, invalid-email, existing-account, unconfirmed-account errors each get their own Uzbek message; email/name stay filled after an error.
- Google button + "yoki" hidden behind `ENABLE_GOOGLE_AUTH` (lib/constants.ts); action + callback kept.
- `/forgot-password` → `resetPasswordForEmail` (redirectTo `<origin>/auth/callback?next=/reset-password`); `/reset-password` sets the new password → `/home`. `/auth/callback` accepts `code` (default template, same browser) and `token_hash`+`type` (custom template, any device); failed recovery links → `/forgot-password?error=link`.
- Note: reset emails still go through Supabase's built-in SMTP (a few emails/hour per project). Custom SMTP is needed for real traffic.

## Fixes P2 — Missing pieces (done)
- Bell already had the red 9+ badge, Realtime count and clear-on-open; now also re-syncs when the layout re-renders with a fresh count.
- Migration 16 (pushed): senders edit (`body` only, `edited_at` by trigger) and delete their own messages in accepted chats; image first-messages excluded. Bubble menu (Nusxa olish / Tahrirlash / O'chirish) via hover "⋯" on desktop, long-press or context menu on touch; delete asks first; edits and deletes arrive live via Realtime UPDATE/DELETE.
- Profile sidebar "Bog'lanishlar va faoliyat": connections + projects counts and the 4 latest activities (skeleton / empty / retry). No follow feature exists, so "following" is not shown.
- Banner: migration 15 pushed with a missing owner-only storage SELECT policy (list/remove needed it); banner behind the header with the avatar overlapping; owner editor uploads (WebP, ≤1800 px), repositions (vertical slider), removes; unsaved uploads are deleted. Types regenerated (`pnpm db:types`).
- Also fixed: `connectedIds()` on Home didn't filter by the current user (since migration 13 everyone's accepted connections are readable), so "Tarmog'ingizdan" and "Siz uchun odamlar" used other people's connections.

## Fixes P3 — UX / polish (done)
- Auth pages: logo above a wider card (420 → 500 px from sm), roomier padding, larger heading; checked at 390 / 1440, no overflow.
- Scroll hide: scroll position clamped to the real range, so iOS bounce at the bottom no longer flashes the bars back.
- Conversations below lg are a full-screen view: both bars hidden (`isConversationPath`), "Orqaga" button top-left, safe-area padding, overscroll contained; leaving the chat restores the bars. Desktop keeps the list + chat split under the navbar.
- Navigation: Vercel functions pinned to `syd1` (vercel.json) next to the Supabase DB in ap-southeast-2 — before, every query crossed US East ↔ Sydney. Route skeletons for home, posts, notifications, settings and project forms (partial prefetch); `useLinkStatus` bar on nav links; filters and Find use `useTransition` with a pending state; opacity-only section fade (`PageFade`).
- Long-press on touch: CSS stops callout/selection on links, buttons, images and nav; `ContextMenuGuard` blocks the native menu there (inputs keep theirs, desktop right-click untouched). Messages and posts text stays selectable. PWA manifest not added (tradeoffs reported, waiting for a decision).

## Move to Frankfurt (done)
- Supabase project relinked to `xyrcpyrpgthshjilazlh` (Frankfurt, eu-central-1): migrations 1–16 + seed pushed with `db push --include-seed`, no errors; regenerated types unchanged.
- Vercel functions moved `syd1` → `fra1` to sit next to the database. `.env.local` / Vercel env vars are updated by the owner.

## Unread badges, desktop back, PWA, E2E on Frankfurt (done)
- Migration 17 `my_unread_counts()` → red 9+ badge on Xabarlar (navbar + tab bar) and exact per-chat counts; desktop chat "Orqaga"; minimal PWA (manifest, icons, iOS tags, no service worker) + `BackLink` on every inner page.
- E2E with two UI-created accounts passed: signup → onboarding → /home, login, request + accept, notification badge, send/edit/delete live, unread badges, mobile long-press + full-screen chat, banner upload/position; signed-in crawl at 390/1440 clean.
- Fixed on the way: Realtime channels joined as anon (no live updates anywhere; `subscribeWithAuth`), open redirect via `/\` in `next`, missing security headers, `/posts` missing from the proxy guard, Base UI default-value warning on auth forms.

## Optional username (done)
- Username is no longer forced: onboarding and settings show an empty field (placeholder "Foydalanuvchi nomi") while the profile still has the generated `<prefix>_<6 hex>` handle; leaving it empty keeps the current one (`optionalUsernameSchema`). Typing one validates, checks uniqueness and replaces it.
- The DB column stays `not null unique` because `/u/<username>` links depend on it; generated handles are hidden in the profile header (`isGeneratedUsername`). No migration.

## Scroll-hide on every device (done)
- Bars never hid on phones/desktops with `prefers-reduced-motion` (Android "remove animations", battery saver): the hook returned early. Now they always hide on scroll down; reduced motion only removes the slide animation. Hidden bars also drop their shadow so no edge line stays visible.

## Profile banner fade (done)
- Banner bottom now fades into the card colour (`from-card via-card/60 to-transparent`, bottom 20 % only; top 80 % stays fully clear), so it blends in both light and dark themes. Editor button stays on top and clickable.

## Chat bars like Telegram (done)
- Why the header vanished while typing: on mobile the keyboard shrinks the visual viewport, not the layout viewport, so the `fixed inset-0` chat slid off the top. `useVisualViewportFit` now pins the chat to the visible area (`--vv-top` / `--vv-height`) and keeps the last message in view.
- Header: arrow-only back button on mobile (text on desktop), avatar, name, headline. Composer: one pill with the emoji button on the left, text, round send button. Attachments (paperclip: photo, video, file) come next and need a migration.

## Chat attachments (done, migration 18 applied via SQL Editor)
- Paperclip in the composer opens Rasm / Video / Fayl; the picked file is staged with a preview, optional caption, then uploaded from the browser to the private `message-attachments` bucket and sent via `sendAttachment`. Bubbles show the photo (tap = full size), a video player, or a file card with download. Attachment messages can be deleted (the file is removed too) but not edited. Chat list previews show "Rasm" / "Video" / "Fayl".
- Migration 18: 4 `attachment_*` columns with all-or-none and path-format checks (path = `<sender>/<conversation>/<uuid>.<ext>`), bucket with 20 MB and a MIME allow-list, storage policies (owner uploads/deletes, conversation members read), insert policy requires an existing upload, edit policy excludes attachments. Tested on Postgres 16 with a Supabase shim (8 cases).
- Changing limits later: edit `lib/attachments.ts` (ATTACHMENT_MAX_BYTES, ATTACHMENT_TYPES) and update the bucket with the SQL shown at the top of the migration.

## Posts v2: media, likes, comments, views, reposts (done, migration 19 applied via SQL Editor)
- Under each post: views (left), like, comments (→ `/posts/[id]` with comment list + form), "…" menu with Repost (optional own comment) and "Havolani nusxalash". Counts are compact (1,2K). Composer accepts one photo/video (≤ 20 MB, same limits as chat, `lib/attachments.ts`), uploaded to the private `post-media` bucket and shown through signed URLs.
- Migration 19: media columns, `repost_of`, counters on `posts` kept by triggers (clients cannot write them), `post_likes` / `post_comments` / `post_views` with RLS, `record_post_views()` (first view per user only, never the author, returns the new ids), `post-media` bucket + policies, insert policy (media must exist; a repost must point at an original, not at another repost). Reposts are deleted with their original (cascade). Tested on Postgres 16 with a Supabase shim; the test found and fixed a policy bug (unqualified `repost_of` inside the subquery).
- Not done: notifications for likes/comments, editing comments, comment replies, a repost counter in the UI (stored in `repost_count`).

## Profile stats open their lists (done)
- Sidebar card now shows Post · Bog'lanish · Loyiha in one compact row (smaller boxes, 1,2K format). Each links to its tab with `#profile-tabs`, so on phones the page scrolls to the list instead of seeming to do nothing. New "Postlar" tab lists the person's posts and reposts (latest 50) with the full post card (likes, comments, views, menu).

## Home = post feed with recommendations (done)
- `/home` is now mostly posts (no composer: posting stays on `/posts`): the latest 20 posts, a swipeable "Siz uchun odamlar" row after the 3rd post (up to 8 small cards with reasons + Connect) and a "Siz uchun loyihalar" row after the 8th; short feeds get both after the last post; empty feed shows an empty state plus both rows. "Ko'proq postlar" continues on `/posts`. Sidebar (profile checklist, network) unchanged.
- Recommendation errors don't break the feed (they just disappear). Shared `FeedSkeleton` for /home and /posts.

## Swipe between main tabs (done)
- On Asosiy / Kashf / Postlar / Xabarlar / own Profil, a sideways swipe moves to the next/previous tab (`SwipeNavigation` in the (app) layout). The page follows the finger (half speed, rubber band at the ends), switches past 22 % of the width or on a quick flick, and the new page slides in from that side. Neighbour tabs are prefetched.
- Smoothness: passive touch listeners, styles written in requestAnimationFrame (no React re-render while dragging), direction locked after 10 px so vertical scrolling is untouched. Ignored: 24 px screen edges (browser back gesture), carousels and other horizontal scrollers, inputs, video, `[data-no-swipe]`, inner pages (post, chat, other profiles). Reduced motion: switches without the slide.
- Not tested on a real phone from the cloud container.

## Wording: "odam" → "maqsaddosh" (done)
- Every UI string that said odam/odamlar (landing hero and footer, metadata/manifest, signup, onboarding, Discover tab and CTA, Find page, home carousel and empty states, messages, profile empty states, project form, navbar search) now says maqsaddosh/maqsaddoshlar. Landing hero is 34 px below 400 px width so "Maqsaddoshlarni" fits at 390 px.

## Link previews (done)
- `app/opengraph-image.png` (1200×630, the app icon on the brand background, rendered with headless Chromium) + alt text; root metadata now has `metadataBase` (NEXT_PUBLIC_SITE_URL, else Vercel's production domain), openGraph and twitter title ("we1 — Maqsaddoshlarni toping") and description ("Maqsaddoshlar tarmog'i: toping, bog'laning, birga quring."). Every shared link, including posts that redirect signed-out bots to /login, now previews with the logo and the short description. Telegram caches old previews; new links (or @WebpageBot) refresh them.

## Profile reposts (done)
- Sidebar stats are now Post · Repost · Bog'lanish · Loyiha (4 compact boxes). "Post" counts only the person's own posts, "Repost" their reposts; each opens its tab. New "Repostlar" tab (latest 50, full cards with the embedded original); "Postlar" tab now lists own posts only. Own empty state hints at the "…" menu.

## Discover: results first (done)
- Top of `/discover` is now one row: live search (`UrlSearchInput`, 300 ms debounce, `router.replace` in a transition with a spinner, Enter applies at once) + "Filtrlar" button with the active-filter count. Role, skills, city, language, "Hamkorlikka ochiq", "Onlayn" (projects: skills, status) moved into a bottom sheet (`FiltersSheet`); active filters stay as removable chips.
- With no search/filters on page 1 the People tab shows the "Siz uchun maqsaddoshlar" carousel first, then "Barcha maqsaddoshlar · N". The results Suspense has no key, so a new search keeps the current list until the new one arrives (no skeleton flash). The "/find" card moved under the results.

## Chat list: dividers, swipe actions, mute / pin / delete for me (done, migration 20 applied via SQL Editor)
- Thin dividers between chats. Swipe a chat left (touch) to reveal Ovozsiz / Qadash / O'chirish; mouse and keyboard get the same actions in a "…" menu. One row open at a time; a tap on an open row closes it. Rows are `data-no-swipe`, so the tab swipe doesn't fire on them.
- Migration 20: `conversation_members.muted / pinned_at / hidden_at` (own row only, column grants), `my_unread_counts()` now also returns `muted`. Muted chats don't count in the nav badge (grey per-chat count, bell-off icon); pinned chats are listed first; "O'chirish" = delete for me (hides the chat and its older messages on my side only, marks read, unpins; a new message brings it back). Tested on Postgres 16 (6 cases).

## Green dot = online now (done)
- The avatar dot used to mean `available` (open to collaboration); now it means "online right now". `OnlinePresenceProvider` (in the (app) layout) joins one Supabase Realtime Presence channel keyed by the user id; a user is online while one of their tabs is open and visible (hidden tab / closed app → untrack, dot disappears within seconds). No database writes, no migration.
- `UserAvatar` takes `userId` instead of `available`; dots now also appear in the chat list, chat header, posts and comments. Profile header shows "Onlayn" when online; "Hamkorlikka ochiq" keeps its text with a handshake icon instead of a green dot. CLAUDE.md's "success = available dot only" now reads as "online dot only" (file not edited).
- Trade-off: the presence channel is public (any client with the publishable key can join and see online user ids, or appear online under a fake key). Acceptable for now; a private channel with Realtime RLS would close it.

## Default banner and avatar (done)
- `public/defaults/banner.jpg` (1500×500, dark with soft brand-blue light and a faint dot grid, rendered with headless Chromium, 27 KB) is shown on every profile until the user uploads their own banner; the position slider applies only to uploaded banners. `public/defaults/avatar.svg` (neutral user silhouette) replaces the initials wherever someone has no photo (initials still show while it loads). Constants `DEFAULT_BANNER` / `DEFAULT_AVATAR` in `lib/url.ts`.

## Compact recommendation cards (done)
- "Siz uchun maqsaddoshlar" cards (home + discover): 160 px wide instead of 220, tighter padding, 14 px name, one-line subtitle, a single reason line ("✓ Python +2"), hidden scrollbar (row still swipes). Connect button keeps the 44 px touch height.

## Read receipts ✓ / ✓✓ (done)
- My messages show one grey tick (sent) or two blue ticks (read) next to the time, Telegram-style; the chat list shows the same tick before the time when the last message is mine. "Read" = the other member's `last_read_at` is at or after the message (compared as dates).
- Live without a migration: when a chat marks itself read, `markConversationRead` returns the new time and the chat broadcasts it on the chat's Realtime channel (re-sent on every join, so an early announce isn't lost); the other open chat turns ✓ into ✓✓ at once. `subscribeWithAuth` got an `onSubscribed` callback. Trade-off: broadcasts aren't verified, so a modified client could fake "read" for its own side only.

## Compact person cards (done)
- `PersonCard` (Discover, Find): 16 px padding, 40 px avatar, name + one line "headline · city", 2 small skill chips (matched first, highlighted, never wrapping) and "+N" in the same row as the connect button (40 px), so a card is about half its old height. "Profilni ko'rish" button removed: the whole card opens the profile (stretched link), the action buttons sit above it.

## Chat background pattern + replies (done, migration 21 applied via SQL Editor)
- Chat background: soft top tint + a faint doodle pattern (chat, code, star, bulb, heart, send, coffee, music, bolt, smile; 240 px tile). Two files, `public/patterns/chat-dark.svg` (light strokes 7 %) and `chat-light.svg` (brand-blue strokes 10 %), switched by the `--chat-pattern` theme token.
- Replies: "Javob berish" in the message menu (now on everyone's messages: reply, copy; own: edit, delete), long-press on touch, or swipe a bubble (own messages left, the other person's right; icon fades in, light haptic); on desktop double-click any message. The composer shows "Name ga javob" with the quoted line (✕ or Esc cancels). Replies show the quote at the top of the bubble; tapping it scrolls to and highlights the original. Quotes outside the loaded 100 messages are fetched once; live replies resolve the quote from the list; deleting a quoted message drops the quote (`on delete set null`).
- Migration 21: `messages.reply_to` + index; insert policy requires the quoted message to be in the same conversation. Tested on Postgres 16 (4 cases).

## Default banner follows the theme (done)
- `public/defaults/banner-light.jpg` (same composition on a light background) next to the dark one; the profile shows the light file in light mode and the dark one in dark mode (`dark:` variant), until the user uploads a banner.

## Hold an avatar to see the photo (done)
- `AvatarPreview` (used by `UserAvatar` whenever there is a real photo): press and hold 0.5 s (touch or mouse) → the photo opens large and round (min(78vw, 340 px)) with the name, over a see-through blurred backdrop; tap anywhere or Esc closes. Moving > 10 px cancels (scrolling/swiping still work). The click after a hold is swallowed, so the link around the avatar doesn't open; overlay events don't bubble to parent links. Native long-press menu is suppressed on avatars. Default-avatar users get no preview.

## Images open in the same blurred viewer (done)
- Shared `MediaOverlay` (portal, see-through blurred backdrop, tap/Esc closes, events kept from reaching parent links/bubbles) now backs the avatar preview and the new `ImageLightbox`. Chat photo attachments, first-message images and post photos open large (`max-h-85dvh`, rounded, object-contain) on tap instead of a new tab.

## Activity strip + statistics page (done)
- Profile sidebar card: under the four stats, a "Faoliyat · 12 hafta · N ta" strip with weekly columns (56 px high, primary colour, 2 px gaps, 4 px rounded tops, hover shows the week and count). Tapping it opens `/u/[username]/stats`.
- `/u/[username]/stats`: headline tiles (last 12 weeks, active days, busiest week, all-time total), a large weekly chart with axis + a "Jadval ko'rinishi" table, small multiples per kind (posts, reposts, connections, projects, journey, comments; all-time total + 12-week bars), and a "Nima qachon bo'ldi" timeline grouped by day (latest 60, linked to the post/profile/project). Loading skeleton, empty and retryable error states.
- Data: `getActivityStats()` reads the person's own rows (posts/reposts, accepted connections, project memberships, journey items, comments), no migration. Single-series charts only (no legend needed); primary passes the palette validator on both card surfaces.

## Chat no longer slides sideways (done)
- The swipe-to-reply icon sat outside the bubble and widened the message list, so the whole chat could be dragged left/right. The list is now `overflow-x-hidden` + `touch-action: pan-y`, and the icon sits behind the bubble (revealed as it slides).

## Banner ambient glow (done)
- The profile banner no longer fades to plain card colour (a dark banner looked washed out in light mode). A blurred, slightly enlarged copy of the banner sits behind the header and fades out downward (mask), so the banner's own colours spill into the card; the banner itself dissolves into that glow at the bottom. Works for uploaded and default banners (light/dark files), 45 % in light mode, 50 % in dark.

## Browser tab icon (done)
- Tab icon is the we1 logo: `app/icon.png` (192 px, Next icon convention) plus `app/favicon.ico` rebuilt from it (16/32/48 px PNGs inside an ICO) for browsers that request /favicon.ico directly; the scaffold's Next.js/Vercel favicon is gone.

## Profile avatar ring fix (done)
- On wide screens the avatar wrapper (flex row) stretched to the header's height, so its white card background showed as a tall pill under the avatar once the banner glow tinted the card. The wrapper is now `self-start`, `h-fit`, `flex` (no baseline gap) and has no background; only the card-coloured ring remains.

## Images are shrunk before upload (done)
- `shrinkImage()` (lib/image.ts): fits a photo inside N×N and re-encodes it as WebP 0.82 in the browser; GIFs, undecodable files and anything that wouldn't get smaller are kept as they are. Measured in Chromium: a 4000×3000 JPEG of 3.97 MB → 1600×1200 WebP of 285 KB (≈14× smaller); 512 px avatar ≈ 48 KB.
- Used for chat photos and post photos (1600 px; shrunk when picked, then checked against the limit, send disabled while "Tayyorlanmoqda…"), first-message images (1600 px), avatars and project logos (512 px; they were uploaded at up to 2 MB and shown at 40 px). Banners already used the same compression.
- Videos in posts and chats use `preload="none"`: nothing downloads until play.
- Not done: existing files stay as uploaded (would need a one-off script with the service key); thumbnails and cacheable public post-media URLs (needs a migration).

## Storage maintenance script (done, run locally)
- `scripts/compress-storage.mjs` (service-role key from env, never in the app; `sharp` added as a devDependency, ffmpeg for videos). Default = report only. `--apply`: backs up every original to `storage-backup/<run>/`, uploads the smaller file to the same path (no database change), re-downloads and size-checks it (restores the original on mismatch), and writes manifest + ledger after every change. Photos: EXIF-rotated, fit 512/1600/1800 px per bucket, WebP 82, metadata (GPS) dropped. Videos: longer side ≤ 1280, H.264 CRF 26, AAC 96k, faststart. Only replaces when ≥ 20 % smaller; GIFs, small files and already-processed files are skipped, so it can be re-run (e.g. monthly) for new uploads. `--orphans` lists files no row references (older than 24 h); `--apply --delete-orphans` backs them up and deletes them (orphans are never re-encoded). `--restore <manifest>` puts everything back.
- Tested against an in-memory fake Storage: report changes nothing; apply shrinks (photo 4.4 MB → 0.46 MB, avatar 0.9 MB → 40 KB, synthetic 1080p video 13.5 MB → 0.9 MB), deletes the orphan; a second run touches nothing; restore brings every original back byte-for-byte. The test caught a backup-overwrite bug (orphan compressed then deleted), fixed before shipping.

## Feed refresh, read-more, fewer requests
- Home feed: new posts first; when nothing is new since the last visit (`feed_seen` cookie), a random mix of the 100 newest posts is shown.
- Long posts: the first paragraph (before a blank line) is the title, the rest folds behind "Yana". Display-only, so old posts get it too; the post page shows it open.
- Post media signed links are reused for 45 min per server instance, so the browser caches images instead of downloading them on every render; new uploads are sent with a 1-year cache header.
- Post views go to the server in one batched request (1.5 s window) instead of one per post; `staleTimes.dynamic = 30` reuses recently visited pages.
- `app/favicon.ico` rebuilt with RGBA PNGs (Turbopack refused the RGB ones).
- Migration 22 makes the `post-media` bucket public: post media now uses stable public URLs (CDN-cached) instead of signed links; write policies unchanged.
- Avatars, logos and banners are uploaded with a 1-year cache header (new path per upload).
- Post videos limited to 10 MB (client + migration 23 bucket limit).
- Home recommendations (people, projects) memoized per user for 5 minutes per server instance (`lib/memo.ts`).
- Chat file sending paused: `ATTACHMENTS_ENABLED = false` hides the paperclip and the action refuses; migration 23 sets the bucket limit to 1 byte. Old files stay readable.

## Scaling: Realtime, rate limits
- `subscribeWithAuth` leaves its channel after a tab is hidden for 60 s (the socket closes once no channel is left) and rejoins on return with `resumed = true`; the bell, unread badge, conversation list and open chat re-fetch what they missed. Presence uses the same helper.
- ChatView merges messages from a refreshed server render (adds missing ones, keeps those on screen).
- Migration 24: `enforce_rate_limit()` trigger caps inserts per user from the `public.rate_limits` table (posts 1/h incl. reposts, comments 20/5 min, messages 30/min, connections 30/h, projects 5/h); edit or delete a row to change a limit. Rows without a session are not limited. Actions show "Juda tez…" on `rate_limited`. Tested on Postgres 16.
- Conversation list reads `my_conversation_previews()` (migration 24): one last message per chat, body cut to 120 chars, instead of up to 500 full messages per refresh.

## Backups
- Weekly GitHub Actions backup (`db-backup.yml`): Supabase CLI dumps roles, schema and data, encrypts with `BACKUP_PASSPHRASE` (gpg AES256), keeps a 90-day artifact. Needs secrets `SUPABASE_DB_URL` (session pooler) and `BACKUP_PASSPHRASE`. Restore steps in `docs/BACKUP.md`. Storage files are not included.
- Chat images and attachments: signed links reused for 45 min per server instance (`lib/signed-urls.ts`), so reopening a chat does not re-download its files.
- Connect dialog: a request can be sent without a message ("Xabarsiz yuborish"); the first message is then a short greeting, so the DB rule "text or image" still holds.
- Proxy: a link that lands on "/" with `code` or `token_hash` (Supabase fell back to the Site URL) is forwarded to /auth/callback.
