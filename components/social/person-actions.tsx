import { getMyProjectOptions, getRelationships } from "@/lib/queries/social";
import { CollaborateDialog } from "./collaborate-dialog";
import { ConnectButton } from "./connect-button";
import { MessageButton } from "./message-button";

// Connect + Message/Collaborate for another user, from the viewer's point of view.
export async function PersonActions({
  viewerId,
  userId,
  name,
  stretch = false,
}: {
  viewerId: string;
  userId: string;
  name: string;
  stretch?: boolean;
}) {
  const [relationships, projects] = await Promise.all([getRelationships(viewerId), getMyProjectOptions(viewerId)]);
  const grow = stretch ? "flex-1" : undefined;

  return (
    <>
      <ConnectButton userId={userId} connection={relationships.connection(userId)} className={grow} />
      {relationships.canMessage(userId) ? (
        <MessageButton userId={userId} className={grow} />
      ) : (
        <CollaborateDialog
          userId={userId}
          name={name}
          projects={projects}
          alreadySent={relationships.collabPending(userId)}
          className={grow}
        />
      )}
    </>
  );
}
