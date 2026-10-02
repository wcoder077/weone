import { MessageCircle } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Xabarlar") };
}

// Desktop placeholder next to the list; on mobile the list itself is the page.
export default async function MessagesPage() {
  const t = await getT();
  return (
    <EmptyState
      icon={MessageCircle}
      title={t("Suhbatni tanlang")}
      description={t("Yozishuv faqat bog'langan maqsaddoshlar bilan ochiladi.")}
      className="h-full justify-center"
    />
  );
}
