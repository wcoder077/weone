-- Exact unread counts for the signed-in user: messages from others newer than
-- the user's last_read_at, per conversation. Rejected chats are hidden in the UI,
-- so they don't count. Scoped to auth.uid(); returns nothing for anon.
create function public.my_unread_counts()
returns table (conversation_id uuid, unread integer)
language sql
stable
security definer
set search_path = ''
as $$
  select m.conversation_id, count(msg.id)::integer
  from public.conversation_members m
  join public.conversations conv on conv.id = m.conversation_id
  left join public.connections c on c.id = conv.connection_id
  join public.messages msg
    on msg.conversation_id = m.conversation_id
   and msg.sender_id <> m.user_id
   and msg.created_at > m.last_read_at
  where m.user_id = (select auth.uid())
    and (c.status is null or c.status <> 'rejected')
  group by m.conversation_id;
$$;

revoke execute on function public.my_unread_counts() from public, anon;
grant execute on function public.my_unread_counts() to authenticated;
