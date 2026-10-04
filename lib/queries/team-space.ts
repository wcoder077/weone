import { createClient } from "@/lib/supabase/server";
import type { TeamSpace } from "@/lib/team-space";

// The team space of a project. The database returns a row only to the project's members
// (and its founder), so for everyone else this is null and nothing reaches the browser.
export async function getTeamSpace(projectId: string): Promise<TeamSpace | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_team_space")
    .select("chat_url, pinned_notice, pinned_notice_updated_at, next_meeting_at, meeting_url")
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    chatUrl: data.chat_url,
    pinnedNotice: data.pinned_notice,
    pinnedNoticeUpdatedAt: data.pinned_notice_updated_at,
    nextMeetingAt: data.next_meeting_at,
    meetingUrl: data.meeting_url,
  };
}
