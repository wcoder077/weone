import { cache } from "react";
import { PROJECT_COLUMNS } from "@/lib/db-columns";
import { createClient } from "@/lib/supabase/server";

const CARD_SELECT = `
  id, name, slug, tagline, status, logo_url, category, is_looking, owner_id, created_at,
  project_skills(skill_id, skills(name)),
  project_members(user_id, profiles(full_name, avatar_url)),
  project_roles(id, title, is_open, project_role_skills(skill_id))
`;

export type ProjectListTab = "for-you" | "looking" | "mine";

export type ProjectFilters = {
  category?: string;
  status?: string;
  stackSkillId?: string;
};

const LIST_LIMIT = 60;

function toCard(row: ProjectRow) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    tagline: row.tagline,
    status: row.status,
    logo_url: row.logo_url,
    owner_id: row.owner_id,
    skills: row.project_skills.flatMap((s) => (s.skills ? [s.skills.name] : [])),
    skillIds: row.project_skills.map((s) => s.skill_id),
    members: row.project_members.flatMap((m) =>
      m.profiles ? [{ id: m.user_id, name: m.profiles.full_name, avatarUrl: m.profiles.avatar_url }] : [],
    ),
    openRoles: row.project_roles
      .filter((r) => r.is_open)
      .map((r) => ({ id: r.id, title: r.title, skillIds: r.project_role_skills.map((s) => s.skill_id) })),
  };
}

type ProjectRow = NonNullable<Awaited<ReturnType<typeof fetchCards>>["data"]>[number];
export type ProjectCardItem = ReturnType<typeof toCard>;

async function fetchCards(ids?: string[], filters: ProjectFilters = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select(CARD_SELECT)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);
  if (ids) query = query.in("id", ids);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.category) query = query.eq("category", filters.category);
  return query;
}

async function idsWithSkill(skillId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("project_skills").select("project_id").eq("skill_id", skillId);
  if (error) throw error;
  return data.map((r) => r.project_id);
}

async function myProjectIds(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("project_members").select("project_id").eq("user_id", userId);
  if (error) throw error;
  return data.map((r) => r.project_id);
}

async function mySkillIds(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("user_skills").select("skill_id").eq("user_id", userId);
  if (error) throw error;
  return new Set(data.map((r) => r.skill_id));
}

// Number of my skills that an open role asks for, summed over the project's open roles.
function roleMatchScore(project: ProjectCardItem, skills: Set<string>) {
  return project.openRoles.reduce((sum, role) => sum + role.skillIds.filter((id) => skills.has(id)).length, 0);
}

export async function listProjects(userId: string, tab: ProjectListTab, filters: ProjectFilters) {
  let ids: string[] | undefined;
  if (filters.stackSkillId) ids = await idsWithSkill(filters.stackSkillId);

  const mine = await myProjectIds(userId);
  if (tab === "mine") ids = ids ? ids.filter((id) => mine.includes(id)) : mine;
  if (ids && ids.length === 0) return [];

  const { data, error } = await fetchCards(ids, filters);
  if (error) throw error;

  let projects = data.map(toCard);

  if (tab === "looking") projects = projects.filter((p) => p.openRoles.length > 0);

  // "For you": projects I'm not in, with open roles that need my skills, best match first.
  if (tab === "for-you") {
    const skills = await mySkillIds(userId);
    projects = projects
      .filter((p) => !mine.includes(p.id))
      .map((p) => ({ project: p, score: roleMatchScore(p, skills) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.project);
  }

  return projects;
}

export const getProjectCategories = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").select("category").not("category", "is", null);
  if (error) throw error;
  return [...new Set(data.map((r) => r.category).filter((c): c is string => Boolean(c)))].sort();
});

// ---------------------------------------------------------------------------
// Project details
// ---------------------------------------------------------------------------

export const getProject = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      `${PROJECT_COLUMNS},
      owner:profiles!projects_owner_id_fkey(id, username, full_name, avatar_url),
      project_skills(skill_id, skills(name)),
      project_members(user_id, role, created_at, profiles(username, full_name, avatar_url, headline)),
      project_roles(id, title, is_open, project_role_skills(skill_id, skills(name)))`,
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
});

export type ProjectDetails = NonNullable<Awaited<ReturnType<typeof getProject>>>;

// Owner sees all requests; anyone else sees only their own (RLS).
export async function getJoinRequests(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("join_requests")
    .select("id, user_id, status, message, created_at, project_role_id, profiles(username, full_name, avatar_url, headline)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export type JoinRequestRow = Awaited<ReturnType<typeof getJoinRequests>>[number];
