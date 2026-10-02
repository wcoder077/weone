-- Per-user insert limits, so one account (or a bot) can't flood the database.
-- Limits are generous for real people. Rows written without a user session
-- (seed, service role) are not limited. Existing rows are not touched.

create function public.enforce_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- trigger arguments: user column, max rows, window
  user_col text := tg_argv[0];
  max_rows int := tg_argv[1]::int;
  time_window interval := tg_argv[2]::interval;
  uid uuid := (select auth.uid());
  recent int;
begin
  if uid is null then
    return new;
  end if;
  execute format(
    'select count(*) from %I.%I where %I = $1 and created_at > now() - $2',
    tg_table_schema, tg_table_name, user_col
  ) into recent using uid, time_window;
  if recent >= max_rows then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_rate_limit() from public, anon, authenticated;

create trigger posts_rate_limit before insert on public.posts
  for each row execute function public.enforce_rate_limit('author_id', '10', '10 minutes');
create trigger post_comments_rate_limit before insert on public.post_comments
  for each row execute function public.enforce_rate_limit('author_id', '20', '5 minutes');
create trigger messages_rate_limit before insert on public.messages
  for each row execute function public.enforce_rate_limit('sender_id', '30', '1 minute');
create trigger connections_rate_limit before insert on public.connections
  for each row execute function public.enforce_rate_limit('requester_id', '30', '1 hour');
create trigger projects_rate_limit before insert on public.projects
  for each row execute function public.enforce_rate_limit('owner_id', '5', '1 hour');

-- Comments are counted per author over time; this index keeps that check fast.
create index post_comments_author_id_created_at_idx on public.post_comments (author_id, created_at desc);
