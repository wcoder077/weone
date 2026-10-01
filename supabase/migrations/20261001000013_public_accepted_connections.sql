-- Milestone 2: accepted connections are shown on profiles to every signed-in
-- viewer; pending and rejected requests stay visible only to their two sides.

drop policy "connections: both sides read" on public.connections;

create policy "connections: accepted public, requests private"
  on public.connections for select to authenticated
  using (status = 'accepted' or (select auth.uid()) in (requester_id, addressee_id));
