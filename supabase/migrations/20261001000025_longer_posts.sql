-- Posts up to 2000 graphemes (was 500). Comments stay at 500. Existing posts already fit.
alter table public.posts
  drop constraint posts_body_check,
  add constraint posts_body_check check (public.grapheme_length(body) <= 2000);
