import { SearchX } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { EmptyState } from "@/components/shared/empty-state";
import { getT } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getT();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center gap-6 px-4">
      <Logo />
      <EmptyState
        icon={SearchX}
        title={t("Sahifa topilmadi")}
        description={t("Bu sahifa mavjud emas yoki ko'chirilgan.")}
        action={{ label: "Bosh sahifaga o'tish", href: "/" }}
        className="w-full"
      />
    </main>
  );
}
