-- Profile banner (cover image). Path is "<owner id>/<uuid>.webp" in the public
-- `banners` bucket; only the owner can write their folder or their profile row.

alter table public.profiles
  add column banner_path text,
  add column banner_position smallint not null default 50 check (banner_position between 0 and 100),
  add constraint profiles_banner_path_owner check (
    banner_path is null
    or banner_path ~ ('^' || id::text || '/[0-9a-f-]{36}\.(webp|jpg|png)$')
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('banners', 'banners', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "banners: owner uploads"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'banners' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "banners: owner updates"
  on storage.objects for update to authenticated
  using (bucket_id = 'banners' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "banners: owner deletes"
  on storage.objects for delete to authenticated
  using (bucket_id = 'banners' and (storage.foldername(name))[1] = (select auth.uid())::text);
