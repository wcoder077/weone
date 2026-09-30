import { MessageCircle } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata = { title: "Xabarlar" };

export default function MessagesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold lg:text-[32px]">Xabarlar</h1>
      <EmptyState
        icon={MessageCircle}
        title="Hozircha bo'sh"
        description="Aloqalaringiz bilan suhbatlar shu yerda paydo bo'ladi."
        action={{ label: "Odamlarni kashf qilish", href: "/discover" }}
      />
    </div>
  );
}
