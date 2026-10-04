-- "Jamoa maydoni" (team space): the group chat link, one pinned notice and the next meeting of a project.
-- Only the project's members can read it; only the founder (projects.owner_id) can write it.
-- It lives in its own table on purpose: projects are readable by every signed-in user, so
-- the link must not be a column there. This table holds the one and only copy of chat_url.
-- projects.github_url / demo_url stay in the table (no data is deleted) but the app no longer uses them.

-- Members of a project: the founder is also a member row (role "Owner"), but check both.
create function public.is_project_member(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.project_members where project_id = p_project_id and user_id = (select auth.uid())
  ) or exists (
    select 1 from public.projects where id = p_project_id and owner_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_project_member(uuid) from public, anon;
grant execute on function public.is_project_member(uuid) to authenticated;

create table public.project_team_space (
  project_id                uuid primary key references public.projects (id) on delete cascade,
  chat_url                  text check (chat_url is null or (chat_url ~ '^https://[^[:space:]]+$' and char_length(chat_url) <= 300)),
  pinned_notice             text check (pinned_notice is null or public.grapheme_length(pinned_notice) between 1 and 280),
  pinned_notice_updated_at  timestamptz,
  next_meeting_at           timestamptz,
  meeting_url               text check (meeting_url is null or (meeting_url ~ '^https://[^[:space:]]+$' and char_length(meeting_url) <= 300)),
  updated_at                timestamptz not null default now()
);

alter table public.project_team_space enable row level security;

revoke all on public.project_team_space from anon, authenticated;
grant select on public.project_team_space to authenticated;
-- The timestamps are set by the trigger below, never by the client.
grant insert (project_id, chat_url, pinned_notice, next_meeting_at, meeting_url) on public.project_team_space to authenticated;
grant update (chat_url, pinned_notice, next_meeting_at, meeting_url) on public.project_team_space to authenticated;

create policy "project_team_space: members read"
  on public.project_team_space for select to authenticated
  using ((select public.is_project_member(project_id)));

create policy "project_team_space: founder inserts"
  on public.project_team_space for insert to authenticated
  with check ((select public.is_project_owner(project_id)));

create policy "project_team_space: founder updates"
  on public.project_team_space for update to authenticated
  using ((select public.is_project_owner(project_id)))
  with check ((select public.is_project_owner(project_id)));

create function public.team_space_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.pinned_notice is distinct from old.pinned_notice then
    new.pinned_notice_updated_at := case when new.pinned_notice is null then null else now() end;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger project_team_space_touch before insert or update on public.project_team_space
  for each row execute function public.team_space_touch();
