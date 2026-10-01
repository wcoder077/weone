"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { requireSupabaseEnv } from "@/lib/supabase/env";
import { joinRequestSchema, projectSchema, slugify, type RoleInput } from "@/lib/validation/project";
import { fieldErrorsOf, type ActionState } from "./types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const SAVE_FAILED = "Saqlab bo'lmadi. Qayta urinib ko'ring.";
const idSchema = z.guid();

function parseProjectForm(formData: FormData) {
  let roles: unknown = [];
  try {
    roles = JSON.parse(String(formData.get("roles") ?? "[]"));
  } catch {
    roles = null;
  }
  return projectSchema.safeParse({
    name: formData.get("name"),
    tagline: formData.get("tagline") ?? "",
    description: formData.get("description") ?? "",
    category: formData.get("category") ?? "",
    status: formData.get("status"),
    city: formData.get("city") ?? "",
    is_online: formData.get("is_online") === "on",
    github_url: formData.get("github_url") ?? "",
    demo_url: formData.get("demo_url") ?? "",
    logo_url: formData.get("logo_url") ?? "",
    skill_ids: formData.getAll("skill_ids"),
    roles,
  });
}

async function syncStack(supabase: Supabase, projectId: string, wanted: string[]) {
  const { data: current, error } = await supabase
    .from("project_skills")
    .select("skill_id")
    .eq("project_id", projectId);
  if (error) return error;

  const have = new Set(current.map((r) => r.skill_id));
  const toAdd = wanted.filter((id) => !have.has(id));
  const toRemove = [...have].filter((id) => !wanted.includes(id));
  if (toAdd.length) {
    const { error: e } = await supabase
      .from("project_skills")
      .insert(toAdd.map((skill_id) => ({ project_id: projectId, skill_id })));
    if (e) return e;
  }
  if (toRemove.length) {
    const { error: e } = await supabase
      .from("project_skills")
      .delete()
      .eq("project_id", projectId)
      .in("skill_id", toRemove);
    if (e) return e;
  }
  return null;
}

// Roles with an id are updated, new ones inserted, missing ones deleted.
async function syncRoles(supabase: Supabase, projectId: string, roles: RoleInput[]) {
  const { data: existing, error } = await supabase.from("project_roles").select("id").eq("project_id", projectId);
  if (error) return error;

  const keepIds = new Set(roles.flatMap((r) => (r.id ? [r.id] : [])));
  const removeIds = existing.map((r) => r.id).filter((id) => !keepIds.has(id));
  if (removeIds.length) {
    const { error: e } = await supabase.from("project_roles").delete().in("id", removeIds);
    if (e) return e;
  }

  for (const role of roles) {
    const fields = { title: role.title, is_open: role.is_open };
    const { data: saved, error: e } = role.id
      ? await supabase.from("project_roles").update(fields).eq("id", role.id).eq("project_id", projectId).select("id").single()
      : await supabase.from("project_roles").insert({ ...fields, project_id: projectId }).select("id").single();
    if (e) return e;

    const { error: clearError } = await supabase.from("project_role_skills").delete().eq("project_role_id", saved.id);
    if (clearError) return clearError;
    if (role.skill_ids.length) {
      const { error: insertError } = await supabase
        .from("project_role_skills")
        .insert(role.skill_ids.map((skill_id) => ({ project_role_id: saved.id, skill_id })));
      if (insertError) return insertError;
    }
  }
  return null;
}

function isOwnLogo(url: string, projectId: string) {
  const { url: base } = requireSupabaseEnv();
  return url.startsWith(`${base}/storage/v1/object/public/project-logos/${projectId}/`);
}

export async function createProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = parseProjectForm(formData);
  if (!parsed.success) return fieldErrorsOf(parsed.error);

  const { skill_ids, roles, ...fields } = parsed.data;
  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      ...fields,
      logo_url: null, // Logos need the project id for their folder; uploaded on edit.
      owner_id: userId,
      slug: slugify(fields.name),
      is_looking: roles.some((r) => r.is_open),
    })
    .select("id, slug")
    .single();
  if (error) return { error: SAVE_FAILED };

  const linkError = (await syncStack(supabase, project.id, skill_ids)) ?? (await syncRoles(supabase, project.id, roles));
  if (linkError) return { error: SAVE_FAILED };

  redirect(`/projects/${project.slug}`);
}

