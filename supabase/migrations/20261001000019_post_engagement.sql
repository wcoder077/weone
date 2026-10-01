-- Posts: one photo or video per post, likes, comments, views and reposts.
-- Counters live on `posts` and are kept by triggers; clients can never write them.
--
-- Media limits: edit lib/attachments.ts AND update the bucket, for example:
--   update storage.buckets set file_size_limit = 52428800 where id = 'post-media';   -- Supabase Free allows at most 50 MB

alter table public.posts
  add column media_path text,
  add column media_type text check (media_type in ('image', 'video')),
  add column media_name text check (char_length(media_name) between 1 and 120),
  add column repost_of uuid references public.posts (id) on delete cascade,
  add column like_count integer not null default 0 check (like_count >= 0),
  add column comment_count integer not null default 0 check (comment_count >= 0),
  add column view_count integer not null default 0 check (view_count >= 0),
  add column repost_count integer not null default 0 check (repost_count >= 0),
  drop constraint posts_body_check,
  add constraint posts_body_check check (public.grapheme_length(body) <= 500),
  -- A post needs text, a photo/video, or to be a repost.
  add constraint posts_content_check check (
    char_length(trim(body)) > 0 or media_path is not null or repost_of is not null
  ),
  add constraint posts_media_all_or_none check (
    (media_path is null and media_type is null and media_name is null)
    or (media_path is not null and media_type is not null and media_name is not null and repost_of is null)
  ),
  -- <author id>/<uuid>.<ext>
  add constraint posts_media_path_format check (
    media_path is null
    or media_path ~ ('^' || author_id::text || '/[0-9a-f-]{36}\.[a-z0-9]{1,5}$')
  );

create index posts_repost_of_idx on public.posts (repost_of) where repost_of is not null;

-- ---------------------------------------------------------------------------
-- Likes, comments, views
-- ---------------------------------------------------------------------------
create table public.post_likes (
  post_id     uuid not null references public.posts (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index post_likes_user_id_idx on public.post_likes (user_id);

create table public.post_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null check (char_length(trim(body)) > 0 and public.grapheme_length(body) <= 500),
  created_at  timestamptz not null default now()
);
create index post_comments_post_id_created_at_idx on public.post_comments (post_id, created_at);
create index post_comments_author_id_idx on public.post_comments (author_id);

-- One row per (post, viewer). Written only through record_post_views().
create table public.post_views (
  post_id     uuid not null references public.posts (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index post_views_user_id_idx on public.post_views (user_id);

alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_views enable row level security;

create policy "post_likes: signed-in users read"
  on public.post_likes for select to authenticated using (true);
create policy "post_likes: like as yourself"
  on public.post_likes for insert to authenticated with check (user_id = (select auth.uid()));
create policy "post_likes: remove own like"
  on public.post_likes for delete to authenticated using (user_id = (select auth.uid()));

create policy "post_comments: signed-in users read"
  on public.post_comments for select to authenticated using (true);
create policy "post_comments: comment as yourself"
  on public.post_comments for insert to authenticated with check (author_id = (select auth.uid()));
-- The commenter or the post's author can delete a comment.
create policy "post_comments: author or post owner deletes"
  on public.post_comments for delete to authenticated
  using (
    author_id = (select auth.uid())
    or exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid()))
  );

-- post_views has no policies: nobody reads or writes it directly.
revoke all on public.post_views from anon, authenticated;
revoke insert, update, delete on public.post_likes, public.post_comments from anon, authenticated;
grant insert on public.post_likes to authenticated;
grant delete on public.post_likes to authenticated;
grant insert (post_id, author_id, body) on public.post_comments to authenticated;
grant delete on public.post_comments to authenticated;

-- ---------------------------------------------------------------------------
-- Counters (security definer: clients have no write access to the counter columns)
-- ---------------------------------------------------------------------------
create function public.update_post_counters()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  delta integer := case when tg_op = 'INSERT' then 1 else -1 end;
  pid uuid := case when tg_op = 'INSERT' then new.post_id else old.post_id end;
begin
  if tg_table_name = 'post_likes' then
    update public.posts set like_count = greatest(like_count + delta, 0) where id = pid;
  elsif tg_table_name = 'post_comments' then
    update public.posts set comment_count = greatest(comment_count + delta, 0) where id = pid;
  elsif tg_table_name = 'post_views' then
    update public.posts set view_count = greatest(view_count + delta, 0) where id = pid;
  end if;
  return null;
end;
$$;

create trigger on_post_like_change
  after insert or delete on public.post_likes
  for each row execute function public.update_post_counters();
create trigger on_post_comment_change
  after insert or delete on public.post_comments
  for each row execute function public.update_post_counters();
create trigger on_post_view_change
  after insert or delete on public.post_views
  for each row execute function public.update_post_counters();

create function public.update_repost_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.repost_of is not null then
    update public.posts set repost_count = repost_count + 1 where id = new.repost_of;
  elsif tg_op = 'DELETE' and old.repost_of is not null then
    update public.posts set repost_count = greatest(repost_count - 1, 0) where id = old.repost_of;
  end if;
  return null;
end;
$$;

create trigger on_repost_change
  after insert or delete on public.posts
  for each row execute function public.update_repost_count();

revoke execute on function public.update_post_counters() from public, anon, authenticated;
revoke execute on function public.update_repost_count() from public, anon, authenticated;

-- Marks posts as seen by the signed-in user (never the author) and returns the ids that
-- were seen for the first time. Up to 50 ids per call.
create function public.record_post_views(p_post_ids uuid[])
returns setof uuid
language sql
security definer
set search_path = ''
as $$
  insert into public.post_views (post_id, user_id)
  select p.id, (select auth.uid())
  from public.posts p
  where p.id = any (p_post_ids[1:50])
    and p.author_id <> (select auth.uid())
    and (select auth.uid()) is not null
  on conflict do nothing
  returning post_id;
$$;

revoke execute on function public.record_post_views(uuid[]) from public, anon;
grant execute on function public.record_post_views(uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Media bucket (private, signed URLs). Path: <author id>/<uuid>.<ext>
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-media', 'post-media', false, 20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do nothing;

create function public.post_media_exists(p_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from storage.objects o where o.bucket_id = 'post-media' and o.name = p_path);
$$;

revoke execute on function public.post_media_exists(text) from public, anon;
grant execute on function public.post_media_exists(text) to authenticated;

create policy "post-media: owner uploads"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'post-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "post-media: owner deletes"
  on storage.objects for delete to authenticated
  using (bucket_id = 'post-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
-- Posts are visible to every signed-in user, so their media is too.
create policy "post-media: signed-in users read"
  on storage.objects for select to authenticated using (bucket_id = 'post-media');

-- ---------------------------------------------------------------------------
-- Posts: clients may now set media and repost_of on insert (never the counters).
-- ---------------------------------------------------------------------------
grant insert (media_path, media_type, media_name, repost_of) on public.posts to authenticated;

drop policy "posts: author writes" on public.posts;
create policy "posts: author writes"
  on public.posts for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (media_path is null or public.post_media_exists(media_path))
    -- Reposts always point at an original post, never at another repost.
    and (
      repost_of is null
      or exists (select 1 from public.posts o where o.id = posts.repost_of and o.repost_of is null)
    )
  );
