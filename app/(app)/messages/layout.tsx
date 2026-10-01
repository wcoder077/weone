import { MessagesShell } from "@/components/messages/messages-shell";
import { requireUserId } from "@/lib/auth";
import { getConversations } from "@/lib/queries/messages";

export default async function MessagesLayout({ children }: LayoutProps<"/messages">) {
  const userId = await requireUserId();
  const conversations = await getConversations(userId);
  return <MessagesShell conversations={conversations}>{children}</MessagesShell>;
}
