-- Read helpers: skill evidence, public previews (FIX 2), find_people.

-- ---------------------------------------------------------------------------
-- Skill evidence is computed, not stored: for each user skill, how many of the
-- user's projects and journey items use it ("React · 4 projects · 2 events").
-- security_invoker keeps the caller's RLS in force.
-- ---------------------------------------------------------------------------
create view public.user_skill_evidence
with (security_invoker = true) as
select
  us.user_id,
  us.skill_id,
  s.name::text as skill_name,
  s.category,
  us.level,
  (
    select count(*)::int
    from public.project_members pm
    join public.project_skills ps on ps.project_id = pm.project_id
    where pm.user_id = us.user_id and ps.skill_id = us.skill_id
  ) as project_count,
  (
    select count(*)::int
    from public.journey_items ji
    join public.journey_item_skills jis on jis.journey_item_id = ji.id
    where ji.user_id = us.user_id and jis.skill_id = us.skill_id
  ) as journey_count
from public.user_skills us
join public.skills s on s.id = us.skill_id;

-- ---------------------------------------------------------------------------
-- FIX 2: Welcome page previews for anonymous visitors. Tables stay closed to
-- anon; these return only safe fields of onboarded profiles / projects.
-- ---------------------------------------------------------------------------
create function public.public_people_preview(p_limit int default 6)
returns table (
  full_name   text,
  username    text,
  avatar_url  text,
  headline    text,
  city        text,
  skills      text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.full_name,
    p.username::text,
    p.avatar_url,
    p.headline,
    p.city,
    array(
      select s.name::text
      from public.user_skills us
      join public.skills s on s.id = us.skill_id
      where us.user_id = p.id
      order by case us.level when 'strong' then 0 when 'comfortable' then 1 else 2 end, s.name
      limit 3
    )
  from public.profiles p
  where p.onboarded and p.headline is not null
  order by p.created_at desc
  limit least(greatest(coalesce(p_limit, 6), 1), 12);
$$;

create function public.public_projects_preview(p_limit int default 6)
returns table (
  name      text,
  slug      text,
  tagline   text,
  status    text,
  logo_url  text,
  skills    text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    pr.name,
    pr.slug,
    pr.tagline,
    pr.status,
    pr.logo_url,
    array(
      select s.name::text
      from public.project_skills ps
      join public.skills s on s.id = ps.skill_id
      where ps.project_id = pr.id
      order by s.name
      limit 3
    )
  from public.projects pr
  order by pr.created_at desc
  limit least(greatest(coalesce(p_limit, 6), 1), 12);
$$;

revoke execute on function public.public_people_preview(int) from public;
revoke execute on function public.public_projects_preview(int) from public;
grant execute on function public.public_people_preview(int) to anon, authenticated;
grant execute on function public.public_projects_preview(int) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- find_people: the "Find people" search.
--
-- Every criterion the searcher fills in becomes a reason a person can match:
--   * each required skill they have           -> matched_skill_ids
--   * headline / name / bio mentions the role -> role_match
--   * has a hackathon journey item (for = hackathon) -> has_hackathon
--   * same city, or open to online work       -> location_match
--   * available for collaboration             -> is_open
--   * looking for the same thing              -> looking_for_match
-- Results are sorted by how many criteria match, then by skill evidence
-- (projects + journey items that use the matched skills). No percentages.
--
-- Runs as the caller (security invoker), so normal RLS applies.
-- ---------------------------------------------------------------------------
create function public.find_people(
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
      coalesce(lower(c.city) = lower(params.city_text), false)
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

revoke execute on function public.find_people(text, text, uuid[], text, boolean, boolean, int, int) from public, anon;
grant execute on function public.find_people(text, text, uuid[], text, boolean, boolean, int, int) to authenticated;
