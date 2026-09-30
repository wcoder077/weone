import { House } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata = { title: "Asosiy" };

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold lg:text-[32px]">Asosiy</h1>
      <EmptyState
        icon={House}
        title="Hozircha bo'sh"
        description="Siz uchun odamlar va loyihalar shu yerda paydo bo'ladi."
        action={{ label: "Odamlarni topish", href: "/find" }}
      />
    </div>
  );
}
