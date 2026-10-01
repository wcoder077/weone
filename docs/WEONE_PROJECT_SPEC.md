# WeOne — Product & Technical Spec

Source of truth for what to build. `CLAUDE.md` holds the working rules.
Sections marked **[FIX]** correct problems found in the first version of this spec.

Goal: a complete, working web app where every page and every button works end to end with a real database. Simple and clean — no over-engineering, no features outside this file.

Core loop: Profile + skills → find people → connect / collaborate → build a project → journey grows → better discovery.

---

## 1. Stack

Next.js (App Router, latest stable) + TypeScript strict + Tailwind CSS + shadcn/ui (Button, Input, Dialog, Sheet, Tabs, Select, Checkbox, Switch, Avatar, Toast) + Supabase (Postgres, Auth email + Google, Storage for avatars and project logos, Realtime for messages and notifications) + zod. Server Actions for mutations, Server Components for data loading. pnpm. Deploy to Vercel. `@supabase/ssr` for auth.

Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. No secret key in the app.

---

## 2. Design system

Dark mode first. Calm, clean, friendly — like Linear or Telegram. Content first, almost no decoration.

| Token | Value | Use |
|---|---|---|
| `bg` | `#08070D` | page background |
| `surface` | `#11101A` | panels, sidebars |
| `card` | `#171522` | cards |
| `border` | `#26233A` | 1px borders |
| `text` | `#F4F5F8` | main text |
| `muted` | `#8E8BA3` | secondary text |
| `primary` | `#3D4BFF` | main button, active tab, selected chips ONLY |
| `success` | `#22C55E` | "available" dot ONLY |
| `danger` | `#F05252` | errors |

- Font: Inter. Page title 32px (mobile 24px), card title 16px semibold, body 15px, nothing below 13px.
- Radius: cards 20px, buttons and chips pill.
- Glass (white 8% fill, `backdrop-blur-xl`, 1px white 12% border) ONLY on: top navbar, mobile bottom tab bar, modals and sheets.
- One very soft blue radial glow at the top of the page. No other gradients, no purple, no emojis, no tilted stickers, no percentages.
- At most one primary button per card.
- Tokens as CSS variables from day one (light mode later).
- Logo: wordmark "we1", the "1" in primary blue.

**Responsive (mobile-first):**
- Desktop (≥1024px): top navbar — logo, search "Search people, skills, projects", links Home · Discover · Projects · Messages, bell, avatar menu. Content max width 1200px.
- Mobile: top bar (logo, bell, avatar) + floating glass bottom tab bar: Home, Discover, Projects, Messages, Profile. Touch targets ≥ 44px. No horizontal page scroll.

Every list and page: loading skeleton, empty state (what to do next + button), error state.

---

## 3. Shared components

- `SkillChip` — pill; selected = blue border + tint; click opens Discover filtered by that skill.
- `PersonCard` — avatar, name, headline, city, available dot, 3 skill chips, 1–2 reasons with ✓, outlined "Connect".
- `MatchCard` — PersonCard + "Why this person matches" checklist + actions: View profile, Connect, Collaborate.
- `ProjectCard` — logo, name, one-line description, status pill (Idea / Building / Launched / Looking for members), 3 tech chips, stacked member avatars + count, "Needs: <role>".
- `JourneyItem` — type pill, title, organization, role, dates, result pill, "Verified" mark, skills used.
- `ActivityRow` — avatar + "<name> <action>" + time.
- `EmptyState`, `ErrorState`, card skeletons.
- `ConnectButton` — Connect / Pending / Connected / Accept.
- `CollaborateDialog` — see section 5, item 14.

---

## 4. Database (Supabase Postgres)

SQL migrations in `supabase/migrations/`, applied with the Supabase CLI (`supabase db push`). RLS on every table. Indexes on all foreign keys and search columns.

