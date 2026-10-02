-- Hashtags. The tags of a post are read from its text by a trigger (never written by users),
-- so a tag always matches what the post says. A tag is "#" at the start or after whitespace/"(",
-- followed by letters, digits or "_" (any language); lower-cased; at most 10 per post;
-- not only digits (so "#1" is just text).

create table public.post_tags (
  post_id     uuid not null references public.posts (id) on delete cascade,
  tag         text not null check (char_length(tag) between 2 and 50),
  created_at  timestamptz not null,
  primary key (post_id, tag)
);

-- A tag page lists the newest posts first.
create index post_tags_tag_created_at_idx on public.post_tags (tag, created_at desc);

alter table public.post_tags enable row level security;
create policy "post_tags: signed-in users read"
  on public.post_tags for select to authenticated using (true);
-- No insert/update/delete policies: only the trigger below writes.

create function public.sync_post_tags()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.post_tags where post_id = new.id;
  insert into public.post_tags (post_id, tag, created_at)
  select new.id, t.tag, new.created_at
  from (
    select distinct on (tag) tag
    from (
      select lower(m[1]) as tag
      from regexp_matches(new.body, '(?:^|[\s(])#([^\s#.,;:!?(){}\[\]<>"''/\\|@$%^&*+=~`-]{2,50})', 'g') as m
    ) found
    where tag !~ '^[0-9_]+$'
    order by tag
    limit 10
  ) t;
  return new;
end;
$$;

revoke execute on function public.sync_post_tags() from public, anon, authenticated;

create trigger posts_sync_tags
  after insert or update of body on public.posts
  for each row execute function public.sync_post_tags();

-- Tags of posts that already exist (adds rows only; no post is changed).
insert into public.post_tags (post_id, tag, created_at)
select p.id, t.tag, p.created_at
from public.posts p
cross join lateral (
  select distinct on (tag) tag
  from (
    select lower(m[1]) as tag
    from regexp_matches(p.body, '(?:^|[\s(])#([^\s#.,;:!?(){}\[\]<>"''/\\|@$%^&*+=~`-]{2,50})', 'g') as m
  ) found
  where tag !~ '^[0-9_]+$'
  order by tag
  limit 10
) t
on conflict do nothing;
