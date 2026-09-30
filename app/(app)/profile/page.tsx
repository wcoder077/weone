import { User } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold lg:text-[32px]">Profile</h1>
      <EmptyState
        icon={User}
        title="Nothing here yet"
        description="Your profile will appear here once you finish onboarding."
        action={{ label: "Discover people", href: "/discover" }}
      />
    </div>
  );
}
