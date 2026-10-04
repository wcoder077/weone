import { createClient } from "@/lib/supabase/server";

export type MyTicket = { id: string; message: string; status: "open" | "resolved"; createdAt: string };

// The viewer's own latest tickets (RLS hides everyone else's).
export async function getMyTickets(userId: string): Promise<MyTicket[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, message, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    message: row.message,
    status: row.status === "resolved" ? "resolved" : "open",
    createdAt: row.created_at,
  }));
}
