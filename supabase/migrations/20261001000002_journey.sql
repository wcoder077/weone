-- Journey items, their skills, and peer confirmations (FIX 3).

create table public.journey_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  type          text not null check (type in (
                  'job', 'internship', 'hackathon', 'competition', 'course', 'workshop',
                  'meetup', 'conference', 'project', 'open_source', 'volunteer', 'other')),
  title         text not null check (char_length(title) between 1 and 120),
  organization  text check (char_length(organization) <= 120),
  role          text check (char_length(role) <= 80),
  result        text check (char_length(result) <= 80),
  description   text check (char_length(description) <= 1000),
  start_date    date,
  end_date      date,
  verified      boolean not null default false,
  created_at    timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create index journey_items_user_id_idx on public.journey_items (user_id);
-- Supports the "same event" lookup.
create index journey_items_event_idx
  on public.journey_items (type, lower(title), lower(organization));

alter table public.journey_items enable row level security;

create policy "journey_items: signed-in users read"
  on public.journey_items for select to authenticated using (true);
create policy "journey_items: owner inserts"
  on public.journey_items for insert to authenticated with check (user_id = (select auth.uid()));
create policy "journey_items: owner updates"
  on public.journey_items for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "journey_items: owner deletes"
  on public.journey_items for delete to authenticated using (user_id = (select auth.uid()));

-- `verified` is a trust field: clients may neither insert nor update it.
-- Table-wide grants are replaced by column grants that leave it out.
revoke insert, update on public.journey_items from anon, authenticated;
grant insert (user_id, type, title, organization, role, result, description, start_date, end_date)
  on public.journey_items to authenticated;
grant update (type, title, organization, role, result, description, start_date, end_date)
  on public.journey_items to authenticated;

-- Editing the event identity after verification would let a user keep the mark
-- on a different event, so such edits reset verification and drop confirmations.
create function public.reset_journey_verification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.type is distinct from old.type
     or lower(new.title) is distinct from lower(old.title)
     or lower(new.organization) is distinct from lower(old.organization)
     or date_trunc('month', new.start_date) is distinct from date_trunc('month', old.start_date)
  then
    new.verified := false;
    delete from public.journey_confirmations where journey_item_id = new.id;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- journey_item_skills
-- ---------------------------------------------------------------------------
create table public.journey_item_skills (
  journey_item_id  uuid not null references public.journey_items (id) on delete cascade,
  skill_id         uuid not null references public.skills (id) on delete cascade,
  primary key (journey_item_id, skill_id)
);

create index journey_item_skills_skill_id_idx on public.journey_item_skills (skill_id);

alter table public.journey_item_skills enable row level security;

create function public.owns_journey_item(item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.journey_items
    where id = item_id and user_id = (select auth.uid())
  );
$$;

create policy "journey_item_skills: signed-in users read"
  on public.journey_item_skills for select to authenticated using (true);
create policy "journey_item_skills: item owner inserts"
  on public.journey_item_skills for insert to authenticated
  with check (public.owns_journey_item(journey_item_id));
create policy "journey_item_skills: item owner deletes"
  on public.journey_item_skills for delete to authenticated
  using (public.owns_journey_item(journey_item_id));

-- ---------------------------------------------------------------------------
-- journey_confirmations
-- ---------------------------------------------------------------------------
create table public.journey_confirmations (
  journey_item_id  uuid not null references public.journey_items (id) on delete cascade,
  confirmer_id     uuid not null references public.profiles (id) on delete cascade,
  created_at       timestamptz not null default now(),
  primary key (journey_item_id, confirmer_id)
);

create index journey_confirmations_confirmer_id_idx on public.journey_confirmations (confirmer_id);

alter table public.journey_confirmations enable row level security;

-- True when the current user may confirm `item_id`: it is someone else's
-- hackathon/competition and the current user has an item for the same event
-- (same type, title, organization, and start month).
create function public.can_confirm_journey_item(item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.journey_items target
    join public.journey_items mine
      on mine.user_id = (select auth.uid())
     and mine.type = target.type
     and lower(mine.title) = lower(target.title)
     and lower(mine.organization) = lower(target.organization)
     and date_trunc('month', mine.start_date) = date_trunc('month', target.start_date)
    where target.id = item_id
      and target.user_id <> (select auth.uid())
      and target.type in ('hackathon', 'competition')
  );
$$;

create policy "journey_confirmations: signed-in users read"
  on public.journey_confirmations for select to authenticated using (true);
create policy "journey_confirmations: matching participant confirms"
  on public.journey_confirmations for insert to authenticated
  with check (
    confirmer_id = (select auth.uid())
    and public.can_confirm_journey_item(journey_item_id)
  );

create function public.mark_journey_item_verified()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.journey_items set verified = true where id = new.journey_item_id;
  return new;
end;
$$;

create trigger on_journey_confirmation_created
  after insert on public.journey_confirmations
  for each row execute function public.mark_journey_item_verified();

create trigger on_journey_item_identity_changed
  before update on public.journey_items
  for each row execute function public.reset_journey_verification();
