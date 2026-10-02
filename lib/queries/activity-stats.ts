import { createClient } from "@/lib/supabase/server";

// Profile activity: what the person did and when, from their own rows
// (posts, reposts, accepted connections, projects, journey, comments).

export const ACTIVITY_WEEKS = 12;
const WEEK_MS = 7 * 86_400_000;
const LIMIT = 500; // per source, plenty for a profile

export const ACTIVITY_KINDS = ["post", "repost", "connection", "project", "journey", "comment"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export const ACTIVITY_LABELS: Record<ActivityKind, string> = {
  post: "Postlar",
  repost: "Repostlar",
  connection: "Bog'lanishlar",
  project: "Loyihalar",
  journey: "Yo'l",
  comment: "Izohlar",
};

export type ActivityEvent = { kind: ActivityKind; at: string; text: string; href: string | null };
export type ActivityWeek = { start: string; count: number };

export type ActivityStats = {
  totals: Record<ActivityKind, number>;
  /** Oldest → newest, the last bucket ends now. */
  weeks: ActivityWeek[];
  weeksByKind: Record<ActivityKind, number[]>;
  activeDays: number; // distinct days with activity in the chart window
  events: ActivityEvent[]; // newest first
};

const snippet = (text: string, max = 60) => {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
};

export async function getActivityStats(userId: string): Promise<ActivityStats> {
  const supabase = await createClient();
  const [posts, connections, projects, journey, comments] = await Promise.all([
    supabase
      .from("posts")
      .select("id, body, created_at, repost_of")
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("connections")
      .select("requester_id, addressee_id, created_at, responded_at")
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .limit(LIMIT),
    supabase
      .from("project_members")
      .select("created_at, role, projects(name, slug)")
      .eq("user_id", userId)
      .limit(LIMIT),
    supabase.from("journey_items").select("id, title, created_at").eq("user_id", userId).limit(LIMIT),
    supabase
      .from("post_comments")
      .select("id, body, created_at, post_id")
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(LIMIT),
  ]);
  for (const r of [posts, connections, projects, journey, comments]) if (r.error) throw r.error;

  // Names of the people this user connected with.
  const otherIds = (connections.data ?? []).map((c) => (c.requester_id === userId ? c.addressee_id : c.requester_id));
  const people = otherIds.length
    ? ((await supabase.from("profiles").select("id, username, full_name").in("id", otherIds)).data ?? [])
    : [];
  const personById = new Map(people.map((p) => [p.id, p]));

  const events: ActivityEvent[] = [
    ...(posts.data ?? []).map((p): ActivityEvent =>
      p.repost_of
        ? { kind: "repost", at: p.created_at, text: p.body ? `Repost qildi: «${snippet(p.body)}»` : "Repost qildi", href: `/posts/${p.id}` }
        : { kind: "post", at: p.created_at, text: p.body ? `Post joyladi: «${snippet(p.body)}»` : "Post joyladi", href: `/posts/${p.id}` },
    ),
    ...(connections.data ?? []).map((c): ActivityEvent => {
      const other = personById.get(c.requester_id === userId ? c.addressee_id : c.requester_id);
      return {
        kind: "connection",
        at: c.responded_at ?? c.created_at,
        text: `${other?.full_name || "Maqsaddosh"} bilan bog'landi`,
        href: other ? `/u/${other.username}` : null,
      };
    }),
    ...(projects.data ?? []).map((m): ActivityEvent => ({
      kind: "project",
      at: m.created_at,
      text: m.role === "Owner" ? `«${m.projects?.name ?? "Loyiha"}» loyihasini boshladi` : `«${m.projects?.name ?? "Loyiha"}» loyihasiga qo'shildi`,
      href: m.projects ? `/projects/${m.projects.slug}` : null,
    })),
    ...(journey.data ?? []).map((j): ActivityEvent => ({ kind: "journey", at: j.created_at, text: `Yo'liga qo'shdi: ${j.title}`, href: null })),
    ...(comments.data ?? []).map((c): ActivityEvent => ({
      kind: "comment",
      at: c.created_at,
      text: `Izoh yozdi: «${snippet(c.body)}»`,
      href: `/posts/${c.post_id}`,
    })),
  ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  // Weekly buckets: the last bucket is the 7 days ending now.
  const now = Date.now();
  const empty = () => Array.from({ length: ACTIVITY_WEEKS }, () => 0);
  const weeksByKind = Object.fromEntries(ACTIVITY_KINDS.map((k) => [k, empty()])) as Record<ActivityKind, number[]>;
  const totals = Object.fromEntries(ACTIVITY_KINDS.map((k) => [k, 0])) as Record<ActivityKind, number>;
  const days = new Set<string>();
  for (const e of events) {
    totals[e.kind] += 1;
    const age = Math.floor((now - Date.parse(e.at)) / WEEK_MS);
    if (age >= 0 && age < ACTIVITY_WEEKS) {
      weeksByKind[e.kind][ACTIVITY_WEEKS - 1 - age] += 1;
      days.add(e.at.slice(0, 10));
    }
  }
  const weeks = empty().map((_, i) => ({
    start: new Date(now - (ACTIVITY_WEEKS - i) * WEEK_MS).toISOString(),
    count: ACTIVITY_KINDS.reduce((sum, k) => sum + weeksByKind[k][i], 0),
  }));

  return { totals, weeks, weeksByKind, activeDays: days.size, events };
}
