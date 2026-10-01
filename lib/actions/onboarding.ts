"use server";

import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { ONBOARDING_SKILLS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { requireSupabaseEnv } from "@/lib/supabase/env";
import {
  aboutSchema,
  lookingForSchema,
  skillPickSchema,
  usernameSchema,
} from "@/lib/validation/profile";
import { fieldErrorsOf, type ActionState } from "./types";

const UNIQUE_VIOLATION = "23505";
const USERNAME_TAKEN = "Bu username band. Boshqasini tanlang.";

export type UsernameStatus = "available" | "taken" | "invalid";

export async function checkUsername(value: string): Promise<UsernameStatus> {
  const userId = await requireUserId();
  const parsed = usernameSchema.safeParse(value);
  if (!parsed.success) return "invalid";

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", parsed.data)
    .neq("id", userId)
    .maybeSingle();
  return data ? "taken" : "available";
}

// Avatars must be the user's own upload in our storage bucket.
function isOwnAvatar(url: string, userId: string) {
  const { url: base } = requireSupabaseEnv();
  return url.startsWith(`${base}/storage/v1/object/public/avatars/${userId}/`);
}

export async function saveAbout(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = aboutSchema.safeParse({
    full_name: formData.get("full_name"),
    username: formData.get("username"),
    city: formData.get("city") ?? "",
    headline: formData.get("headline") ?? "",
    avatar_url: formData.get("avatar_url") ?? "",
  });
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  if (parsed.data.avatar_url && !isOwnAvatar(parsed.data.avatar_url, userId)) {
    return { fieldErrors: { avatar_url: ["Rasmni qayta yuklang"] } };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", userId);
  if (error?.code === UNIQUE_VIOLATION) return { fieldErrors: { username: [USERNAME_TAKEN] } };
  if (error) return { error: "Saqlab bo'lmadi. Qayta urinib ko'ring." };

  redirect("/onboarding?step=2");
}

export async function saveSkills(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("skills") ?? "[]"));
  } catch {
    return { error: "Ko'nikmalarni qayta tanlang." };
  }
  const parsed = skillPickSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const keep = parsed.data.map((s) => s.skill_id);
  const { error: deleteError } = await supabase
    .from("user_skills")
    .delete()
    .eq("user_id", userId)
    .not("skill_id", "in", `(${keep.join(",")})`);
  const { error: upsertError } = await supabase
    .from("user_skills")
    .upsert(parsed.data.map((s) => ({ ...s, user_id: userId })));
  if (deleteError || upsertError) return { error: "Saqlab bo'lmadi. Qayta urinib ko'ring." };

  redirect("/onboarding?step=3");
}

export async function finishOnboarding(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = lookingForSchema.safeParse({
    looking_for: formData.getAll("looking_for"),
    is_online_ok: formData.get("is_online_ok") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { count } = await supabase
    .from("user_skills")
    .select("skill_id", { count: "exact", head: true })
    .eq("user_id", userId);
  if ((count ?? 0) < ONBOARDING_SKILLS.min) {
    return { error: `Avval kamida ${ONBOARDING_SKILLS.min} ta ko'nikma tanlang (2-qadam).` };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ ...parsed.data, onboarded: true })
    .eq("id", userId);
  if (error) return { error: "Saqlab bo'lmadi. Qayta urinib ko'ring." };

  redirect("/home");
}
