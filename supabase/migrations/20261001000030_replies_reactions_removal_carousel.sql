-- Four small features in one migration:
--   1. replies under comments (one level),
--   2. reactions to chat messages,
--   3. ending a connection without losing the chat history ("removed"),
--   4. several photos in one post (carousel).
-- No existing row is changed or deleted.

-- ---------------------------------------------------------------------------
-- 1. Replies: a comment may point at a top-level comment of the same post.
-- ---------------------------------------------------------------------------
alter table public.post_comments
  add column parent_id uuid references public.post_comments (id) on delete cascade;

create index post_comments_parent_id_idx on public.post_comments (parent_id) where parent_id is not null;

create function public.check_comment_parent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parent_id is not null and not exists (
    select 1 from public.post_comments p
    where p.id = new.parent_id and p.post_id = new.post_id and p.parent_id is null
  ) then
    raise exception 'invalid parent comment' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger post_comments_parent_check before insert on public.post_comments
  for each row execute function public.check_comment_parent();

grant insert (parent_id) on public.post_comments to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Reactions: one per person per message. Only members of the chat can read or write them.
-- ---------------------------------------------------------------------------
create table public.message_reactions (
  message_id       uuid not null references public.messages (id) on delete cascade,
  user_id          uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  emoji            text not null check (emoji in ('👍', '❤️', '😂', '😮', '😢', '🙏')),
  created_at       timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index message_reactions_conversation_id_idx on public.message_reactions (conversation_id);

alter table public.message_reactions enable row level security;

-- The chat id comes from the message itself (the select below is subject to RLS: a non-member finds nothing).
create function public.set_reaction_conversation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select m.conversation_id into new.conversation_id from public.messages m where m.id = new.message_id;
  if new.conversation_id is null then
    raise exception 'message not found' using errcode = 'P0002';
  end if;
  return new;
end;
$$;

create trigger message_reactions_conversation before insert on public.message_reactions
  for each row execute function public.set_reaction_conversation();

revoke all on public.message_reactions from anon, authenticated;
grant select on public.message_reactions to authenticated;
grant insert (message_id, emoji) on public.message_reactions to authenticated;
grant update (emoji) on public.message_reactions to authenticated;
grant delete on public.message_reactions to authenticated;

create policy "message_reactions: members read"
  on public.message_reactions for select to authenticated
  using ((select public.is_conversation_member(conversation_id)));
create policy "message_reactions: members react as themselves"
  on public.message_reactions for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.is_conversation_member(conversation_id)));
create policy "message_reactions: change own"
  on public.message_reactions for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "message_reactions: remove own"
  on public.message_reactions for delete to authenticated
  using (user_id = (select auth.uid()));

-- At most 60 reactions per minute per person. This uses the rate limit tables of migration 24,
-- so it is added only where they exist (without them nothing else here depends on it).
do $$
begin
  if to_regclass('public.rate_limits') is not null and to_regprocedure('public.enforce_rate_limit()') is not null then
    insert into public.rate_limits (table_name, max_rows, time_window)
    values ('message_reactions', 60, '1 minute')
    on conflict (table_name) do nothing;

    create trigger message_reactions_rate_limit before insert on public.message_reactions
      for each row execute function public.enforce_rate_limit('user_id');
  end if;
end;
$$;

alter publication supabase_realtime add table public.message_reactions;

-- ---------------------------------------------------------------------------
-- 3. Ending a connection. The row stays with status 'removed': the chat history stays on both
--    sides, nobody can write in it (conversation_is_open needs 'accepted'), and either side can
--    ask to connect again (the other person then accepts or rejects as usual).
-- ---------------------------------------------------------------------------
alter table public.connections drop constraint connections_status_check;
alter table public.connections
  add constraint connections_status_check check (status in ('pending', 'accepted', 'rejected', 'removed'));

-- Nobody deletes an accepted connection any more (that would delete the chat with it).
drop policy "connections: cancel pending or remove accepted" on public.connections;
create policy "connections: requester cancels pending"
  on public.connections for delete to authenticated
  using (status = 'pending' and requester_id = (select auth.uid()));

create function public.remove_connection(p_connection_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.connections
  set status = 'removed', responded_at = now()
  where id = p_connection_id
    and status = 'accepted'
    and (select auth.uid()) in (requester_id, addressee_id);

  if not found then
    raise exception 'connection not found or not active' using errcode = 'P0002';
  end if;
end;
$$;

-- Asks to connect again after a removal: the caller becomes the requester, the other side gets a request.
create function public.reconnect_request(p_connection_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  other uuid;
begin
  update public.connections c
  set requester_id = me,
      addressee_id = case when c.requester_id = me then c.addressee_id else c.requester_id end,
      status = 'pending',
      responded_at = null
  where c.id = p_connection_id
    and c.status = 'removed'
    and me in (c.requester_id, c.addressee_id)
  returning c.addressee_id into other;

  if other is null then
    raise exception 'connection not found or not removed' using errcode = 'P0002';
  end if;

  insert into public.notifications (user_id, type, actor_id, entity_id)
  values (other, 'connection_request', me, p_connection_id);
end;
$$;

revoke execute on function public.remove_connection(uuid) from public, anon;
revoke execute on function public.reconnect_request(uuid) from public, anon;
grant execute on function public.remove_connection(uuid) to authenticated;
grant execute on function public.reconnect_request(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Carousel: a post keeps its first photo (or its video) in posts.media_*, exactly as before.
--    Extra photos of the same post live here, in order (position 1 to 9).
-- ---------------------------------------------------------------------------
create table public.post_media (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  position   smallint not null check (position between 1 and 9),
  path       text not null check (path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'),
  name       text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now(),
  unique (post_id, position)
);

alter table public.post_media enable row level security;

-- Readable like the posts themselves; written only by the post's author, into their own upload folder.
create policy "post_media: signed-in users read"
  on public.post_media for select to authenticated using (true);
create policy "post_media: author adds"
  on public.post_media for insert to authenticated
  with check (
    split_part(path, '/', 1) = (select auth.uid())::text
    and public.post_media_exists(path)
    and exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()) and p.media_type = 'image')
  );
create policy "post_media: author removes"
  on public.post_media for delete to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid())));

revoke all on public.post_media from anon, authenticated;
grant select on public.post_media to authenticated;
grant insert (post_id, position, path, name) on public.post_media to authenticated;
grant delete on public.post_media to authenticated;
