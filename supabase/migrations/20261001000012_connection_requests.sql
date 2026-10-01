-- Milestone 1: connection requests carry a first message (text ≤ 200 graphemes
-- and/or one image). Every rule is enforced here, not only in the UI:
--   * one connection per pair (unique index from migration 4), no re-request after a rejection
--   * only the requester edits the first message or cancels, only while pending
--   * only the addressee accepts or rejects
--   * chat messages only in conversations whose connection is accepted

-- ---------------------------------------------------------------------------
-- Grapheme length: what a person sees as one character (an emoji = 1).
-- Approximates Unicode grapheme clusters, matching Intl.Segmenter on the client
-- for emoji ZWJ sequences, skin tones, variation selectors, keycaps and flags.
-- ---------------------------------------------------------------------------
create function public.grapheme_length(value text)
returns int
language sql
immutable
set search_path = ''
as $$
  select char_length(
    regexp_replace(
      regexp_replace(
        regexp_replace(coalesce(value, ''), '[\U0001F1E6-\U0001F1FF]{2}', 'x', 'g'),
        '‍.', '', 'g'),
      '[︎️⃣̀-ͯ\U0001F3FB-\U0001F3FF\U000E0020-\U000E007F]', '', 'g')
  );
$$;

-- ---------------------------------------------------------------------------
-- connections: 'declined' becomes 'rejected'; responses are timestamped.
-- ---------------------------------------------------------------------------
alter table public.connections drop constraint connections_status_check;
update public.connections set status = 'rejected' where status = 'declined';
alter table public.connections
  add constraint connections_status_check check (status in ('pending', 'accepted', 'rejected')),
  add column responded_at timestamptz;

-- Writes go through the functions below only.
drop policy "connections: requester sends" on public.connections;
drop policy "connections: addressee answers" on public.connections;
drop policy "connections: either side removes" on public.connections;
revoke insert, update on public.connections from anon, authenticated;

-- The requester may cancel while pending; either side may remove an accepted connection.
-- A rejected row stays forever, so the pair index blocks any new request.
create policy "connections: cancel pending or remove accepted"
  on public.connections for delete to authenticated
  using (
    (status = 'pending' and requester_id = (select auth.uid()))
    or (status = 'accepted' and (select auth.uid()) in (requester_id, addressee_id))
  );

-- ---------------------------------------------------------------------------
-- Conversations belong to a connection; messages may carry one image.
-- ---------------------------------------------------------------------------
alter table public.conversations
  add column connection_id uuid unique references public.connections (id) on delete cascade;

-- Link existing 1:1 chats to the connection between their two members.
update public.conversations conv
set connection_id = c.id
from public.connections c
where conv.connection_id is null
  and 2 = (select count(*) from public.conversation_members m where m.conversation_id = conv.id)
  and exists (select 1 from public.conversation_members m where m.conversation_id = conv.id and m.user_id = c.requester_id)
  and exists (select 1 from public.conversation_members m where m.conversation_id = conv.id and m.user_id = c.addressee_id);

