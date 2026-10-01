import { LOOKING_FOR, evidenceText, labelOf } from "@/lib/constants";
import type { MyProfile } from "@/lib/queries/profiles";
import { createClient } from "@/lib/supabase/server";
import { resolveActivities, type NetworkActivity } from "./activities";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// The other side of my connections. Accepted rows of other people are readable too
// (migration 13), so the filter on my id is required. `includePending` also keeps
// rejected pairs, which can never reconnect.
async function connectedIds(supabase: Supabase, userId: string, includePending: boolean) {
  let query = supabase
    .from("connections")
    .select("requester_id, addressee_id, status")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  if (!includePending) query = query.eq("status", "accepted");
  const { data, error } = await query;
  if (error) throw error;
  return data.map((c) => (c.requester_id === userId ? c.addressee_id : c.requester_id));
}

// "People for you": not yet connected, ranked by shared skills, shared goals and city.
// Each pick carries the reasons it was chosen.
export async function getPeopleForYou(me: MyProfile, limit = 3) {
  const supabase = await createClient();
  const [mySkills, excluded, candidates] = await Promise.all([
    supabase.from("user_skills").select("skill_id, skills(name)").eq("user_id", me.id),
    connectedIds(supabase, me.id, true),
    supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, headline, city, available, looking_for, user_skills(skill_id, skills(name))")
      .eq("onboarded", true)
      .neq("id", me.id)
      .limit(200),
  ]);
  if (mySkills.error) throw mySkills.error;
  if (candidates.error) throw candidates.error;

  const mine = new Map(mySkills.data.map((s) => [s.skill_id, s.skills?.name ?? ""]));
  const skip = new Set(excluded);
  const myCity = me.city?.toLowerCase();

  return candidates.data
    .filter((p) => !skip.has(p.id))
    .map((p) => {
      const sharedSkills = p.user_skills.filter((s) => mine.has(s.skill_id)).map((s) => mine.get(s.skill_id) ?? "");
      const sharedGoals = p.looking_for.filter((g) => me.looking_for.includes(g));
      const sameCity = Boolean(myCity && p.city?.toLowerCase() === myCity);
      const score = sharedSkills.length * 2 + sharedGoals.length + (sameCity ? 1 : 0) + (p.available ? 0.5 : 0);
      const reasons = [
        ...sharedSkills.slice(0, 2),
        ...(sameCity && p.city ? [p.city] : []),
        ...sharedGoals.slice(0, 1).map((g) => labelOf(LOOKING_FOR, g)),
      ];
      return {
        person: p,
        skills: p.user_skills.flatMap((s) => (s.skills ? [s.skills.name] : [])),
        sharedSkills,
        reasons,
        score,
      };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// "Make your profile stronger": only real gaps, each with where to fix it.
export async function getProfileChecklist(me: MyProfile) {
  const supabase = await createClient();
  const [education, projects, evidence] = await Promise.all([
    supabase.from("education").select("id", { count: "exact", head: true }).eq("user_id", me.id),
    supabase.from("project_members").select("project_id", { count: "exact", head: true }).eq("user_id", me.id),
    supabase.from("user_skill_evidence").select("skill_name, project_count, journey_count").eq("user_id", me.id),
  ]);

  const items: { label: string; href: string }[] = [];
  if (!me.bio) items.push({ label: "O'zingiz haqingizda yozing", href: "/settings/profile" });
  if (!me.avatar_url) items.push({ label: "Rasm qo'shing", href: "/settings/profile" });
  if ((education.count ?? 0) === 0) items.push({ label: "Ta'lim qo'shing", href: "/settings/profile" });
  if ((projects.count ?? 0) === 0) items.push({ label: "Birinchi loyihangizni qo'shing", href: "/projects/new" });
  const unproven = (evidence.data ?? []).find((s) => !evidenceText(s.project_count ?? 0, s.journey_count ?? 0));
  if (unproven?.skill_name) {
    items.push({ label: `${unproven.skill_name} ko'nikmangizni isbotlang`, href: `/u/${me.username}` });
  }
  return items;
}

// "From your network": recent activities of accepted connections.
export async function getNetworkActivity(userId: string, limit = 8): Promise<NetworkActivity[]> {
  const supabase = await createClient();
  const friends = await connectedIds(supabase, userId, false);
  if (friends.length === 0) return [];

  const { data: all, error } = await supabase
    .from("activities")
    .select("id, user_id, type, entity_id, created_at, profiles(username, full_name, avatar_url)")
    .in("user_id", friends)
    .order("created_at", { ascending: false })
    .limit(limit * 3);
  if (error) throw error;

  // A connection is logged for both people: skip ones about me and show each pair once.
  const seenPairs = new Set<string>();
  const rows = all
    .filter((r) => {
      if (r.type !== "connected") return true;
      if (r.entity_id === userId) return false;
      const pair = [r.user_id, r.entity_id].sort().join(":");
      if (seenPairs.has(pair)) return false;
      seenPairs.add(pair);
      return true;
    })
    .slice(0, limit);

  return resolveActivities(supabase, rows);
}
