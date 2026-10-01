-- Notifications and activities (FIX 5).
-- Rows are created only by the security definer triggers below; users can read
-- their own notifications and mark them read.

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        text not null check (type in (
                'connection_request', 'connection_accepted',
                'collab_request', 'collab_accepted',
                'join_request', 'join_accepted', 'join_declined',
                'project_invite', 'new_project_member',
                'journey_confirmed')),
  actor_id    uuid references public.profiles (id) on delete cascade,
  -- Row the notification is about (connection, request, project, message, journey item).
  entity_id   uuid,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index notifications_user_id_created_at_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where not read;
create index notifications_actor_id_idx on public.notifications (actor_id);

alter table public.notifications enable row level security;

create policy "notifications: owner reads"
  on public.notifications for select to authenticated using (user_id = (select auth.uid()));
create policy "notifications: owner marks read"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "notifications: owner deletes"
  on public.notifications for delete to authenticated using (user_id = (select auth.uid()));

revoke insert, update on public.notifications from anon, authenticated;
grant update (read) on public.notifications to authenticated;

create table public.activities (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        text not null check (type in (
                'joined_project', 'launched_project', 'added_journey', 'started_project', 'connected')),
  -- project id, journey item id, or the other user's id for 'connected'.
  entity_id   uuid not null,
  created_at  timestamptz not null default now()
);

create index activities_user_id_created_at_idx on public.activities (user_id, created_at desc);

alter table public.activities enable row level security;

create policy "activities: signed-in users read"
  on public.activities for select to authenticated using (true);

revoke insert, update, delete on public.activities from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create function public.on_connection_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, type, actor_id, entity_id, created_at)
    values (new.addressee_id, 'connection_request', new.requester_id, new.id, new.created_at);
  elsif new.status = 'accepted' and old.status <> 'accepted' then
    insert into public.notifications (user_id, type, actor_id, entity_id)
    values (new.requester_id, 'connection_accepted', new.addressee_id, new.id);
    insert into public.activities (user_id, type, entity_id)
    values (new.requester_id, 'connected', new.addressee_id),
           (new.addressee_id, 'connected', new.requester_id);
  end if;
  return new;
end;
$$;

create trigger on_connection_insert
  after insert on public.connections
  for each row execute function public.on_connection_change();
create trigger on_connection_status_update
  after update of status on public.connections
  for each row execute function public.on_connection_change();

create function public.on_collab_request_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, type, actor_id, entity_id, created_at)
    values (new.receiver_id, 'collab_request', new.sender_id, new.id, new.created_at);
  elsif new.status = 'accepted' and old.status <> 'accepted' then
    insert into public.notifications (user_id, type, actor_id, entity_id)
    values (new.sender_id, 'collab_accepted', new.receiver_id, new.id);
  end if;
  return new;
end;
$$;

create trigger on_collab_request_insert
  after insert on public.collab_requests
  for each row execute function public.on_collab_request_change();
create trigger on_collab_request_status_update
  after update of status on public.collab_requests
  for each row execute function public.on_collab_request_change();

create function public.on_join_request_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid := (select owner_id from public.projects where id = new.project_id);
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, type, actor_id, entity_id, created_at)
    values (owner, 'join_request', new.user_id, new.id, new.created_at);
  elsif new.status <> old.status and new.status in ('accepted', 'declined') then
    insert into public.notifications (user_id, type, actor_id, entity_id)
    values (
      new.user_id,
      case new.status when 'accepted' then 'join_accepted' else 'join_declined' end,
      owner,
      new.project_id
    );
  end if;
  return new;
end;
$$;

create trigger on_join_request_insert
  after insert on public.join_requests
  for each row execute function public.on_join_request_change();
create trigger on_join_request_status_update
  after update of status on public.join_requests
  for each row execute function public.on_join_request_change();

-- New non-owner member: activity for them, notification for the rest of the team.
create function public.on_project_member_added()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.projects where id = new.project_id and owner_id = new.user_id) then
    return new;
  end if;

  insert into public.activities (user_id, type, entity_id, created_at)
  values (new.user_id, 'joined_project', new.project_id, new.created_at);

  insert into public.notifications (user_id, type, actor_id, entity_id, created_at)
  select m.user_id, 'new_project_member', new.user_id, new.project_id, new.created_at
  from public.project_members m
  where m.project_id = new.project_id and m.user_id <> new.user_id;

  return new;
end;
$$;

create trigger on_project_member_insert
  after insert on public.project_members
  for each row execute function public.on_project_member_added();

create function public.on_project_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activities (user_id, type, entity_id, created_at)
    values (new.owner_id, 'started_project', new.id, new.created_at);
  end if;
  if new.status = 'launched' and (tg_op = 'INSERT' or old.status <> 'launched') then
    insert into public.activities (user_id, type, entity_id, created_at)
    values (new.owner_id, 'launched_project', new.id,
            case when tg_op = 'INSERT' then new.created_at else now() end);
  end if;
  return new;
end;
$$;

create trigger on_project_insert
  after insert on public.projects
  for each row execute function public.on_project_change();
create trigger on_project_status_update
  after update of status on public.projects
  for each row execute function public.on_project_change();

create function public.on_journey_item_added()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.activities (user_id, type, entity_id, created_at)
  values (new.user_id, 'added_journey', new.id, new.created_at);
  return new;
end;
$$;

create trigger on_journey_item_insert
  after insert on public.journey_items
  for each row execute function public.on_journey_item_added();

create function public.on_journey_confirmed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, type, actor_id, entity_id, created_at)
  select i.user_id, 'journey_confirmed', new.confirmer_id, i.id, new.created_at
  from public.journey_items i
  where i.id = new.journey_item_id;
  return new;
end;
$$;

create trigger on_journey_confirmation_insert
  after insert on public.journey_confirmations
  for each row execute function public.on_journey_confirmed();

create function public.on_project_invite_sent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, type, actor_id, entity_id, created_at)
  select m.user_id, 'project_invite', new.sender_id, new.id, new.created_at
  from public.conversation_members m
  where m.conversation_id = new.conversation_id and m.user_id <> new.sender_id;
  return new;
end;
$$;

create trigger on_project_invite_insert
  after insert on public.messages
  for each row when (new.kind = 'project_invite')
  execute function public.on_project_invite_sent();
