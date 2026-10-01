import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type ConnectionState =
  | { state: "none" }
  | { state: "outgoing"; connectionId: string }
  | { state: "incoming"; connectionId: string }
  | { state: "connected"; connectionId: string };

// Everything needed to render Connect / Message / Collaborate for any other user.
// RLS returns only rows where the viewer is one of the two sides.
export const getRelationships = cache(async (viewerId: string) => {
  const supabase = await createClient();
  const [connections, collabs] = await Promise.all([
    supabase.from("connections").select("id, requester_id, addressee_id, status").neq("status", "declined"),
    supabase.from("collab_requests").select("sender_id, receiver_id, status").in("status", ["pending", "accepted"]),
  ]);
  if (connections.error) throw connections.error;
  if (collabs.error) throw collabs.error;

  const byUser = new Map<string, ConnectionState>();
  for (const c of connections.data) {
    const outgoing = c.requester_id === viewerId;
    const other = outgoing ? c.addressee_id : c.requester_id;
    byUser.set(
      other,
      c.status === "accepted"
        ? { state: "connected", connectionId: c.id }
        : { state: outgoing ? "outgoing" : "incoming", connectionId: c.id },
    );
  }

  const collabPartners = new Set<string>();
  const pendingCollabSent = new Set<string>();
  for (const r of collabs.data) {
    const other = r.sender_id === viewerId ? r.receiver_id : r.sender_id;
    if (r.status === "accepted") collabPartners.add(other);
    else if (r.sender_id === viewerId) pendingCollabSent.add(other);
  }

  return {
    connection: (userId: string): ConnectionState => byUser.get(userId) ?? { state: "none" },
    // Messaging needs an accepted connection or collaboration (FIX 4).
    canMessage: (userId: string) => byUser.get(userId)?.state === "connected" || collabPartners.has(userId),
    collabPending: (userId: string) => pendingCollabSent.has(userId),
  };
});

export type Relationships = Awaited<ReturnType<typeof getRelationships>>;

// Projects the viewer belongs to, for the Collaborate dialog and project invites.
export const getMyProjectOptions = cache(async (viewerId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_members")
    .select("projects(id, name)")
    .eq("user_id", viewerId);
  if (error) throw error;
  return data.flatMap((r) => (r.projects ? [r.projects] : []));
});
