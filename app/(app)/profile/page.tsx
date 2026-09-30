import { User } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata = { title: "Profil" };

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold lg:text-[32px]">Profil</h1>
      <EmptyState
        icon={User}
        title="Hozircha bo'sh"
        description="Onboardingni tugatganingizdan so'ng profilingiz shu yerda ko'rinadi."
        action={{ label: "Odamlarni kashf qilish", href: "/discover" }}
      />
    </div>
  );
}
