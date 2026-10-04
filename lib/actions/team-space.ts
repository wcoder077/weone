"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { teamSpacePatchSchema } from "@/lib/team-space";
import { writeTeamSpace } from "@/lib/team-space-write";
import type { ActionState } from "./types";

const FAILED = "Saqlab bo'lmadi. Qayta urinib ko'ring.";
const NOT_FOUNDER = "Faqat asoschi tahrirlay oladi.";

// Only the founder writes the team space. The check is done here and again by the database (RLS).
// A key that is missing from the patch is left as it is; an empty value clears it.
export async function saveTeamSpace(projectId: string, patch: unknown): Promise<ActionState> {
  const userId = await requireUserId();
  if (!z.guid().safeParse(projectId).success) return { error: FAILED };
  const parsed = teamSpacePatchSchema.safeParse(patch);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? FAILED };

  const supabase = await createClient();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", projectId)
    .maybeSingle();
  if (projectError) return { error: FAILED };
  if (!project || project.owner_id !== userId) return { error: NOT_FOUNDER };

  const { chatUrl, pinnedNotice, nextMeetingAt, meetingUrl } = parsed.data;
  const columns = {
    ...(chatUrl !== undefined && { chat_url: chatUrl }),
    ...(pinnedNotice !== undefined && { pinned_notice: pinnedNotice }),
    ...(nextMeetingAt !== undefined && { next_meeting_at: nextMeetingAt }),
    ...(meetingUrl !== undefined && { meeting_url: meetingUrl }),
  };
  if (Object.keys(columns).length === 0) return { message: "Saqlandi" };

  if (await writeTeamSpace(supabase, projectId, columns)) return { error: FAILED };

  refresh();
  return { message: "Saqlandi" };
}
