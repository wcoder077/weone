-- Connections and collaboration requests. Visible only to the two sides.

create table public.connections (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.profiles (id) on delete cascade,
  addressee_id  uuid not null references public.profiles (id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at    timestamptz not null default now(),
  check (requester_id <> addressee_id)
);

-- One connection per pair, regardless of who asked.
create unique index connections_pair_idx
  on public.connections (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index connections_requester_id_idx on public.connections (requester_id);
create index connections_addressee_id_idx on public.connections (addressee_id);

alter table public.connections enable row level security;

create policy "connections: both sides read"
  on public.connections for select to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));
create policy "connections: requester sends"
  on public.connections for insert to authenticated
  with check (requester_id = (select auth.uid()) and status = 'pending');
create policy "connections: addressee answers"
  on public.connections for update to authenticated
  using (addressee_id = (select auth.uid()) and status = 'pending')
  with check (addressee_id = (select auth.uid()) and status in ('accepted', 'declined'));
-- Either side may withdraw a request or remove the connection.
create policy "connections: either side removes"
  on public.connections for delete to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

-- Only `status` is writable, so the addressee cannot rewrite who the connection is with.
revoke update on public.connections from anon, authenticated;
grant update (status) on public.connections to authenticated;

-- ---------------------------------------------------------------------------
-- collab_requests
-- ---------------------------------------------------------------------------
create table public.collab_requests (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references public.profiles (id) on delete cascade,
  receiver_id  uuid not null references public.profiles (id) on delete cascade,
  reason       text not null check (reason in (
                 'project', 'hackathon', 'startup', 'learning', 'open_source', 'mentorship')),
  project_id   uuid references public.projects (id) on delete set null,
  message      text check (char_length(message) <= 500),
  status       text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at   timestamptz not null default now(),
  check (sender_id <> receiver_id)
);

create index collab_requests_sender_id_idx on public.collab_requests (sender_id);
create index collab_requests_receiver_id_idx on public.collab_requests (receiver_id);
create index collab_requests_project_id_idx on public.collab_requests (project_id);

alter table public.collab_requests enable row level security;

create policy "collab_requests: both sides read"
  on public.collab_requests for select to authenticated
  using ((select auth.uid()) in (sender_id, receiver_id));
-- A referenced project must be one the sender is a member of.
create policy "collab_requests: sender sends"
  on public.collab_requests for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and status = 'pending'
    and (
      project_id is null
      or exists (
        select 1 from public.project_members m
        where m.project_id = collab_requests.project_id and m.user_id = (select auth.uid())
      )
    )
  );
create policy "collab_requests: receiver answers"
  on public.collab_requests for update to authenticated
  using (receiver_id = (select auth.uid()) and status = 'pending')
  with check (receiver_id = (select auth.uid()) and status in ('accepted', 'declined'));
create policy "collab_requests: sender withdraws pending"
  on public.collab_requests for delete to authenticated
  using (sender_id = (select auth.uid()) and status = 'pending');

revoke update on public.collab_requests from anon, authenticated;
grant update (status) on public.collab_requests to authenticated;
