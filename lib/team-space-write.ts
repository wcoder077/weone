import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type TeamSpaceColumns = {
  chat_url?: string | null;
  pinned_notice?: string | null;
  next_meeting_at?: string | null;
  meeting_url?: string | null;
};

// Updates the team space row of a project, or creates it the first time. (Not an upsert: its
// ON CONFLICT clause would also rewrite project_id, which nobody may change.)
// Returns the database error, if any. RLS lets only the project's founder do this.
export async function writeTeamSpace(supabase: Supabase, projectId: string, columns: TeamSpaceColumns) {
  const { data, error } = await supabase
    .from("project_team_space")
    .update(columns)
    .eq("project_id", projectId)
    .select("project_id");
  if (error) return error;
  // Nothing to store and no row yet: leave it that way.
  if (data.length > 0 || Object.values(columns).every((value) => value == null)) return null;

  const { error: insertError } = await supabase.from("project_team_space").insert({ project_id: projectId, ...columns });
  return insertError;
}
