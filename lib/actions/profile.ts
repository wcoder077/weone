"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { SKILL_LEVEL_VALUES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { requireSupabaseEnv } from "@/lib/supabase/env";
import {
  addSkillSchema,
  educationSchema,
  journeySchema,
  settingsSchema,
} from "@/lib/validation/profile";
import { fieldErrorsOf, type ActionState } from "./types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const SAVE_FAILED = "Saqlab bo'lmadi. Qayta urinib ko'ring.";
const SAVED: ActionState = { message: "Saqlandi" };
const idSchema = z.guid();

// Makes the item's skill rows exactly match `wanted`.
async function syncJourneyItemSkills(supabase: Supabase, itemId: string, wanted: string[]) {
  const { data: current, error } = await supabase
    .from("journey_item_skills")
    .select("skill_id")
    .eq("journey_item_id", itemId);
  if (error) return error;

  const have = new Set(current.map((r) => r.skill_id));
  const toAdd = wanted.filter((id) => !have.has(id));
  const toRemove = [...have].filter((id) => !wanted.includes(id));

  if (toAdd.length) {
    const { error: insertError } = await supabase
      .from("journey_item_skills")
      .insert(toAdd.map((skill_id) => ({ journey_item_id: itemId, skill_id })));
    if (insertError) return insertError;
  }
  if (toRemove.length) {
    const { error: deleteError } = await supabase
      .from("journey_item_skills")
      .delete()
      .eq("journey_item_id", itemId)
      .in("skill_id", toRemove);
    if (deleteError) return deleteError;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Journey
// ---------------------------------------------------------------------------

export async function saveJourneyItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = journeySchema.safeParse({
    id: formData.get("id") ?? "",
    type: formData.get("type"),
    title: formData.get("title"),
    organization: formData.get("organization") ?? "",
    role: formData.get("role") ?? "",
    result: formData.get("result") ?? "",
    description: formData.get("description") ?? "",
    start_date: formData.get("start_date") ?? "",
    end_date: formData.get("end_date") ?? "",
    skill_ids: formData.getAll("skill_ids"),
  });
  if (!parsed.success) return fieldErrorsOf(parsed.error);

  const { id, skill_ids, ...fields } = parsed.data;
  const supabase = await createClient();

  const { data: item, error } = id
    ? await supabase
        .from("journey_items")
        .update(fields)
        .eq("id", id)
        .eq("user_id", userId)
        .select("id")
        .single()
    : await supabase
        .from("journey_items")
        .insert({ ...fields, user_id: userId })
        .select("id")
        .single();
  if (error) return { error: SAVE_FAILED };

  const linkError = await syncJourneyItemSkills(supabase, item.id, skill_ids);
  if (linkError) return { error: SAVE_FAILED };

  refresh();
  return SAVED;
}

export async function deleteJourneyItem(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  if (!idSchema.safeParse(id).success) return { error: SAVE_FAILED };

  const supabase = await createClient();
  const { error } = await supabase.from("journey_items").delete().eq("id", id).eq("user_id", userId);
  if (error) return { error: "O'chirib bo'lmadi." };

  refresh();
  return { message: "O'chirildi" };
}

export async function confirmJourneyItem(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  if (!idSchema.safeParse(id).success) return { error: SAVE_FAILED };

  const supabase = await createClient();
  const { error } = await supabase
    .from("journey_confirmations")
    .insert({ journey_item_id: id, confirmer_id: userId });
  // RLS rejects confirmations without a matching event of your own.
  if (error) return { error: "Tasdiqlash uchun sizda ham shu tadbir bo'lishi kerak." };

  refresh();
  return { message: "Tasdiqlandi" };
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

async function resolveSkillId(supabase: Supabase, skillId: string | null, newName: string) {
  if (skillId) return skillId;

  const { data: existing } = await supabase.from("skills").select("id").eq("name", newName).maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("skills")
    .insert({ name: newName, category: "Other" })
    .select("id")
    .single();
  return error ? null : created.id;
}

// Adds or updates a skill and sets where it was used. Only projects the user owns
// can have their stack changed; links on other projects are left alone.
export async function saveSkill(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = addSkillSchema.safeParse({
    skill_id: formData.get("skill_id") ?? "",
    new_skill_name: formData.get("new_skill_name") ?? "",
    level: formData.get("level"),
    project_ids: formData.getAll("project_ids"),
    journey_ids: formData.getAll("journey_ids"),
  });
  if (!parsed.success) return fieldErrorsOf(parsed.error);

  const supabase = await createClient();
  const skillId = await resolveSkillId(supabase, parsed.data.skill_id, parsed.data.new_skill_name);
  if (!skillId) return { error: SAVE_FAILED };

  const { error } = await supabase
    .from("user_skills")
    .upsert({ user_id: userId, skill_id: skillId, level: parsed.data.level });
  if (error) return { error: SAVE_FAILED };

  const [{ data: ownedProjects }, { data: myItems }] = await Promise.all([
    supabase.from("projects").select("id, project_skills(skill_id)").eq("owner_id", userId),
    supabase.from("journey_items").select("id, journey_item_skills(skill_id)").eq("user_id", userId),
  ]);

  const wantedProjects = new Set(parsed.data.project_ids);
  const wantedItems = new Set(parsed.data.journey_ids);

  for (const project of ownedProjects ?? []) {
    const has = project.project_skills.some((s) => s.skill_id === skillId);
    const want = wantedProjects.has(project.id);
    if (has === want) continue;
    const { error: linkError } = want
      ? await supabase.from("project_skills").insert({ project_id: project.id, skill_id: skillId })
      : await supabase.from("project_skills").delete().eq("project_id", project.id).eq("skill_id", skillId);
    if (linkError) return { error: SAVE_FAILED };
  }

  for (const item of myItems ?? []) {
    const has = item.journey_item_skills.some((s) => s.skill_id === skillId);
    const want = wantedItems.has(item.id);
    if (has === want) continue;
    const { error: linkError } = want
      ? await supabase.from("journey_item_skills").insert({ journey_item_id: item.id, skill_id: skillId })
      : await supabase
          .from("journey_item_skills")
          .delete()
          .eq("journey_item_id", item.id)
          .eq("skill_id", skillId);
    if (linkError) return { error: SAVE_FAILED };
  }

  refresh();
  return SAVED;
}

export async function updateSkillLevel(skillId: string, level: string): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = z.object({ skillId: idSchema, level: z.enum(SKILL_LEVEL_VALUES) }).safeParse({ skillId, level });
  if (!parsed.success) return { error: SAVE_FAILED };

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_skills")
    .update({ level: parsed.data.level })
    .eq("user_id", userId)
    .eq("skill_id", parsed.data.skillId);
  if (error) return { error: SAVE_FAILED };

  refresh();
  return SAVED;
}

export async function removeSkill(skillId: string): Promise<ActionState> {
  const userId = await requireUserId();
  if (!idSchema.safeParse(skillId).success) return { error: SAVE_FAILED };

  const supabase = await createClient();
  const { error } = await supabase.from("user_skills").delete().eq("user_id", userId).eq("skill_id", skillId);
  if (error) return { error: "O'chirib bo'lmadi." };

  refresh();
  return { message: "O'chirildi" };
}

// ---------------------------------------------------------------------------
// Education
// ---------------------------------------------------------------------------

export async function addEducation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = educationSchema.safeParse({
    institution: formData.get("institution"),
    degree: formData.get("degree") ?? "",
    field: formData.get("field") ?? "",
    start_year: formData.get("start_year") ?? "",
    end_year: formData.get("end_year") ?? "",
  });
  if (!parsed.success) return fieldErrorsOf(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from("education").insert({ ...parsed.data, user_id: userId });
  if (error) return { error: SAVE_FAILED };

  refresh();
  return SAVED;
}

export async function deleteEducation(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  if (!idSchema.safeParse(id).success) return { error: SAVE_FAILED };

  const supabase = await createClient();
  const { error } = await supabase.from("education").delete().eq("id", id).eq("user_id", userId);
  if (error) return { error: "O'chirib bo'lmadi." };

  refresh();
  return { message: "O'chirildi" };
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const UNIQUE_VIOLATION = "23505";

export async function saveSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = settingsSchema.safeParse({
    full_name: formData.get("full_name"),
    username: formData.get("username"),
    city: formData.get("city") ?? "",
    headline: formData.get("headline") ?? "",
    avatar_url: formData.get("avatar_url") ?? "",
    bio: formData.get("bio") ?? "",
    languages: formData.getAll("languages"),
    interests: formData.getAll("interests"),
    looking_for: formData.getAll("looking_for"),
    is_online_ok: formData.get("is_online_ok") === "on",
    available: formData.get("available") === "on",
  });
  if (!parsed.success) return fieldErrorsOf(parsed.error);

  const { url: base } = requireSupabaseEnv();
  const avatarPrefix = `${base}/storage/v1/object/public/avatars/${userId}/`;
  if (parsed.data.avatar_url && !parsed.data.avatar_url.startsWith(avatarPrefix)) {
    return { fieldErrors: { avatar_url: ["Rasmni qayta yuklang"] } };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", userId);
  if (error?.code === UNIQUE_VIOLATION) {
    return { fieldErrors: { username: ["Bu foydalanuvchi nomi band. Boshqasini tanlang."] } };
  }
  if (error) return { error: SAVE_FAILED };

  refresh();
  return SAVED;
}