alter table public.messages
  add column image_path text check (image_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'),
  add column edited_at timestamptz,
  drop constraint messages_check,
  add constraint messages_content_check check (
    (kind = 'text' and (char_length(trim(body)) > 0 or image_path is not null))
    or kind = 'project_invite'
  );

-- True when the conversation's connection is accepted (messaging is open).
create function public.conversation_is_open(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversations conv
    join public.connections c on c.id = conv.connection_id
    where conv.id = p_conversation_id and c.status = 'accepted'
  );
$$;

revoke execute on function public.conversation_is_open(uuid) from public, anon;
grant execute on function public.conversation_is_open(uuid) to authenticated;

-- Regular chat: members of an open conversation, text only (images only in first messages).
drop policy "messages: member sends" on public.messages;
create policy "messages: member sends in open conversation"
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and image_path is null
    and edited_at is null
    and public.is_conversation_member(conversation_id)
    and public.conversation_is_open(conversation_id)
    and public.grapheme_length(body) <= 4000
    and (
      kind = 'text' and project_id is null
      or kind = 'project_invite' and exists (
        select 1 from public.project_members m
        where m.project_id = messages.project_id and m.user_id = (select auth.uid())
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Private image bucket for first messages. Path: <sender id>/<uuid>.<ext>.
-- Readable by the uploader and by members of a conversation that uses it.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('message-images', 'message-images', false, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create function public.can_read_message_image(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.messages m
    join public.conversation_members cm on cm.conversation_id = m.conversation_id
    where m.image_path = object_name and cm.user_id = (select auth.uid())
  );
$$;

revoke execute on function public.can_read_message_image(text) from public, anon;
grant execute on function public.can_read_message_image(text) to authenticated;

create policy "message-images: owner uploads"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'message-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "message-images: owner deletes"
  on storage.objects for delete to authenticated
  using (bucket_id = 'message-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "message-images: owner or conversation members read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'message-images'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.can_read_message_image(name))
  );

-- ---------------------------------------------------------------------------
-- Request functions
-- ---------------------------------------------------------------------------

-- Shared checks for a first message: ≤ 200 graphemes, text or image, own uploaded image.
create function public.check_first_message(p_body text, p_image_path text)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if public.grapheme_length(p_body) > 200 then
    raise exception 'first message is longer than 200 characters' using errcode = '22001';
  end if;
  if char_length(trim(coalesce(p_body, ''))) = 0 and p_image_path is null then
    raise exception 'first message is empty' using errcode = '22023';
  end if;
  if p_image_path is not null and not exists (
    select 1 from storage.objects o
    where o.bucket_id = 'message-images'
      and o.name = p_image_path
      and (storage.foldername(o.name))[1] = auth.uid()::text
  ) then
    raise exception 'image not found' using errcode = '22023';
  end if;
end;
$$;

revoke execute on function public.check_first_message(text, text) from public, anon, authenticated;

create function public.send_connection_request(p_addressee uuid, p_body text, p_image_path text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  v_body text := trim(coalesce(p_body, ''));
  connection uuid;
  conversation uuid;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_addressee is null or p_addressee = me
     or not exists (select 1 from public.profiles where id = p_addressee) then
    raise exception 'invalid user' using errcode = '22023';
  end if;
  perform public.check_first_message(v_body, p_image_path);

  -- The unique pair index rejects a second request in either direction (23505).
  insert into public.connections (requester_id, addressee_id)
  values (me, p_addressee)
  returning id into connection;

  insert into public.conversations (connection_id) values (connection) returning id into conversation;
  insert into public.conversation_members (conversation_id, user_id) values (conversation, me), (conversation, p_addressee);
  insert into public.messages (conversation_id, sender_id, body, image_path)
  values (conversation, me, v_body, p_image_path);

  return connection;
end;
$$;

-- Edits the first message of the caller's own pending request.
create function public.update_connection_request(p_connection_id uuid, p_body text, p_image_path text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  v_body text := trim(coalesce(p_body, ''));
  conversation uuid;
begin
  select conv.id into conversation
  from public.connections c
  join public.conversations conv on conv.connection_id = c.id
  where c.id = p_connection_id and c.requester_id = me and c.status = 'pending'
  for update of c;

  if conversation is null then
    raise exception 'request not found or no longer pending' using errcode = 'P0002';
  end if;
  perform public.check_first_message(v_body, p_image_path);

  update public.messages
  set body = v_body, image_path = p_image_path, edited_at = now()
  where id = (
    select id from public.messages
    where conversation_id = conversation and sender_id = me
    order by created_at
    limit 1
  );
end;
$$;

-- Accept or reject a request addressed to the caller.
create function public.respond_connection_request(p_connection_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.connections
  set status = case when p_accept then 'accepted' else 'rejected' end,
      responded_at = now()
  where id = p_connection_id and addressee_id = auth.uid() and status = 'pending';

  if not found then
    raise exception 'request not found or no longer pending' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.send_connection_request(uuid, text, text) from public, anon;
revoke execute on function public.update_connection_request(uuid, text, text) from public, anon;
revoke execute on function public.respond_connection_request(uuid, boolean) from public, anon;
grant execute on function public.send_connection_request(uuid, text, text) to authenticated;
grant execute on function public.update_connection_request(uuid, text, text) to authenticated;
grant execute on function public.respond_connection_request(uuid, boolean) to authenticated;

-- Chat for an accepted connection; creates it for connections made before this migration.
create or replace function public.start_conversation(other_user uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  connection uuid;
  conversation uuid;
begin
  select c.id into connection
  from public.connections c
  where c.status = 'accepted'
    and least(c.requester_id, c.addressee_id) = least(me, other_user)
    and greatest(c.requester_id, c.addressee_id) = greatest(me, other_user);

  if me is null or connection is null then
    raise exception 'messaging requires an accepted connection' using errcode = '42501';
  end if;

  select id into conversation from public.conversations where connection_id = connection;
  if conversation is null then
    insert into public.conversations (connection_id) values (connection)
    on conflict (connection_id) do nothing
    returning id into conversation;
    if conversation is null then
      select id into conversation from public.conversations where connection_id = connection;
    else
      insert into public.conversation_members (conversation_id, user_id) values (conversation, me), (conversation, other_user);
    end if;
  end if;

  return conversation;
end;
$$;

-- ---------------------------------------------------------------------------
-- Collaborate requests are replaced by connection requests (history is kept).
-- ---------------------------------------------------------------------------
drop function public.accept_collab_request(uuid);
drop policy "collab_requests: sender sends" on public.collab_requests;
revoke insert on public.collab_requests from anon, authenticated;
