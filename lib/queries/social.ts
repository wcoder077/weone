import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type ConnectionState =
  | { state: "none" }
  | { state: "outgoing"; connectionId: string }
  | { state: "incoming"; connectionId: string }
  | { state: "connected"; connectionId: string }
  | { state: "rejected"; connectionId: string; byMe: boolean };

// The viewer's connection state with every user they have a request with.
// RLS returns pending/rejected rows only to their two sides.
export const getRelationships = cache(async (viewerId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("connections")
    .select("id, requester_id, addressee_id, status")
    .or(`requester_id.eq.${viewerId},addressee_id.eq.${viewerId}`);
  if (error) throw error;

  const byUser = new Map<string, ConnectionState>();
  for (const c of data) {
    const outgoing = c.requester_id === viewerId;
    const other = outgoing ? c.addressee_id : c.requester_id;
    const state: ConnectionState =
      c.status === "accepted"
        ? { state: "connected", connectionId: c.id }
        : c.status === "rejected"
          ? { state: "rejected", connectionId: c.id, byMe: !outgoing }
          : { state: outgoing ? "outgoing" : "incoming", connectionId: c.id };
    byUser.set(other, state);
  }

  return {
    connection: (userId: string): ConnectionState => byUser.get(userId) ?? { state: "none" },
  };
});

// Projects the viewer belongs to, for project invites in chat.
export const getMyProjectOptions = cache(async (viewerId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_members")
    .select("projects(id, name)")
    .eq("user_id", viewerId);
  if (error) throw error;
  return data.flatMap((r) => (r.projects ? [r.projects] : []));
});

const PERSON = "id, username, full_name, avatar_url, headline";

// Everyone this profile connected with, one row per pair. RLS shows accepted
// connections to all viewers and pending/rejected ones only to their two sides.
export async function getProfileConnections(profileId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("connections")
    .select(
      `id, status, requester_id, created_at,
       requester:profiles!connections_requester_id_fkey(${PERSON}),
       addressee:profiles!connections_addressee_id_fkey(${PERSON})`,
    )
    .or(`requester_id.eq.${profileId},addressee_id.eq.${profileId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return data.flatMap((c) => {
    const other = c.requester_id === profileId ? c.addressee : c.requester;
    return other ? [{ id: c.id, status: c.status, other }] : [];
  });
}

