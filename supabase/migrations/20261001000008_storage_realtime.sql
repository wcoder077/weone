-- Storage buckets for avatars and project logos, and Realtime for chat + bell.

-- Public-read buckets; images only, 2 MB max.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp']),
  ('project-logos', 'project-logos', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- Objects live under "<user id>/<file>"; only that user writes their folder.
create policy "avatars: owner uploads"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: owner updates"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: owner deletes"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Project logos live under "<project id>/<file>"; only the project owner writes.
-- The folder is checked as text first so a malformed path is denied, not an error.
create function public.owns_project_folder(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (storage.foldername(object_name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_project_owner(((storage.foldername(object_name))[1])::uuid)
    else false
  end;
$$;

create policy "project-logos: owner uploads"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'project-logos' and public.owns_project_folder(name));
create policy "project-logos: owner updates"
  on storage.objects for update to authenticated
  using (bucket_id = 'project-logos' and public.owns_project_folder(name));
create policy "project-logos: owner deletes"
  on storage.objects for delete to authenticated
  using (bucket_id = 'project-logos' and public.owns_project_folder(name));

-- Realtime respects RLS on these tables (members / owner only).
alter publication supabase_realtime add table public.messages, public.notifications;
