-- Help & support: users send a short note (up to 100 words) with an optional screenshot;
-- admins read the tickets in the hidden admin panel.
--
-- Who is an admin is decided only here: `admins` has no API access at all (add a row
-- in the SQL Editor). Users can never become admins, mark tickets resolved, or read
-- other people's tickets or screenshots.

-- ---------------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Support tickets
-- ---------------------------------------------------------------------------
create table public.support_tickets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  message     text not null check (
    char_length(btrim(message)) between 1 and 1000
    and array_length(regexp_split_to_array(btrim(message), '\s+'), 1) <= 100
  ),
  image_path  text check (image_path is null or image_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'),
  status      text not null default 'open' check (status in ('open', 'resolved')),
  handled_by  uuid references public.profiles (id) on delete set null,
  handled_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index support_tickets_status_created_idx on public.support_tickets (status, created_at desc);
create index support_tickets_user_idx on public.support_tickets (user_id, created_at desc);

alter table public.support_tickets enable row level security;

-- Users write only the text and the screenshot; id, owner, status and handler are not theirs to set.
revoke all on public.support_tickets from anon, authenticated;
grant select on public.support_tickets to authenticated;
grant insert (message, image_path) on public.support_tickets to authenticated;
grant update (status) on public.support_tickets to authenticated;

create policy "support_tickets: send as myself"
  on public.support_tickets for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (image_path is null or split_part(image_path, '/', 1) = (select auth.uid())::text)
  );

create policy "support_tickets: owner and admins read"
  on public.support_tickets for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "support_tickets: admins update"
  on public.support_tickets for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Who resolved a ticket and when is recorded by the database, not sent by the client.
create function public.support_ticket_handled()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.handled_by := (select auth.uid());
    new.handled_at := case when new.status = 'resolved' then now() else null end;
  end if;
  return new;
end;
$$;

create trigger support_tickets_handled before update on public.support_tickets
  for each row execute function public.support_ticket_handled();

-- At most 5 tickets per hour per user (same mechanism as migration 24).
insert into public.rate_limits (table_name, max_rows, time_window)
values ('support_tickets', 5, '1 hour')
on conflict (table_name) do nothing;

create trigger support_tickets_rate_limit before insert on public.support_tickets
  for each row execute function public.enforce_rate_limit('user_id');

-- ---------------------------------------------------------------------------
-- Private bucket for screenshots. Path: <user id>/<uuid>.<ext>
-- The uploader and admins can read them; nobody else.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('support-images', 'support-images', false, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "support-images: owner uploads"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'support-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "support-images: owner deletes"
  on storage.objects for delete to authenticated
  using (bucket_id = 'support-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "support-images: owner and admins read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'support-images'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );
