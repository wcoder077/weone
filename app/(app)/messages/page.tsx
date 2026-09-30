import { MessageCircle } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata = { title: "Messages" };

export default function MessagesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold lg:text-[32px]">Messages</h1>
      <EmptyState
        icon={MessageCircle}
        title="Nothing here yet"
        description="Conversations with your connections will appear here."
        action={{ label: "Discover people", href: "/discover" }}
      />
    </div>
  );
}
