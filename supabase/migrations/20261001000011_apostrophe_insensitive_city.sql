-- Uzbek text is typed with several apostrophe characters (' ʻ ʼ ’ `).
-- Compare cities apostrophe-insensitively, e.g. "Farg'ona" = "Fargʻona".

create function public.normalize_apostrophes(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select translate(value, 'ʻʼ’‘`', repeat(chr(39), 5));
$$;

create or replace function public.find_people(
  p_role        text    default null,
  p_purpose     text    default null,   -- 'hackathon' | 'startup' | 'project' | 'learning'
  p_skill_ids   uuid[]  default '{}',
  p_city        text    default null,
  p_online_ok   boolean default false,
  p_open_only   boolean default false,
  p_limit       int     default 20,
  p_offset      int     default 0
)
returns table (
  id                 uuid,
  username           text,
  full_name          text,
  avatar_url         text,
  headline           text,
  city               text,
  available          boolean,
  matched_skill_ids  uuid[],
  role_match         boolean,
  has_hackathon      boolean,
  location_match     boolean,
  is_open            boolean,
  looking_for_match  boolean,
  match_count        int,
  evidence_count     int
)
language sql
stable
security invoker
set search_path = ''
as $$
  with params as (
    select
      nullif(trim(p_role), '')  as role_text,
      nullif(trim(p_city), '')  as city_text,
      coalesce(p_skill_ids, '{}') as skill_ids,
      -- The form's "for" option expressed as a profiles.looking_for value.
      case p_purpose
        when 'hackathon' then 'hackathon_team'
        when 'startup'   then 'startup'
        when 'project'   then 'collaboration'
        when 'learning'  then 'learning'
      end as looking_for_value
  ),
  candidates as (
    select p.*
    from public.profiles p
    where p.onboarded
      and p.id <> (select auth.uid())
      and (not p_open_only or p.available)
  ),
  reasons as (
    select
      c.id,
      c.username::text as username,
      c.full_name,
      c.avatar_url,
      c.headline,
      c.city,
      c.available,
      array(
        select us.skill_id from public.user_skills us
        where us.user_id = c.id and us.skill_id = any (params.skill_ids)
      ) as matched_skill_ids,
      coalesce(
        position(lower(params.role_text) in lower(coalesce(c.headline, ''))) > 0
        or c.search @@ plainto_tsquery('simple', params.role_text),
        false
      ) as role_match,
      p_purpose = 'hackathon' and exists (
        select 1 from public.journey_items ji
        where ji.user_id = c.id and ji.type = 'hackathon'
      ) as has_hackathon,
      coalesce(public.normalize_apostrophes(lower(c.city)) = public.normalize_apostrophes(lower(params.city_text)), false)
        or (p_online_ok and c.is_online_ok) as location_match,
      c.available as is_open,
      coalesce(params.looking_for_value = any (c.looking_for), false) as looking_for_match
    from candidates c
    cross join params
  ),
  scored as (
    select
      r.*,
      cardinality(r.matched_skill_ids)
        + r.role_match::int
        + coalesce(r.has_hackathon, false)::int
        + r.location_match::int
        + r.is_open::int
        + r.looking_for_match::int as match_count,
      -- Evidence for the matched skills, or for all skills when none were required.
      coalesce((
        select sum(e.project_count + e.journey_count)::int
        from public.user_skill_evidence e
        where e.user_id = r.id
          and (cardinality(r.matched_skill_ids) = 0 or e.skill_id = any (r.matched_skill_ids))
      ), 0) as evidence_count
    from reasons r
  )
  select
    s.id, s.username, s.full_name, s.avatar_url, s.headline, s.city, s.available,
    s.matched_skill_ids, s.role_match, coalesce(s.has_hackathon, false), s.location_match,
    s.is_open, s.looking_for_match, s.match_count, s.evidence_count
  from scored s
  -- When skills are required, a person must have at least one of them.
  where coalesce(cardinality(p_skill_ids), 0) = 0
     or cardinality(s.matched_skill_ids) > 0
  order by s.match_count desc, s.evidence_count desc, s.full_name
  limit least(greatest(coalesce(p_limit, 20), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

