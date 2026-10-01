import { getRelationships } from "@/lib/queries/social";
import { ConnectButton } from "./connect-button";

// The connection button for another user, from the viewer's point of view.
export async function PersonActions({
  viewerId,
  userId,
  name,
  className,
}: {
  viewerId: string;
  userId: string;
  name: string;
  className?: string;
}) {
  const relationships = await getRelationships(viewerId);
  return (
    <ConnectButton meId={viewerId} userId={userId} name={name} connection={relationships.connection(userId)} className={className} />
  );
}
