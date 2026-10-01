import { MessageCircle } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata = { title: "Xabarlar" };

// Desktop placeholder next to the list; on mobile the list itself is the page.
export default function MessagesPage() {
  return (
    <EmptyState
      icon={MessageCircle}
      title="Suhbatni tanlang"
      description="Yozishuv faqat bog'langan maqsaddoshlar bilan ochiladi."
      className="h-full justify-center"
    />
  );
}
