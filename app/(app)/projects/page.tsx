import { FolderKanban } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold lg:text-[32px]">Projects</h1>
      <EmptyState
        icon={FolderKanban}
        title="Nothing here yet"
        description="Projects you can join or start will appear here."
        action={{ label: "Find people", href: "/find" }}
      />
    </div>
  );
}
