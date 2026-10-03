"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { insertError } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { supportMessageSchema } from "@/lib/validation/support";
import { fieldErrorsOf, type ActionState } from "./types";

const FAILED = "Yuborib bo'lmadi. Qayta urinib ko'ring.";
const LIMIT_TEXT = "Murojaatlar limiti tugadi. Birozdan keyin qayta urinib ko'ring.";

// The screenshot is already in the sender's folder of the private bucket (uploaded by the browser);
// the database re-checks the path shape and the owner.
export async function submitSupportTicket(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();

  // Honeypot: a hidden field that people never fill. A bot does; pretend it worked and store nothing.
  if (String(formData.get("website") ?? "").trim() !== "") return { message: "Murojaatingiz yuborildi." };

  const message = supportMessageSchema.safeParse(formData.get("message"));
  if (!message.success) return fieldErrorsOf(message.error);

  const rawPath = String(formData.get("imagePath") ?? "");
  const imagePath = rawPath
    ? z.string().regex(new RegExp(`^${userId}/[0-9a-f-]{36}\\.(jpg|png|webp)$`)).safeParse(rawPath)
    : null;
  if (imagePath && !imagePath.success) return { error: FAILED };

  const supabase = await createClient();
  const { error } = await supabase
    .from("support_tickets")
    .insert({ message: message.data, image_path: imagePath?.success ? imagePath.data : null });
  if (error) return { error: insertError(error, FAILED, LIMIT_TEXT) };

  refresh();
  return { message: "Murojaatingiz yuborildi." };
}
