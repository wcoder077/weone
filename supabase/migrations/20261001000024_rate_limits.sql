-- Per-user insert limits, so one account (or a bot) can't flood the database.
-- The limits live in a table: change a number in the Table Editor (or with one
-- UPDATE) and it applies at once; delete a row to remove that limit. Rows written
-- without a user session (seed, service role) are not limited. Existing rows are
-- not touched.

create table public.rate_limits (
  table_name   text primary key,
  max_rows     int not null check (max_rows > 0),
  time_window  interval not null check (time_window > interval '0')
);

-- Only the trigger below reads it; no API access.
alter table public.rate_limits enable row level security;

insert into public.rate_limits (table_name, max_rows, time_window) values
  ('posts',         1,  '1 hour'),     -- reposts count as posts
  ('post_comments', 20, '5 minutes'),
  ('messages',      30, '1 minute'),
  ('connections',   30, '1 hour'),
  ('projects',      5,  '1 hour');

create function public.enforce_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_col text := tg_argv[0];  -- the column holding the writer's id
  uid uuid := (select auth.uid());
  lim public.rate_limits%rowtype;
  recent int;
begin
  if uid is null then
    return new;
  end if;
  select * into lim from public.rate_limits where table_name = tg_table_name;
  if not found then
    return new;
  end if;
  execute format(
    'select count(*) from %I.%I where %I = $1 and created_at > now() - $2',
    tg_table_schema, tg_table_name, user_col
  ) into recent using uid, lim.time_window;
  if recent >= lim.max_rows then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_rate_limit() from public, anon, authenticated;

create trigger posts_rate_limit before insert on public.posts
  for each row execute function public.enforce_rate_limit('author_id');
create trigger post_comments_rate_limit before insert on public.post_comments
  for each row execute function public.enforce_rate_limit('author_id');
create trigger messages_rate_limit before insert on public.messages
  for each row execute function public.enforce_rate_limit('sender_id');
create trigger connections_rate_limit before insert on public.connections
  for each row execute function public.enforce_rate_limit('requester_id');
create trigger projects_rate_limit before insert on public.projects
  for each row execute function public.enforce_rate_limit('owner_id');

-- Comments are counted per author over time; this index keeps that check fast.
create index post_comments_author_id_created_at_idx on public.post_comments (author_id, created_at desc);

-- Conversation list previews: only the last message of each of my chats (after
-- "deleted for me"), body cut to 120 characters. Replaces reading up to 500 full
-- messages on every list refresh. Runs as the caller, so messages RLS applies.
create function public.my_conversation_previews()
returns table (
  conversation_id uuid,
  sender_id uuid,
  body text,
  kind text,
  attachment_type text,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select l.conversation_id, l.sender_id, l.body, l.kind, l.attachment_type, l.created_at
  from public.conversation_members cm
  cross join lateral (
    select m.conversation_id, m.sender_id, left(m.body, 120) as body, m.kind, m.attachment_type, m.created_at
    from public.messages m
    where m.conversation_id = cm.conversation_id
      and (cm.hidden_at is null or m.created_at > cm.hidden_at)
    order by m.created_at desc
    limit 1
  ) l
  where cm.user_id = (select auth.uid());
$$;

revoke execute on function public.my_conversation_previews() from public, anon;
grant execute on function public.my_conversation_previews() to authenticated;
