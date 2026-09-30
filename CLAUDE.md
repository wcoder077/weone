# WeOne — Claude Code instructions

WeOne: a professional network for Gen Z. People show real skills with proof, find the right people by requirements, and build projects together. Not a LinkedIn clone.
Core promise: **Find people. Build things. Grow together.**

Full product spec: `docs/WEONE_PROJECT_SPEC.md`. **Read only the section you need for the current phase** — do not load the whole file every time.
Progress log: `PROGRESS.md`. Read it at the start of every session.

## Stack (fixed)
- Next.js (App Router) + TypeScript strict + Tailwind CSS + shadcn/ui
- Supabase: Postgres, Auth (email + Google), Storage, Realtime. Use `@supabase/ssr`.
- zod for every form and server action input
- Server Components for reads, Server Actions for writes
- pnpm. Deploy: Vercel.
- NOT allowed: other backends, ORMs, Redux, GraphQL, extra services.

## Folder conventions
- `lib/supabase/` — server/browser clients
- `lib/queries/*` — all reads
- `lib/actions/*` — all server actions (check session + zod validate first)
- `components/shared/` — SkillChip, PersonCard, MatchCard, ProjectCard, JourneyItem, ActivityRow, ConnectButton, EmptyState, ErrorState, skeletons
- `supabase/migrations/` — SQL migrations (applied with Supabase CLI, not MCP)
- `supabase/seed.sql`

## Design tokens (CSS variables from day one)
bg `#08070D` · surface `#11101A` · card `#171522` · border `#26233A` · text `#F4F5F8` · muted `#8E8BA3`
primary `#3D4BFF` (main button, active tab, selected chips ONLY) · success `#22C55E` (available dot ONLY) · danger `#F05252`
Inter font. Card radius 20px, buttons/chips pill. Glass only on navbar, mobile tab bar, modals/sheets.
No gradients except one soft blue glow at page top. No emojis, no percentages, no purple.
Full design rules: spec section 2.

## Design references (Stitch exports)
`design/screens/<screen>/screen.png` + `code.html`: welcome, sign_up, onboarding_skills_step_2_of_3, home, discover_people_1/2, projects, uzocr_project_details.
- Open ONLY the screen for the page you are building. Look at `screen.png` first; open `code.html` only if you need exact spacing.
- Match layout, hierarchy and spacing. Do NOT copy the HTML: no Tailwind CDN, no inline `tailwind.config`, no Material Symbols font. Use our Tailwind tokens, shadcn/ui and `lucide-react` icons.
- Token source: the table above wins. Ignore the Material color list in the frontmatter of `design/DESIGN.md` (`#12131c`, `#bec2ff`, etc.); its prose section is correct.
- Known Stitch mistakes, do not reproduce: overlapping name/headline text in person cards, section titles and "See all" wrapping onto two lines, placeholder "One short line about this step.", the "Events" tab (out of scope).
- Selected chip: solid primary in pickers (onboarding, filters you toggle); blue border + tint for "matched" skills on cards.
- Pages with no screen (login, onboarding 1 and 3, profile, find, messages, notifications, project form, settings): build from the spec in the same visual style.

## Non-negotiable rules
- Never expose the Supabase service role / secret key to the client.
- RLS on every table. Data must stay protected even if the client is modified.
- Users must never be able to set trust fields themselves (e.g. `journey_items.verified`).
- Every list/page: loading skeleton + empty state + error state.
- Mobile-first. Touch targets ≥ 44px. Check 390px and 1440px.
- No `any`, no dead code, small components, clear names. No raw HTML rendering of user text.

## How to work
- One phase per session. Phases are in spec section 7.
- Before writing code for a phase: show a short plan (files to create/change), then implement.
- After each phase: `pnpm lint && pnpm typecheck && pnpm build`, fix errors, commit, add 3–5 lines to `PROGRESS.md`.
- If something is unclear: choose the simplest working option and note it in `PROGRESS.md`.
- Stop and ask only when blocked (e.g. missing env keys).
- Use Context7 for current Next.js / Supabase / shadcn docs instead of guessing APIs.
- Keep answers short. Do not repeat file contents back unless asked.

@AGENTS.md
