import { FolderKanban } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata = { title: "Loyihalar" };

export default function ProjectsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold lg:text-[32px]">Loyihalar</h1>
      <EmptyState
        icon={FolderKanban}
        title="Hozircha bo'sh"
        description="Qo'shilish yoki boshlash mumkin bo'lgan loyihalar shu yerda paydo bo'ladi."
        action={{ label: "Odamlarni topish", href: "/find" }}
      />
    </div>
  );
}
