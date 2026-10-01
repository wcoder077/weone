import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

type ActivityRowData = {
  id: string;
  user_id: string;
  type: string;
  entity_id: string;
  created_at: string;
  profiles: { username: string; full_name: string; avatar_url: string | null } | null;
};

export type NetworkActivity = {
  id: string;
  createdAt: string;
  actor: { username: string; full_name: string; avatar_url: string | null };
  type: string;
  target: { label: string; href: string } | null;
};

const ACTIVITY_FIELDS = "id, user_id, type, entity_id, created_at, profiles(username, full_name, avatar_url)";

// Turns activity rows into display rows; rows whose target no longer exists are dropped.
export async function resolveActivities(supabase: Supabase, rows: ActivityRowData[]): Promise<NetworkActivity[]> {
  const idsOf = (...types: string[]) => rows.filter((r) => types.includes(r.type)).map((r) => r.entity_id);
  const [projects, items, people] = await Promise.all([
    supabase.from("projects").select("id, name, slug").in("id", idsOf("joined_project", "launched_project", "started_project")),
    supabase.from("journey_items").select("id, title, user_id, profiles(username)").in("id", idsOf("added_journey")),
    supabase.from("profiles").select("id, username, full_name").in("id", idsOf("connected")),
  ]);

  return rows.flatMap((r) => {
    if (!r.profiles) return [];
    let target: NetworkActivity["target"] = null;
    if (r.type === "added_journey") {
      const item = items.data?.find((i) => i.id === r.entity_id);
      if (item) target = { label: item.title, href: `/u/${item.profiles?.username ?? r.profiles.username}` };
    } else if (r.type === "connected") {
      const person = people.data?.find((p) => p.id === r.entity_id);
      if (person) target = { label: person.full_name, href: `/u/${person.username}` };
    } else {
      const project = projects.data?.find((p) => p.id === r.entity_id);
      if (project) target = { label: project.name, href: `/projects/${project.slug}` };
    }
    return target ? [{ id: r.id, createdAt: r.created_at, actor: r.profiles, type: r.type, target }] : [];
  });
}

// Profile sidebar: accepted connections and posts counts + the person's latest activities.
export async function getProfileSummary(profileId: string, limit = 4) {
  const supabase = await createClient();
  const [connections, posts, activities] = await Promise.all([
    supabase
      .from("connections")
      .select("id", { count: "exact", head: true })
      .eq("status", "accepted")
      .or(`requester_id.eq.${profileId},addressee_id.eq.${profileId}`),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", profileId),
    supabase
      .from("activities")
      .select(ACTIVITY_FIELDS)
      .eq("user_id", profileId)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);
  if (connections.error) throw connections.error;
  if (posts.error) throw posts.error;
  if (activities.error) throw activities.error;

  return {
    connections: connections.count ?? 0,
    posts: posts.count ?? 0,
    activity: await resolveActivities(supabase, activities.data),
  };
}
