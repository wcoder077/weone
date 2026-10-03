"use server";

import { z } from "zod";
import { LANGS } from "@/lib/i18n/core";
import { isPushEndpoint } from "@/lib/push/endpoint";
import { createClient } from "@/lib/supabase/server";

const subscriptionSchema = z.object({
  endpoint: z.string().refine(isPushEndpoint),
  p256dh: z.string().min(1).max(200),
  auth: z.string().min(1).max(100),
  lang: z.enum(LANGS),
});

export type PushResult = { ok: true } | { ok: false; error: string };

async function currentUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, userId: data.user?.id ?? null };
}

export async function savePushSubscription(input: z.input<typeof subscriptionSchema>): Promise<PushResult> {
  const { supabase, userId } = await currentUserId();
  if (!userId) return { ok: false, error: "Avval tizimga kiring." };
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Bu qurilmada bildirishnomalarni yoqib bo'lmadi." };

  const { error } = await supabase.rpc("save_push_subscription", {
    p_endpoint: parsed.data.endpoint,
    p_p256dh: parsed.data.p256dh,
    p_auth: parsed.data.auth,
    p_lang: parsed.data.lang,
  });
  if (error) return { ok: false, error: "Bildirishnomalarni yoqib bo'lmadi. Keyinroq urinib ko'ring." };
  return { ok: true };
}

export async function removePushSubscription(endpoint: string): Promise<PushResult> {
  const { supabase, userId } = await currentUserId();
  if (!userId) return { ok: false, error: "Avval tizimga kiring." };
  const parsed = z.string().max(1000).safeParse(endpoint);
  if (!parsed.success) return { ok: false, error: "Bildirishnomalarni o'chirib bo'lmadi." };

  const { error } = await supabase.from("push_subscriptions").delete().eq("user_id", userId).eq("endpoint", parsed.data);
  if (error) return { ok: false, error: "Bildirishnomalarni o'chirib bo'lmadi." };
  return { ok: true };
}

export async function sendTestPush(): Promise<PushResult> {
  const { supabase, userId } = await currentUserId();
  if (!userId) return { ok: false, error: "Avval tizimga kiring." };
  const { error } = await supabase.rpc("send_test_push");
  if (error) return { ok: false, error: "Sinov bildirishnomasini yuborib bo'lmadi." };
  return { ok: true };
}
