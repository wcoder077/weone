import { House } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata = { title: "Home" };

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold lg:text-[32px]">Home</h1>
      <EmptyState
        icon={House}
        title="Nothing here yet"
        description="Your feed of people and projects will appear here."
        action={{ label: "Find people", href: "/find" }}
      />
    </div>
  );
}
