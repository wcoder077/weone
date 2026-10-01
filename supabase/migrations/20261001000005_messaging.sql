-- Conversations and messages (FIX 4).
-- Clients never write conversations or memberships directly; start_conversation() does.

create table public.conversations (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  -- Unread = messages newer than this, sent by someone else.
  last_read_at     timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index conversation_members_user_id_idx on public.conversation_members (user_id);

create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  sender_id        uuid not null references public.profiles (id) on delete cascade,
  body             text not null default '' check (char_length(body) <= 4000),
  kind             text not null default 'text' check (kind in ('text', 'project_invite')),
  project_id       uuid references public.projects (id) on delete set null,
  created_at       timestamptz not null default now(),
  check (kind = 'text' and char_length(body) > 0 or kind = 'project_invite')
);

create index messages_conversation_id_created_at_idx on public.messages (conversation_id, created_at desc);
create index messages_sender_id_idx on public.messages (sender_id);
create index messages_project_id_idx on public.messages (project_id);

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

create function public.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = p_conversation_id and user_id = (select auth.uid())
  );
$$;

create policy "conversations: members read"
  on public.conversations for select to authenticated
  using (public.is_conversation_member(id));

create policy "conversation_members: members read"
  on public.conversation_members for select to authenticated
  using (public.is_conversation_member(conversation_id));
create policy "conversation_members: member marks read"
  on public.conversation_members for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke insert, update, delete on public.conversations from anon, authenticated;
revoke insert, update, delete on public.conversation_members from anon, authenticated;
grant update (last_read_at) on public.conversation_members to authenticated;

create policy "messages: members read"
  on public.messages for select to authenticated
  using (public.is_conversation_member(conversation_id));
-- Project invites must point at a project the sender belongs to.
create policy "messages: member sends"
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and public.is_conversation_member(conversation_id)
    and (
      kind = 'text' and project_id is null
      or kind = 'project_invite' and exists (
        select 1 from public.project_members m
        where m.project_id = messages.project_id and m.user_id = (select auth.uid())
      )
    )
  );

revoke update, delete on public.messages from anon, authenticated;

-- Returns the 1:1 conversation with `other_user`, creating it if needed.
-- Allowed only after an accepted connection or an accepted collab request.
create function public.start_conversation(other_user uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  conversation uuid;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if other_user is null or other_user = me then
    raise exception 'invalid user' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.connections c
    where c.status = 'accepted'
      and least(c.requester_id, c.addressee_id) = least(me, other_user)
      and greatest(c.requester_id, c.addressee_id) = greatest(me, other_user)
  ) and not exists (
    select 1 from public.collab_requests r
    where r.status = 'accepted'
      and ((r.sender_id = me and r.receiver_id = other_user)
        or (r.sender_id = other_user and r.receiver_id = me))
  ) then
    raise exception 'messaging requires an accepted connection or collaboration' using errcode = '42501';
  end if;

  -- Serialize creation for this pair so two concurrent calls cannot create two chats.
  perform pg_advisory_xact_lock(hashtextextended(least(me, other_user)::text || greatest(me, other_user)::text, 0));

  select a.conversation_id into conversation
  from public.conversation_members a
  join public.conversation_members b
    on b.conversation_id = a.conversation_id and b.user_id = other_user
  where a.user_id = me
  limit 1;

  if conversation is null then
    insert into public.conversations default values returning id into conversation;
    insert into public.conversation_members (conversation_id, user_id)
    values (conversation, me), (conversation, other_user);
  end if;

  return conversation;
end;
$$;

revoke execute on function public.start_conversation(uuid) from public, anon;
grant execute on function public.start_conversation(uuid) to authenticated;
