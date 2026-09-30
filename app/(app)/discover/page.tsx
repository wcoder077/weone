import { Compass } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata = { title: "Kashf" };

export default function DiscoverPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold lg:text-[32px]">Kashf</h1>
      <EmptyState
        icon={Compass}
        title="Hozircha bo'sh"
        description="Odamlar va loyihalarni ko'nikma, shahar yoki rol bo'yicha qidiring."
        action={{ label: "Odamlarni topish", href: "/find" }}
      />
    </div>
  );
}