```
profiles            id (= auth.users.id), username (unique), full_name, avatar_url, headline, bio,
                    city, is_online_ok (bool), available (bool), open_to text[],
                    looking_for text[], languages text[], interests text[],
                    onboarded (bool), created_at, search tsvector (generated, own columns only — see FIX 1)
skills              id, name (unique, citext), category
user_skills         user_id, skill_id, level ('learning'|'comfortable'|'strong'), PK(user_id, skill_id)
education           id, user_id, institution, degree, field, start_year, end_year
journey_items       id, user_id, type ('job'|'internship'|'hackathon'|'competition'|'course'|
                    'workshop'|'meetup'|'conference'|'project'|'open_source'|'volunteer'|'other'),
                    title, organization, role, result, description, start_date, end_date,
                    verified (bool, default false — NOT writable by users, see FIX 3), created_at
journey_item_skills journey_item_id, skill_id
journey_confirmations journey_item_id, confirmer_id, created_at, PK(journey_item_id, confirmer_id)   -- [FIX 3]
projects            id, owner_id, name, slug (unique), tagline, description, category,
                    status ('idea'|'building'|'launched'), is_looking (bool), city, is_online,
                    logo_url, github_url, demo_url, created_at, search tsvector (generated)
project_skills      project_id, skill_id
project_members     project_id, user_id, role, PK(project_id, user_id)
project_roles       id, project_id, title, is_open (bool)
project_role_skills project_role_id, skill_id
join_requests       id, project_id, user_id, project_role_id, message, status ('pending'|'accepted'|'declined')
connections         id, requester_id, addressee_id, status ('pending'|'accepted'|'declined'), created_at
                    + unique INDEX on (least(requester_id, addressee_id), greatest(requester_id, addressee_id))
collab_requests     id, sender_id, receiver_id, reason ('project'|'hackathon'|'startup'|'learning'|
                    'open_source'|'mentorship'), project_id (nullable), message, status, created_at
conversations       id, created_at
conversation_members conversation_id, user_id
messages            id, conversation_id, sender_id, body, kind ('text'|'project_invite'),
                    project_id (nullable), created_at
notifications       id, user_id, type, actor_id, entity_id, read (bool), created_at
activities          id, user_id, type ('joined_project'|'launched_project'|'added_journey'|
                    'started_project'|'connected'), entity_id, created_at
```

**Skill evidence is computed, not stored:** for each user skill, count projects (via `project_members` + `project_skills`) and journey items (via `journey_item_skills`) that use it. Show as "React · 4 projects · 2 events". SQL view `user_skill_evidence`.

### [FIX 1] Search on skills
A generated column can only use columns of the same row. So:
- `profiles.search` = full_name + username + headline + bio.
- `projects.search` = name + tagline + description.
- Skill matching is done with a JOIN on `user_skills` / `project_skills` inside the search query, not inside the tsvector.

### [FIX 2] Public landing page data
RLS allows reads only for signed-in users, but the Welcome page shows real preview cards. Do NOT open tables to `anon`. Create `security definer` functions that return only safe fields and grant `execute` to `anon`:
- `public_people_preview(limit int)` → full_name, username, avatar_url, headline, city, top 3 skill names
- `public_projects_preview(limit int)` → name, slug, tagline, status, logo_url, top 3 skill names
Set `search_path` explicitly in every security definer function.

### [FIX 3] Journey verification
- `verified` must not be writable by users: revoke UPDATE on that column from `authenticated`, set it only from a trigger.
- "Same event" rule: both items have the same `type` (hackathon or competition), same `lower(title)`, same `lower(organization)`, and `start_date` in the same year and month.
- Confirming inserts a row into `journey_confirmations`. RLS on insert: confirmer is `auth.uid()`, confirmer is not the item owner, and confirmer owns a matching item (check inside a security definer helper).
- A trigger on `journey_confirmations` insert sets `journey_items.verified = true`.

### [FIX 4] Messaging and conversations
- Users must not insert into `conversations` / `conversation_members` directly (otherwise anyone can add themselves to any chat).
- Create `start_conversation(other_user uuid)` as a security definer function: allowed only if an accepted connection OR an accepted collab request exists between the two users; returns the existing conversation if one already exists.
- `messages` insert policy: `sender_id = auth.uid()` AND sender is a member of the conversation.

### [FIX 5] Notifications and activities
RLS "notifications: only the owner" means a user cannot insert a notification for someone else. Create notifications and activities with triggers (security definer) on: connections, collab_requests, join_requests, project_members, messages (project_invite), journey_confirmations. Users can only select and update (`read`) their own notifications.

### RLS summary
- profiles, projects, journey, skills, education, user_skills, activities: select for any signed-in user; insert/update/delete only by owner.
- project_members, project_roles, project_role_skills: write only by project owner.
- connections, collab_requests, join_requests: visible only to the two sides (for join_requests: requester + project owner).
- conversations, messages: only conversation members.
- notifications: only the owner.

### Seed (`supabase/seed.sql`)
~40 skills in categories (Programming, Design, Product, Tools, Marketing), 20 realistic demo users (Uzbek names; cities Tashkent, Samarkand, Bukhara, Fergana, Namangan; student/junior level), 8 projects with members and open roles, journey items, a few connections and messages. The app must look alive right after seeding.

---

## 5. Pages

Routes are suggestions; keep them clean.

**Public**
1. `/` Welcome — heading "Find people. Build things. Grow together.", one line, search input "I need a backend developer for a hackathon" (→ sign up → Find people with the text), 3 "How it works" steps, preview cards from `public_*_preview` functions (FIX 2).
2. `/signup`, `/login` — Google + email. Redirect to onboarding if not onboarded.

**Onboarding** (`/onboarding`, 3 steps, progress bar, can go back)
3. Step 1 About you: photo, full name, username (live unique check), city, headline.
   Step 2 Skills: search + pick 3–10 from `skills`, grouped by category, choose level.
   Step 3 Looking for: collaboration, hackathon team, startup, internship, freelance, mentorship, learning, open source; open to online.
   Finish → Home.

