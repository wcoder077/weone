import { createClient } from "@/lib/supabase/server";

export const PAGE_SIZE = 20;

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type PeopleFilters = {
  q?: string;
  skillIds: string[];
  city?: string;
  role?: string;
  available: boolean;
  language?: string;
  online: boolean;
  page: number;
};

export type ProjectSearchFilters = {
  q?: string;
  skillIds: string[];
  status?: string;
  page: number;
};

// Text safe to embed in PostgREST filter strings (or=, ilike).
function cleanTerm(value: string) {
  return value.replace(/[,()"'\\%_*:]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

// FIX 1: skills are matched with a join, not inside the tsvector.
// Returns ids of skills whose name starts with the search text.
async function skillIdsMatching(supabase: Supabase, term: string) {
  const { data, error } = await supabase.from("skills").select("id").ilike("name", `${term}%`).limit(20);
  if (error) throw error;
  return data.map((r) => r.id);
}

type SkillTable = "user_skills" | "project_skills";

// (owner id, skill id) pairs for the given skills; owner = user or project.
async function skillOwners(supabase: Supabase, table: SkillTable, skillIds: string[]) {
  if (table === "user_skills") {
    const { data, error } = await supabase.from("user_skills").select("user_id, skill_id").in("skill_id", skillIds);
    if (error) throw error;
    return data.map((r) => r.user_id);
  }
  const { data, error } = await supabase.from("project_skills").select("project_id, skill_id").in("skill_id", skillIds);
  if (error) throw error;
  return data.map((r) => r.project_id);
}

// Owners that have ALL of `skillIds`.
async function ownersWithAllSkills(supabase: Supabase, table: SkillTable, skillIds: string[]) {
  const counts = new Map<string, number>();
  for (const owner of await skillOwners(supabase, table, skillIds)) {
    counts.set(owner, (counts.get(owner) ?? 0) + 1);
  }
  return [...counts].filter(([, n]) => n >= skillIds.length).map(([id]) => id);
}

async function ownersWithAnySkill(supabase: Supabase, table: SkillTable, skillIds: string[]) {
  if (skillIds.length === 0) return [];
  return [...new Set(await skillOwners(supabase, table, skillIds))];
}

export async function searchPeople(viewerId: string, f: PeopleFilters) {
  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select(
      "id, username, full_name, avatar_url, headline, city, available, is_online_ok, looking_for, user_skills(skill_id, level, skills(name))",
      { count: "exact" },
    )
    .eq("onboarded", true)
    .neq("id", viewerId);

  const term = f.q ? cleanTerm(f.q) : "";
  if (term) {
    const bySkill = await ownersWithAnySkill(supabase, "user_skills", await skillIdsMatching(supabase, term));
    const textFilter = `search.wfts(simple).${term}`;
    query = query.or(bySkill.length ? `${textFilter},id.in.(${bySkill.join(",")})` : textFilter);
  }
  if (f.skillIds.length) {
    const ids = await ownersWithAllSkills(supabase, "user_skills", f.skillIds);
    if (ids.length === 0) return { people: [], total: 0 };
    query = query.in("id", ids);
  }
  if (f.city) query = query.ilike("city", cleanTerm(f.city));
  if (f.role) query = query.ilike("headline", `%${cleanTerm(f.role)}%`);
  if (f.available) query = query.eq("available", true);
  if (f.online) query = query.eq("is_online_ok", true);
  if (f.language) query = query.contains("languages", [f.language]);

  const from = (f.page - 1) * PAGE_SIZE;
  const { data, count, error } = await query
    .order("available", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  return { people: data, total: count ?? 0 };
}

export type DiscoverPerson = Awaited<ReturnType<typeof searchPeople>>["people"][number];

export async function searchProjects(f: ProjectSearchFilters) {
  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select(
      `id, name, slug, tagline, status, logo_url,
       project_skills(skill_id, skills(name)),
       project_members(user_id, profiles(full_name, avatar_url)),
       project_roles(title, is_open)`,
      { count: "exact" },
    );

  const term = f.q ? cleanTerm(f.q) : "";
  if (term) {
    const bySkill = await ownersWithAnySkill(supabase, "project_skills", await skillIdsMatching(supabase, term));
    const textFilter = `search.wfts(simple).${term}`;
    query = query.or(bySkill.length ? `${textFilter},id.in.(${bySkill.join(",")})` : textFilter);
  }
  if (f.skillIds.length) {
    const ids = await ownersWithAllSkills(supabase, "project_skills", f.skillIds);
    if (ids.length === 0) return { projects: [], total: 0 };
    query = query.in("id", ids);
  }
  if (f.status) query = query.eq("status", f.status);

  const from = (f.page - 1) * PAGE_SIZE;
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  return { projects: data, total: count ?? 0 };
}

export async function getLanguages() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("languages").eq("onboarded", true);
  if (error) throw error;
  return [...new Set(data.flatMap((r) => r.languages))].sort();
}
