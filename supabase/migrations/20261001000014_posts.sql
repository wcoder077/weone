-- Milestone 6: text posts (≤ 500 graphemes). Authors edit and delete their own.

create table public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null
              check (char_length(trim(body)) > 0 and public.grapheme_length(body) <= 500),
  created_at  timestamptz not null default now(),
  edited_at   timestamptz
);

create index posts_created_at_idx on public.posts (created_at desc);
create index posts_author_id_created_at_idx on public.posts (author_id, created_at desc);

alter table public.posts enable row level security;

create policy "posts: signed-in users read"
  on public.posts for select to authenticated using (true);
create policy "posts: author writes"
  on public.posts for insert to authenticated with check (author_id = (select auth.uid()));
create policy "posts: author edits"
  on public.posts for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
create policy "posts: author deletes"
  on public.posts for delete to authenticated using (author_id = (select auth.uid()));

-- Clients set only the author and text; timestamps come from the database.
revoke insert, update on public.posts from anon, authenticated;
grant insert (author_id, body) on public.posts to authenticated;
grant update (body) on public.posts to authenticated;

create function public.mark_post_edited()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.body is distinct from old.body then
    new.edited_at := now();
  end if;
  return new;
end;
$$;

create trigger on_post_edited
  before update on public.posts
  for each row execute function public.mark_post_edited();

revoke execute on function public.mark_post_edited() from public, anon, authenticated;
