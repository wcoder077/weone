import { notFound } from "next/navigation";
import { z } from "zod";
import { ChatView } from "@/components/messages/chat-view";
import { requireUserId } from "@/lib/auth";
import { getConversation } from "@/lib/queries/messages";
import { getMyProjectOptions } from "@/lib/queries/social";

export const metadata = { title: "Suhbat" };

export default async function ConversationPage({ params }: PageProps<"/messages/[id]">) {
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();

  const userId = await requireUserId();
  const [conversation, myProjects] = await Promise.all([getConversation(id, userId), getMyProjectOptions(userId)]);
  if (!conversation) notFound();

  return (
    <ChatView
      key={id}
      conversationId={id}
      meId={userId}
      other={conversation.other}
      initialMessages={conversation.messages}
      otherReadAt={conversation.otherReadAt}
      myProjects={myProjects}
      myProjectIds={myProjects.map((p) => p.id)}
      connection={conversation.connection}
    />
  );
}
