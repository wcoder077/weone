"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { isAdminPath } from "@/lib/admin/config";
import { closeGate, hasValidGate, openGate } from "@/lib/admin/gate";
import { verifyTurnstile } from "@/lib/admin/turnstile";
import { getUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "./types";

const DENIED = "Ruxsat yo'q.";

// Every admin action starts here: the secret path, a signed-in admin and (except for the captcha
// step itself) a valid gate cookie. Anything else is refused, and the database checks admin rights again.
async function authorize(adminPath: string, needGate: boolean) {
  if (!isAdminPath(adminPath)) return null;
  const userId = await getUserId();
  if (!userId) return null;
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return null;
  if (needGate && !(await hasValidGate(userId, adminPath))) return null;
  return { supabase, userId };
}

// Captcha step: solved captcha + honeypot untouched -> the gate opens for 30 minutes.
export async function unlockAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  // Honeypot: people never see this field; a bot fills it.
  if (String(formData.get("website") ?? "").trim() !== "") return { error: DENIED };

  const adminPath = String(formData.get("adminPath") ?? "");
  const session = await authorize(adminPath, false);
  if (!session) return { error: DENIED };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const passed = await verifyTurnstile(String(formData.get("cf-turnstile-response") ?? ""), ip);
  if (!passed) return { error: "Captcha tekshiruvidan o'tmadi. Qayta urinib ko'ring." };

  if (!(await openGate(session.userId, adminPath))) return { error: "Admin paneli sozlanmagan." };
  refresh();
  return { message: "ok" };
}

export async function lockAdmin(adminPath: string) {
  if (!isAdminPath(adminPath)) return;
  await closeGate(adminPath);
  refresh();
}

export async function setTicketStatus(adminPath: string, ticketId: string, status: "open" | "resolved"): Promise<ActionState> {
  const ids = z.object({ ticketId: z.guid(), status: z.enum(["open", "resolved"]) }).safeParse({ ticketId, status });
  const session = await authorize(adminPath, true);
  if (!ids.success || !session) return { error: DENIED };

  const { error } = await session.supabase.from("support_tickets").update({ status: ids.data.status }).eq("id", ids.data.ticketId);
  if (error) return { error: "Saqlab bo'lmadi. Qayta urinib ko'ring." };
  refresh();
  return { message: "ok" };
}