**Main**
4. `/home` — "People for you" (3 cards: shared skills + looking_for + city), "Projects for you" (open roles matching my skills), "Make your profile stronger" (real checklist: missing bio, education, project, proof for a skill), "From your network" (activities of my connections). No likes, comments, posts.
5. `/discover` — tabs People · Projects. Full-text search (FIX 1). Filters: skills (multi), city, role/headline keyword, available, languages, online. Filters in URL query string. Pagination 20/page. Card "Need someone specific?" → Find people.
6. `/find` **Find people (most important feature)** — form: role (text), for (hackathon / startup / project / learning), required skills (multi), city or online, open to collaboration only. Results sorted by number of matched criteria, then by skill evidence. Every result shows WHY: ✓ each required skill they have, ✓ has hackathon experience (if for = hackathon and they have a hackathon journey item), ✓ same city / online OK, ✓ open to collaboration, ✓ looking for the same thing. No percentages. One readable, commented SQL function `find_people(...)` returning people + matched reasons.
7. `/projects` — tabs For you · Looking for members · My projects. Filters: category, stack, status. "Create project" button.
8. `/projects/[slug]` — header (logo, name, tagline, status, owner, links), About, Tech stack, Team, Open roles (skills + "Ask to join" → join request with message), Details. Owner: edit, manage members, accept/decline join requests, add/close roles.
9. `/projects/new` and edit — name, tagline, description, category, status, stack, open roles (title + skills), links, logo upload. Creator becomes member with role "Owner". Creates an activity (trigger).

**Profile**
10. `/u/[username]` — avatar, name, headline, bio, city, available dot, "Open to: …". Others see: Connect (state aware), Message, Collaborate. Me: Edit profile, Share (copy link).
    Left: About, Skills with evidence, Education, Looking for, Languages, Interests.
    Right tabs: Journey (by year, newest first, Verified marks) · Projects · Highlights (items with result like Winner/Finalist + launched projects).
11. `/settings/profile` — everything from onboarding + bio, languages, interests, education list.
12. Add / edit journey item (dialog desktop, sheet mobile): type, title, organization, role, dates, result, skills used, description. "Confirm" on other people's hackathon/competition items if I have a matching item (FIX 3).
13. Add skill (dialog): search skill, level, "Where did you use it?" — checkboxes of my projects and journey items, live preview "React · 2 projects · 1 event".
14. ~~Collaborate dialog~~ — replaced (2026-10) by connection requests with a first message (≤ 200 graphemes, optional image, emoji). Chat opens only for accepted connections. `collab_requests` is kept read-only for history.

**Communication**
15. `/messages`, `/messages/[id]` — conversation list (last message, unread), chat with Realtime, "Invite to project" sends a `project_invite` message rendered as a card with "View project" / "Join". Messaging only after accepted connection or accepted collab request — enforced in the database (FIX 4).
16. `/notifications` — tabs All · Requests. Types: connection request/accepted, collab request, join request, project invite, new project member, journey confirmation. Inline actions. Unread count on the bell (Realtime).

**Added (2026-10):** `/posts` text feed (≤ 500 graphemes, author edit/delete; replaces "Projects" in the navbar — projects are managed from the profile), profile "Connections" tab, light/dark/system theme.

**Added (2026-10, posts v2):** one photo or video per post (≤ 20 MB), likes, comments (`/posts/[id]`), views (counted once per viewer, never the author), reposts and "copy link" from the "…" menu under each post.

**Out of scope:** events pages, opportunities, communities, AI features, admin panel, payments, Telegram login.

---

## 6. Quality rules

- Never expose the secret key. All writes through server actions that check the session and validate with zod. RLS protects data even if the client is modified. No raw HTML rendering of user text.
- Images: validate type and size (≤ 2 MB) before upload; store paths.
- Accessibility: labels, visible focus, keyboard-usable dialogs, alt text on avatars.
- Performance: server-render lists, paginate, DB indexes, `next/image`.
- Code: small components, clear names, no dead code, no `any`. Queries in `lib/queries/*`, actions in `lib/actions/*`.
- `.env.example` with all variables; `README.md` with setup (Supabase project, migrations, seed, run, deploy).

---

## 7. Phases

After each phase: `pnpm lint`, `pnpm typecheck`, `pnpm build`, fix errors, commit, 3–5 lines in `PROGRESS.md`.

1. Setup: Tailwind tokens, shadcn/ui, Supabase clients, fonts, layout (navbar, mobile tab bar), shared empty/error/skeleton components.
2. Database: migrations, RLS, views, security definer functions (FIX 2–5), `find_people`, seed.
3. Auth + onboarding.
4. Profile, edit profile, education, journey, skills with evidence, add skill.
5. Projects: list, details, create/edit, roles, join requests.
6. Discover + Find people.
7. Connections, collaborate, notifications.
8. Messages with Realtime and project invites.
9. Home.
10. Polish: 390px and 1440px, empty/loading/error states, README, final build.

Stop and ask only if blocked (e.g. missing Supabase keys).
