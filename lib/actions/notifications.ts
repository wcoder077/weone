"use server";

import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationsRead(): Promise<void> {
  const userId = await requireUserId();
  const supabase = await createClient();
  await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
}
