import { SearchX } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { EmptyState } from "@/components/shared/empty-state";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center gap-6 px-4">
      <Logo />
      <EmptyState
        icon={SearchX}
        title="Sahifa topilmadi"
        description="Bu sahifa mavjud emas yoki ko'chirilgan."
        action={{ label: "Bosh sahifaga o'tish", href: "/" }}
        className="w-full"
      />
    </main>
  );
}
