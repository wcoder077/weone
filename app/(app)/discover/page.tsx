import { Compass } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata = { title: "Discover" };

export default function DiscoverPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold lg:text-[32px]">Discover</h1>
      <EmptyState
        icon={Compass}
        title="Nothing here yet"
        description="Search people and projects by skill, city or role."
        action={{ label: "Find people", href: "/find" }}
      />
    </div>
  );
}
