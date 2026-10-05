import { cache } from "react";
import { PROFILE_COLUMNS } from "@/lib/db-columns";
import { createClient } from "@/lib/supabase/server";

// Everything the /u/[username] page shows. Returns null for an unknown username.
export const getProfilePage = cache(async (username: string) => {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("username", username)
    .maybeSingle();
  if (error) throw error;
  if (!profile) return null;

  const [skills, education, journey, memberships] = await Promise.all([
    supabase
      .from("user_skill_evidence")
      .select("skill_id, skill_name, level, project_count, journey_count")
      .eq("user_id", profile.id),
    supabase
      .from("education")
      .select("*")
      .eq("user_id", profile.id)
      .order("start_year", { ascending: false, nullsFirst: false }),
    supabase
      .from("journey_items")
      .select("*, journey_item_skills(skill_id, skills(name)), journey_confirmations(confirmer_id)")
      .eq("user_id", profile.id)
      .order("start_date", { ascending: false, nullsFirst: false }),
    supabase
      .from("project_members")
      .select(
        "role, projects(id, owner_id, name, slug, tagline, status, logo_url, project_skills(skill_id, skills(name)))",
      )
      .eq("user_id", profile.id),
  ]);

  for (const result of [skills, education, journey, memberships]) {
    if (result.error) throw result.error;
  }

  return {
    profile,
    skills: (skills.data ?? []).sort(
      (a, b) =>
        (b.project_count ?? 0) + (b.journey_count ?? 0) - ((a.project_count ?? 0) + (a.journey_count ?? 0)),
    ),
    education: education.data ?? [],
    journey: journey.data ?? [],
    projects: (memberships.data ?? []).flatMap((m) =>
      m.projects
        ? [
            {
              ...m.projects,
              role: m.role,
              skillIds: m.projects.project_skills.map((s) => s.skill_id),
              skills: m.projects.project_skills.flatMap((s) => (s.skills ? [s.skills.name] : [])),
            },
          ]
        : [],
    ),
  };
});

export type ProfilePage = NonNullable<Awaited<ReturnType<typeof getProfilePage>>>;
export type JourneyItem = ProfilePage["journey"][number];

// The viewer's hackathon/competition items, used to offer "Confirm" on someone else's
// matching item. The database re-checks this rule on insert.
export async function getMyEventItems(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journey_items")
    .select("type, title, organization, start_date")
    .eq("user_id", userId)
    .in("type", ["hackathon", "competition"]);
  if (error) throw error;
  return data;
}

type EventKey = { type: string; title: string; organization: string | null; start_date: string | null };

export function isSameEvent(a: EventKey, b: EventKey) {
  return (
    a.type === b.type &&
    a.title.toLowerCase() === b.title.toLowerCase() &&
    (a.organization ?? "").toLowerCase() === (b.organization ?? "").toLowerCase() &&
    a.organization !== null &&
    a.start_date !== null &&
    b.start_date !== null &&
    a.start_date.slice(0, 7) === b.start_date.slice(0, 7)
  );
}
