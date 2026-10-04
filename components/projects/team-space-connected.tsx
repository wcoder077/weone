"use client";

import { saveTeamSpace } from "@/lib/actions/team-space";
import type { TeamSpace as TeamSpaceData, ViewerRole } from "@/lib/team-space";
import { TeamSpace } from "./team-space";

// The only place that knows about the backend: it turns the save action into the plain
// `onSave` the block expects (a rejected promise carries the error message).
export function ConnectedTeamSpace({
  projectId,
  space,
  viewerRole,
}: {
  projectId: string;
  space: TeamSpaceData | null;
  viewerRole: ViewerRole;
}) {
  const onSave =
    viewerRole === "founder"
      ? async (patch: Partial<TeamSpaceData>) => {
          const result = await saveTeamSpace(projectId, patch);
          if (result?.error) throw new Error(result.error);
        }
      : undefined;
  return <TeamSpace space={space} viewerRole={viewerRole} onSave={onSave} />;
}
