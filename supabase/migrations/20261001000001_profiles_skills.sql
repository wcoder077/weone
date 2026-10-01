-- Profiles, skills, user skills, education.
-- Conventions for all migrations:
--   * RLS is enabled on every table; reads require a signed-in user.
--   * security definer functions always set search_path = '' and use qualified names.

create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  username      extensions.citext not null unique
                check (username ~ '^[a-z0-9_]{3,30}$'),
  full_name     text not null default '' check (char_length(full_name) <= 80),
  avatar_url    text,
  headline      text check (char_length(headline) <= 120),
  bio           text check (char_length(bio) <= 1000),
  city          text check (char_length(city) <= 60),
  is_online_ok  boolean not null default true,
  available     boolean not null default true,
  open_to       text[] not null default '{}',
  -- Onboarding step 3 values; find_people() maps its "for" option onto these.
  looking_for   text[] not null default '{}'
                check (looking_for <@ array[
                  'collaboration', 'hackathon_team', 'startup', 'internship',
                  'freelance', 'mentorship', 'learning', 'open_source']::text[]),
  languages     text[] not null default '{}',
  interests     text[] not null default '{}',
  onboarded     boolean not null default false,
  created_at    timestamptz not null default now(),
  -- FIX 1: only this row's own columns; skills are matched with joins.
  search        tsvector generated always as (
                  to_tsvector('simple',
                    coalesce(full_name, '') || ' ' ||
                    coalesce(username::text, '') || ' ' ||
                    coalesce(headline, '') || ' ' ||
                    coalesce(bio, ''))
                ) stored
);

create index profiles_search_idx on public.profiles using gin (search);
create index profiles_city_idx on public.profiles (city);
create index profiles_looking_for_idx on public.profiles using gin (looking_for);
create index profiles_languages_idx on public.profiles using gin (languages);

alter table public.profiles enable row level security;

create policy "profiles: signed-in users read"
  on public.profiles for select to authenticated using (true);
create policy "profiles: owner updates"
  on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- Insert happens only through handle_new_user(); delete cascades from auth.users.

-- Creates a profile for every new auth user (email or Google).
-- Username: sanitized email prefix + random suffix; the user picks a real one in onboarding.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base text := left(regexp_replace(lower(split_part(coalesce(new.email, ''), '@', 1)), '[^a-z0-9_]', '', 'g'), 20);
begin
  if char_length(base) < 3 then
    base := 'user';
  end if;

  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    base || '_' || substr(md5(new.id::text || clock_timestamp()::text), 1, 6),
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 80),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- skills
-- ---------------------------------------------------------------------------
create table public.skills (
  id        uuid primary key default gen_random_uuid(),
  name      extensions.citext not null unique check (char_length(name) between 1 and 40),
  category  text not null default 'Other'
            check (category in ('Programming', 'Design', 'Product', 'Tools', 'Marketing', 'Other'))
);

alter table public.skills enable row level security;

create policy "skills: signed-in users read"
  on public.skills for select to authenticated using (true);
-- Users may add a missing skill (Phase 4 "Add skill"); nobody edits or deletes skills.
create policy "skills: signed-in users add"
  on public.skills for insert to authenticated with check (category = 'Other');

-- ---------------------------------------------------------------------------
-- user_skills
-- ---------------------------------------------------------------------------
create table public.user_skills (
  user_id   uuid not null references public.profiles (id) on delete cascade,
  skill_id  uuid not null references public.skills (id) on delete cascade,
  level     text not null check (level in ('learning', 'comfortable', 'strong')),
  primary key (user_id, skill_id)
);

create index user_skills_skill_id_idx on public.user_skills (skill_id);

alter table public.user_skills enable row level security;

create policy "user_skills: signed-in users read"
  on public.user_skills for select to authenticated using (true);
create policy "user_skills: owner inserts"
  on public.user_skills for insert to authenticated with check (user_id = (select auth.uid()));
create policy "user_skills: owner updates"
  on public.user_skills for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "user_skills: owner deletes"
  on public.user_skills for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- education
-- ---------------------------------------------------------------------------
create table public.education (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  institution  text not null check (char_length(institution) between 1 and 120),
  degree       text check (char_length(degree) <= 80),
  field        text check (char_length(field) <= 80),
  start_year   int check (start_year between 1950 and 2100),
  end_year     int check (end_year between 1950 and 2100),
  check (end_year is null or start_year is null or end_year >= start_year)
);

create index education_user_id_idx on public.education (user_id);

alter table public.education enable row level security;

create policy "education: signed-in users read"
  on public.education for select to authenticated using (true);
create policy "education: owner inserts"
  on public.education for insert to authenticated with check (user_id = (select auth.uid()));
create policy "education: owner updates"
  on public.education for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "education: owner deletes"
  on public.education for delete to authenticated using (user_id = (select auth.uid()));
