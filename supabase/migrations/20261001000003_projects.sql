-- Projects, stack, members, roles, join requests.

create table public.projects (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 80),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  tagline      text check (char_length(tagline) <= 140),
  description  text check (char_length(description) <= 3000),
  category     text check (char_length(category) <= 40),
  status       text not null default 'idea' check (status in ('idea', 'building', 'launched')),
  is_looking   boolean not null default false,
  city         text check (char_length(city) <= 60),
  is_online    boolean not null default true,
  logo_url     text,
  github_url   text check (github_url ~ '^https://'),
  demo_url     text check (demo_url ~ '^https://'),
  created_at   timestamptz not null default now(),
  -- FIX 1: only this row's own columns; stack is matched with joins.
  search       tsvector generated always as (
                 to_tsvector('simple',
                   coalesce(name, '') || ' ' ||
                   coalesce(tagline, '') || ' ' ||
                   coalesce(description, ''))
               ) stored
);

create index projects_owner_id_idx on public.projects (owner_id);
create index projects_search_idx on public.projects using gin (search);
create index projects_status_idx on public.projects (status);
create index projects_category_idx on public.projects (category);

alter table public.projects enable row level security;

create policy "projects: signed-in users read"
  on public.projects for select to authenticated using (true);
create policy "projects: owner inserts"
  on public.projects for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "projects: owner updates"
  on public.projects for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "projects: owner deletes"
  on public.projects for delete to authenticated using (owner_id = (select auth.uid()));

-- Used by child-table policies; security definer avoids nested RLS evaluation.
create function public.is_project_owner(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.projects
    where id = p_project_id and owner_id = (select auth.uid())
  );
$$;

-- ---------------------------------------------------------------------------
-- project_skills (tech stack)
-- ---------------------------------------------------------------------------
create table public.project_skills (
  project_id  uuid not null references public.projects (id) on delete cascade,
  skill_id    uuid not null references public.skills (id) on delete cascade,
  primary key (project_id, skill_id)
);

create index project_skills_skill_id_idx on public.project_skills (skill_id);

alter table public.project_skills enable row level security;

create policy "project_skills: signed-in users read"
  on public.project_skills for select to authenticated using (true);
create policy "project_skills: owner inserts"
  on public.project_skills for insert to authenticated with check (public.is_project_owner(project_id));
create policy "project_skills: owner deletes"
  on public.project_skills for delete to authenticated using (public.is_project_owner(project_id));

-- ---------------------------------------------------------------------------
-- project_members
-- ---------------------------------------------------------------------------
create table public.project_members (
  project_id  uuid not null references public.projects (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        text not null default 'Member' check (char_length(role) between 1 and 60),
  created_at  timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index project_members_user_id_idx on public.project_members (user_id);

alter table public.project_members enable row level security;

create policy "project_members: signed-in users read"
  on public.project_members for select to authenticated using (true);
create policy "project_members: owner inserts"
  on public.project_members for insert to authenticated with check (public.is_project_owner(project_id));
create policy "project_members: owner updates"
  on public.project_members for update to authenticated
  using (public.is_project_owner(project_id)) with check (public.is_project_owner(project_id));
-- The owner removes members; a member may leave. The owner row itself stays.
create policy "project_members: owner removes or member leaves"
  on public.project_members for delete to authenticated
  using (
    (public.is_project_owner(project_id) or user_id = (select auth.uid()))
    and not exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = project_members.user_id
    )
  );

-- The creator becomes a member with role "Owner".
create function public.add_project_owner_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.project_members (project_id, user_id, role, created_at)
  values (new.id, new.owner_id, 'Owner', new.created_at)
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_project_created_add_owner
  after insert on public.projects
  for each row execute function public.add_project_owner_member();

-- ---------------------------------------------------------------------------
-- project_roles (open positions) and their skills
-- ---------------------------------------------------------------------------
create table public.project_roles (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 60),
  is_open     boolean not null default true
);

create index project_roles_project_id_idx on public.project_roles (project_id);

alter table public.project_roles enable row level security;

create policy "project_roles: signed-in users read"
  on public.project_roles for select to authenticated using (true);
create policy "project_roles: owner inserts"
  on public.project_roles for insert to authenticated with check (public.is_project_owner(project_id));
create policy "project_roles: owner updates"
  on public.project_roles for update to authenticated
  using (public.is_project_owner(project_id)) with check (public.is_project_owner(project_id));
create policy "project_roles: owner deletes"
  on public.project_roles for delete to authenticated using (public.is_project_owner(project_id));

create table public.project_role_skills (
  project_role_id  uuid not null references public.project_roles (id) on delete cascade,
  skill_id         uuid not null references public.skills (id) on delete cascade,
  primary key (project_role_id, skill_id)
);

create index project_role_skills_skill_id_idx on public.project_role_skills (skill_id);

alter table public.project_role_skills enable row level security;

create function public.owns_project_role(p_role_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.project_roles r
    join public.projects p on p.id = r.project_id
    where r.id = p_role_id and p.owner_id = (select auth.uid())
  );
$$;

create policy "project_role_skills: signed-in users read"
  on public.project_role_skills for select to authenticated using (true);
create policy "project_role_skills: owner inserts"
  on public.project_role_skills for insert to authenticated with check (public.owns_project_role(project_role_id));
create policy "project_role_skills: owner deletes"
  on public.project_role_skills for delete to authenticated using (public.owns_project_role(project_role_id));

-- ---------------------------------------------------------------------------
-- join_requests
-- ---------------------------------------------------------------------------
create table public.join_requests (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects (id) on delete cascade,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  project_role_id  uuid references public.project_roles (id) on delete set null,
  message          text check (char_length(message) <= 500),
  status           text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at       timestamptz not null default now()
);

create index join_requests_project_id_idx on public.join_requests (project_id);
create index join_requests_user_id_idx on public.join_requests (user_id);
create index join_requests_project_role_id_idx on public.join_requests (project_role_id);
-- One open request per person per project.
create unique index join_requests_one_pending_idx
  on public.join_requests (project_id, user_id) where status = 'pending';

alter table public.join_requests enable row level security;

create policy "join_requests: requester or owner reads"
  on public.join_requests for select to authenticated
  using (user_id = (select auth.uid()) or public.is_project_owner(project_id));
create policy "join_requests: user asks to join"
  on public.join_requests for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and not exists (
      select 1 from public.project_members m
      where m.project_id = join_requests.project_id and m.user_id = (select auth.uid())
    )
    and (
      project_role_id is null
      or exists (
        select 1 from public.project_roles r
        where r.id = project_role_id and r.project_id = join_requests.project_id and r.is_open
      )
    )
  );
create policy "join_requests: owner decides"
  on public.join_requests for update to authenticated
  using (public.is_project_owner(project_id) and status = 'pending')
  with check (public.is_project_owner(project_id) and status in ('accepted', 'declined'));
create policy "join_requests: requester cancels pending"
  on public.join_requests for delete to authenticated
  using (user_id = (select auth.uid()) and status = 'pending');

-- The owner may change only the status.
revoke update on public.join_requests from anon, authenticated;
grant update (status) on public.join_requests to authenticated;

-- Accepting a request adds the person to the team with the requested role title.
create function public.accept_join_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    insert into public.project_members (project_id, user_id, role)
    values (
      new.project_id,
      new.user_id,
      coalesce((select title from public.project_roles where id = new.project_role_id), 'Member')
    )
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger on_join_request_accepted
  after update of status on public.join_requests
  for each row execute function public.accept_join_request();
