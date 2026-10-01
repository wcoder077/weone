-- Per-person chat settings: mute, pin, "delete for me".
-- They live on the member's own conversation_members row, so they never affect the other person.
--   muted      unread messages from this chat don't count in the nav badge
--   pinned_at  pinned chats are listed first (newest pin first)
--   hidden_at  "delete for me": the chat disappears from my list and I only see messages
--              newer than this; a new message brings the chat back

alter table public.conversation_members
  add column muted boolean not null default false,
  add column pinned_at timestamptz,
  add column hidden_at timestamptz;

-- The existing "member marks read" policy already limits updates to the member's own row.
grant update (muted, pinned_at, hidden_at) on public.conversation_members to authenticated;

-- Same counts as before, plus whether the chat is muted (the nav badge skips muted chats).
drop function public.my_unread_counts();
create function public.my_unread_counts()
returns table (conversation_id uuid, unread integer, muted boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select m.conversation_id, count(msg.id)::integer, m.muted
  from public.conversation_members m
  join public.conversations conv on conv.id = m.conversation_id
  left join public.connections c on c.id = conv.connection_id
  join public.messages msg
    on msg.conversation_id = m.conversation_id
   and msg.sender_id <> m.user_id
   and msg.created_at > m.last_read_at
  where m.user_id = (select auth.uid())
    and (c.status is null or c.status <> 'rejected')
  group by m.conversation_id, m.muted;
$$;

revoke execute on function public.my_unread_counts() from public, anon;
grant execute on function public.my_unread_counts() to authenticated;
