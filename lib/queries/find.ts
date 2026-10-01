import { createClient } from "@/lib/supabase/server";

export type FindParams = {
  role?: string;
  purpose?: string;
  skillIds: string[];
  city?: string;
  online: boolean;
  openOnly: boolean;
};

// Runs find_people() and attaches skill names for the cards and reasons.
export async function findPeople(params: FindParams) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("find_people", {
    p_role: params.role ?? undefined,
    p_purpose: params.purpose ?? undefined,
    p_skill_ids: params.skillIds,
    p_city: params.city ?? undefined,
    p_online_ok: params.online,
    p_open_only: params.openOnly,
    p_limit: 30,
  });
  if (error) throw error;
  if (data.length === 0) return [];

  const { data: skills, error: skillsError } = await supabase
    .from("user_skills")
    .select("user_id, skill_id, skills(name)")
    .in(
      "user_id",
      data.map((p) => p.id),
    );
  if (skillsError) throw skillsError;

  const names = new Map<string, string>();
  const byUser = new Map<string, { id: string; name: string }[]>();
  for (const row of skills) {
    const name = row.skills?.name ?? "";
    names.set(row.skill_id, name);
    byUser.set(row.user_id, [...(byUser.get(row.user_id) ?? []), { id: row.skill_id, name }]);
  }

  return data.map((p) => ({
    ...p,
    skills: byUser.get(p.id) ?? [],
    matchedSkillNames: p.matched_skill_ids.map((id) => names.get(id) ?? ""),
  }));
}

export type FindResult = Awaited<ReturnType<typeof findPeople>>[number];
