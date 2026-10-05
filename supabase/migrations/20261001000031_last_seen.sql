-- "Last seen" in chats: when a user was last active in the app.
--
-- Kept out of `profiles` on purpose: profiles are readable by everyone, while the
-- last-seen time is shown only to the user's accepted connections.
-- Nobody writes the time directly; `touch_last_seen()` stamps the caller with the
-- database clock, so a modified client cannot fake it for itself or anyone else.
-- Additive only: no existing table or row is changed.

create table public.user_presence (
  user_id      uuid primary key references public.profiles (id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

alter table public.user_presence enable row level security;
revoke all on public.user_presence from anon, authenticated;
grant select on public.user_presence to authenticated;

create policy "user_presence: me and my connections read"
  on public.user_presence for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.connections c
      where c.status = 'accepted'
        and (
          (c.requester_id = (select auth.uid()) and c.addressee_id = user_presence.user_id)
          or (c.addressee_id = (select auth.uid()) and c.requester_id = user_presence.user_id)
        )
    )
  );

-- Called by the open app while it is visible (on open, on hide, and every few minutes).
-- Writes at most once per 30 seconds per user; a user without a profile is skipped.
create function public.touch_last_seen()
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.user_presence (user_id, last_seen_at)
  select p.id, now() from public.profiles p where p.id = (select auth.uid())
  on conflict (user_id) do update
    set last_seen_at = excluded.last_seen_at
    where public.user_presence.last_seen_at < now() - interval '30 seconds';
$$;

revoke execute on function public.touch_last_seen() from public, anon;
grant execute on function public.touch_last_seen() to authenticated;