export async function updateProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const projectId = idSchema.safeParse(formData.get("project_id"));
  if (!projectId.success) return { error: SAVE_FAILED };
  const parsed = parseProjectForm(formData);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  if (parsed.data.logo_url && !isOwnLogo(parsed.data.logo_url, projectId.data)) {
    return { fieldErrors: { logo_url: ["Logoni qayta yuklang"] } };
  }

  const { skill_ids, roles, ...fields } = parsed.data;
  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("projects")
    .update({ ...fields, is_looking: roles.some((r) => r.is_open) })
    .eq("id", projectId.data)
    .eq("owner_id", userId)
    .select("id, slug")
    .single();
  if (error) return { error: SAVE_FAILED };

  const linkError = (await syncStack(supabase, project.id, skill_ids)) ?? (await syncRoles(supabase, project.id, roles));
  if (linkError) return { error: SAVE_FAILED };

  redirect(`/projects/${project.slug}`);
}

export async function deleteProject(projectId: string): Promise<ActionState> {
  const userId = await requireUserId();
  if (!idSchema.safeParse(projectId).success) return { error: SAVE_FAILED };

  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").delete().eq("id", projectId).eq("owner_id", userId).select("id");
  if (error || data.length === 0) return { error: "O'chirib bo'lmadi." };

  refresh();
  return { message: "Loyiha o'chirildi" };
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

export async function requestToJoin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = joinRequestSchema.safeParse({
    project_id: formData.get("project_id"),
    project_role_id: formData.get("project_role_id") ?? "",
    message: formData.get("message") ?? "",
  });
  if (!parsed.success) return fieldErrorsOf(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from("join_requests").insert({ ...parsed.data, user_id: userId });
  if (error?.code === "23505") return { error: "Sizda bu loyihaga ochiq so'rov bor." };
  if (error) return { error: "So'rovni yuborib bo'lmadi." };

  refresh();
  return { message: "So'rov yuborildi" };
}

export async function cancelJoinRequest(requestId: string): Promise<ActionState> {
  const userId = await requireUserId();
  if (!idSchema.safeParse(requestId).success) return { error: SAVE_FAILED };

  const supabase = await createClient();
  const { error } = await supabase.from("join_requests").delete().eq("id", requestId).eq("user_id", userId);
  if (error) return { error: "Bekor qilib bo'lmadi." };

  refresh();
  return { message: "So'rov bekor qilindi" };
}

// Accepting adds the member through a database trigger.
export async function decideJoinRequest(requestId: string, accept: boolean): Promise<ActionState> {
  await requireUserId();
  if (!idSchema.safeParse(requestId).success) return { error: SAVE_FAILED };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("join_requests")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("id");
  if (error || data.length === 0) return { error: SAVE_FAILED };

  refresh();
  return { message: accept ? "Jamoaga qo'shildi" : "Rad etildi" };
}

export async function removeMember(projectId: string, memberId: string): Promise<ActionState> {
  await requireUserId();
  if (!idSchema.safeParse(projectId).success || !idSchema.safeParse(memberId).success) {
    return { error: SAVE_FAILED };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", memberId)
    .select("user_id");
  if (error || data.length === 0) return { error: "Olib tashlab bo'lmadi." };

  refresh();
  return { message: "Jamoadan chiqarildi" };
}

export async function setRoleOpen(roleId: string, isOpen: boolean): Promise<ActionState> {
  await requireUserId();
  if (!idSchema.safeParse(roleId).success) return { error: SAVE_FAILED };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_roles")
    .update({ is_open: isOpen })
    .eq("id", roleId)
    .select("project_id")
    .single();
  if (error) return { error: SAVE_FAILED };

  // Keep the "looking for members" flag in step with open roles.
  const { count } = await supabase
    .from("project_roles")
    .select("id", { count: "exact", head: true })
    .eq("project_id", data.project_id)
    .eq("is_open", true);
  await supabase.from("projects").update({ is_looking: (count ?? 0) > 0 }).eq("id", data.project_id);

  refresh();
  return { message: isOpen ? "Rol ochildi" : "Rol yopildi" };
}
