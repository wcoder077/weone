import { signedUrls } from "@/lib/signed-urls";
import { createClient } from "@/lib/supabase/server";

export type AdminTicket = {
  id: string;
  message: string;
  status: "open" | "resolved";
  createdAt: string;
  handledAt: string | null;
  imageUrl: string | null;
  user: { id: string; username: string; fullName: string; avatarUrl: string | null } | null;
};

export type TicketFilter = "open" | "resolved" | "all";
const PAGE = 50;

// Admins only: RLS lets a non-admin see nothing here.
export async function getTickets(filter: TicketFilter) {
  const supabase = await createClient();
  let query = supabase
    .from("support_tickets")
    .select(
      "id, message, status, created_at, handled_at, image_path, user:profiles!support_tickets_user_id_fkey(id, username, full_name, avatar_url)",
    )
    .order("created_at", { ascending: false })
    .limit(PAGE);
  if (filter !== "all") query = query.eq("status", filter);

  const [{ data, error }, openCount] = await Promise.all([
    query,
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);
  if (error) throw error;

  const paths = data.flatMap((row) => (row.image_path ? [row.image_path] : []));
  const urls = paths.length ? await signedUrls(supabase, "support-images", paths) : new Map<string, string>();

  const tickets: AdminTicket[] = data.map((row) => ({
    id: row.id,
    message: row.message,
    status: row.status === "resolved" ? "resolved" : "open",
    createdAt: row.created_at,
    handledAt: row.handled_at,
    imageUrl: row.image_path ? (urls.get(row.image_path) ?? null) : null,
    user: row.user
      ? { id: row.user.id, username: row.user.username, fullName: row.user.full_name, avatarUrl: row.user.avatar_url }
      : null,
  }));
  return { tickets, openCount: openCount.count ?? 0, pageSize: PAGE };
}
