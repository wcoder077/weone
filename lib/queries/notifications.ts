import { createClient } from "@/lib/supabase/server";

export const REQUEST_TYPES = ["connection_request", "collab_request", "join_request"];

// What a notification row is about, resolved from `entity_id` by type.
export type NotificationTarget =
  | { kind: "connection"; id: string; pending: boolean; message: string | null }
  | { kind: "collab"; id: string; pending: boolean; reason: string; message: string | null; projectName: string | null }
  | { kind: "join"; id: string; pending: boolean; projectName: string; projectSlug: string; message: string | null }
  | { kind: "project"; name: string; slug: string }
  | { kind: "invite"; conversationId: string; projectName: string; projectSlug: string }
  | { kind: "journey"; title: string }
  | { kind: "none" };

export async function getNotifications(userId: string, onlyRequests: boolean) {
  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .select("id, type, entity_id, read, created_at, actor:profiles!notifications_actor_id_fkey(username, full_name, avatar_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (onlyRequests) query = query.in("type", REQUEST_TYPES);
  const { data: rows, error } = await query;
  if (error) throw error;

  const idsOf = (...types: string[]) =>
    rows.filter((r) => types.includes(r.type) && r.entity_id).map((r) => r.entity_id as string);

  const [connections, collabs, joins, projects, invites, journey] = await Promise.all([
    supabase
      .from("connections")
      .select("id, status, conversations(messages(body, created_at))")
      .in("id", idsOf("connection_request", "connection_accepted")),
    supabase
      .from("collab_requests")
      .select("id, status, reason, message, projects(name)")
      .in("id", idsOf("collab_request", "collab_accepted")),
    supabase.from("join_requests").select("id, status, message, projects(name, slug)").in("id", idsOf("join_request")),
    supabase
      .from("projects")
      .select("id, name, slug")
      .in("id", idsOf("join_accepted", "join_declined", "new_project_member")),
    supabase.from("messages").select("id, conversation_id, projects(name, slug)").in("id", idsOf("project_invite")),
    supabase.from("journey_items").select("id, title").in("id", idsOf("journey_confirmed")),
  ]);

  const find = <T extends { id: string }>(list: T[] | null, id: string | null) =>
    id ? list?.find((x) => x.id === id) : undefined;

  function target(type: string, entityId: string | null): NotificationTarget {
    switch (type) {
      case "connection_request":
      case "connection_accepted": {
        const c = find(connections.data, entityId);
        // The request's first message (the earliest one in its chat).
        const first = c?.conversations?.messages.toSorted((a, b) => a.created_at.localeCompare(b.created_at))[0];
        return c
          ? { kind: "connection", id: c.id, pending: c.status === "pending", message: first?.body || null }
          : { kind: "none" };
      }
      case "collab_request":
      case "collab_accepted": {
        const c = find(collabs.data, entityId);
        return c
          ? { kind: "collab", id: c.id, pending: c.status === "pending", reason: c.reason, message: c.message, projectName: c.projects?.name ?? null }
          : { kind: "none" };
      }
      case "join_request": {
        const j = find(joins.data, entityId);
        return j?.projects
          ? { kind: "join", id: j.id, pending: j.status === "pending", projectName: j.projects.name, projectSlug: j.projects.slug, message: j.message }
          : { kind: "none" };
      }
      case "join_accepted":
      case "join_declined":
      case "new_project_member": {
        const p = find(projects.data, entityId);
        return p ? { kind: "project", name: p.name, slug: p.slug } : { kind: "none" };
      }
      case "project_invite": {
        const m = find(invites.data, entityId);
        return m?.projects
          ? { kind: "invite", conversationId: m.conversation_id, projectName: m.projects.name, projectSlug: m.projects.slug }
          : { kind: "none" };
      }
      case "journey_confirmed": {
        const j = find(journey.data, entityId);
        return j ? { kind: "journey", title: j.title } : { kind: "none" };
      }
      default:
        return { kind: "none" };
    }
  }

  return rows.map((r) => ({ ...r, target: target(r.type, r.entity_id) }));
}

export type NotificationItem = Awaited<ReturnType<typeof getNotifications>>[number];

export async function getUnreadCount(userId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);
  return count ?? 0;
}
