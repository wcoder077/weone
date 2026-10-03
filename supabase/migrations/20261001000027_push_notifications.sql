-- Push notifications (Web Push). A device subscribes in the browser; when a message or a
-- notification row is inserted, a trigger hands the recipient's subscriptions to the app
-- (POST /api/push, through pg_net), which encrypts and sends the push with the VAPID key.
-- The text is built by the app in the device's language, so only raw facts leave the database.
-- Until `push_settings` is filled in (see docs/PUSH.md) nothing is sent.

-- ---------------------------------------------------------------------------
-- Subscriptions: one row per browser/device. Written only through save_push_subscription().
-- ---------------------------------------------------------------------------
create table public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  endpoint    text not null unique
              check (char_length(endpoint) <= 1000
                 and endpoint ~ '^https://([a-z0-9-]+\.)*(googleapis\.com|push\.apple\.com|push\.services\.mozilla\.com|notify\.windows\.com)/'),
  p256dh      text not null check (char_length(p256dh) between 20 and 200),
  auth        text not null check (char_length(auth) between 8 and 100),
  lang        text not null default 'uz' check (lang in ('uz', 'en', 'ru')),
  created_at  timestamptz not null default now()
);
create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
create policy "push_subscriptions: owner reads"
  on public.push_subscriptions for select to authenticated using (user_id = (select auth.uid()));
create policy "push_subscriptions: owner deletes"
  on public.push_subscriptions for delete to authenticated using (user_id = (select auth.uid()));

-- The browser never needs the keys back, and nobody writes rows directly.
revoke all on public.push_subscriptions from anon, authenticated;
grant select (id, user_id, endpoint, lang, created_at) on public.push_subscriptions to authenticated;
grant delete on public.push_subscriptions to authenticated;

-- ---------------------------------------------------------------------------
-- Settings: where the app listens and the shared secret. One row, no client access.
-- ---------------------------------------------------------------------------
create table public.push_settings (
  id      int primary key default 1 check (id = 1),
  url     text not null check (url ~ '^https://'),
  secret  text not null check (char_length(secret) >= 32)
);
alter table public.push_settings enable row level security;
revoke all on public.push_settings from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Subscribe / re-subscribe this device (it moves to the signed-in user), max 10 devices.
-- ---------------------------------------------------------------------------
create function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text, p_lang text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, lang)
  values (me, p_endpoint, p_p256dh, p_auth, p_lang)
  on conflict (endpoint) do update
    set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, lang = excluded.lang;

  -- Keep the 10 newest devices.
  delete from public.push_subscriptions
  where user_id = me
    and id not in (
      select id from public.push_subscriptions where user_id = me order by created_at desc limit 10
    );
end;
$$;
revoke execute on function public.save_push_subscription(text, text, text, text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Hands one event for one person to the app. Never fails the statement that caused it.
-- ---------------------------------------------------------------------------
create function public.send_push(p_user uuid, p_event jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  cfg public.push_settings%rowtype;
  subs jsonb;
begin
  select * into cfg from public.push_settings where id = 1;
  if not found then
    return;
  end if;

  select jsonb_agg(jsonb_build_object('endpoint', endpoint, 'p256dh', p256dh, 'auth', auth, 'lang', lang))
  into subs
  from public.push_subscriptions
  where user_id = p_user;
  if subs is null then
    return;
  end if;

  perform net.http_post(
    url := cfg.url,
    body := jsonb_build_object('subs', subs, 'event', p_event),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', cfg.secret)
  );
exception when others then
  -- pg_net missing, app unreachable, ...: the message or notification must still be saved.
  null;
end;
$$;
revoke execute on function public.send_push(uuid, jsonb) from public, anon, authenticated;

-- A message pushes to the other members of the chat (not when they muted it). Invitations and
-- the first message of a connection request are covered by their notification row.
create function public.push_on_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  sender_name text;
  connection_status text;
  member record;
begin
  if new.kind <> 'text' then
    return new;
  end if;

  select k.status into connection_status
  from public.conversations c join public.connections k on k.id = c.connection_id
  where c.id = new.conversation_id;
  if connection_status = 'pending' then
    return new;
  end if;

  select full_name into sender_name from public.profiles where id = new.sender_id;

  for member in
    select user_id from public.conversation_members
    where conversation_id = new.conversation_id and user_id <> new.sender_id and not muted
  loop
    perform public.send_push(member.user_id, jsonb_build_object(
      'kind', 'message',
      'actor', coalesce(sender_name, ''),
      'text', left(new.body, 140),
      'attachment', new.attachment_type,
      'url', '/messages/' || new.conversation_id::text,
      'tag', 'chat-' || new.conversation_id::text
    ));
  end loop;
  return new;
end;
$$;
revoke execute on function public.push_on_message() from public, anon, authenticated;

create trigger messages_push after insert on public.messages
  for each row execute function public.push_on_message();

create function public.push_on_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_name text;
begin
  select full_name into actor_name from public.profiles where id = new.actor_id;
  perform public.send_push(new.user_id, jsonb_build_object(
    'kind', 'notification',
    'type', new.type,
    'actor', coalesce(actor_name, ''),
    'url', '/notifications',
    'tag', 'notification-' || new.id::text
  ));
  return new;
end;
$$;
revoke execute on function public.push_on_notification() from public, anon, authenticated;

create trigger notifications_push after insert on public.notifications
  for each row execute function public.push_on_notification();

-- "Send me a test": runs the whole path (database → app → push service → device).
create function public.send_test_push()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  perform public.send_push((select auth.uid()), jsonb_build_object('kind', 'test', 'url', '/settings', 'tag', 'push-test'));
end;
$$;
revoke execute on function public.send_test_push() from public, anon;
grant execute on function public.send_test_push() to authenticated;

-- The app removes subscriptions the push service reported as gone. Callable by the app (anon key)
-- only with the shared secret.
create function public.push_drop(p_secret text, p_endpoints text[])
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed int;
begin
  if not exists (select 1 from public.push_settings where id = 1 and secret = p_secret) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  delete from public.push_subscriptions where endpoint = any (p_endpoints);
  get diagnostics removed = row_count;
  return removed;
end;
$$;
revoke execute on function public.push_drop(text, text[]) from public;
grant execute on function public.push_drop(text, text[]) to anon, authenticated;
