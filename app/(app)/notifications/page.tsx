import { Suspense } from "react";
import { Bell } from "lucide-react";
import { MarkNotificationsRead } from "@/components/notifications/mark-read";
import { NotificationRow } from "@/components/notifications/notification-row";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkTabs } from "@/components/shared/link-tabs";
import { ListRowSkeleton } from "@/components/shared/skeletons";
import { requireUserId } from "@/lib/auth";
import { getNotifications } from "@/lib/queries/notifications";
import { single } from "@/lib/url";

export const metadata = { title: "Bildirishnomalar" };

export default async function NotificationsPage({ searchParams }: PageProps<"/notifications">) {
  const tab = single((await searchParams).tab) === "requests" ? "requests" : "all";

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
      <h1 className="text-2xl font-bold lg:text-[32px]">Bildirishnomalar</h1>
      <LinkTabs
        label="Bildirishnoma turlari"
        active={tab}
        tabs={[
          { value: "all", label: "Hammasi", href: "/notifications" },
          { value: "requests", label: "So'rovlar", href: "/notifications?tab=requests" },
        ]}
      />
      <Suspense key={tab} fallback={<ListSkeleton />}>
        <NotificationList onlyRequests={tab === "requests"} />
      </Suspense>
      <MarkNotificationsRead />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div role="status" aria-label="Yuklanmoqda" className="flex flex-col gap-2">
      {Array.from({ length: 6 }, (_, i) => (
        <ListRowSkeleton key={i} />
      ))}
    </div>
  );
}

async function NotificationList({ onlyRequests }: { onlyRequests: boolean }) {
  const userId = await requireUserId();
  const notifications = await getNotifications(userId, onlyRequests);

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title={onlyRequests ? "So'rovlar yo'q" : "Hozircha bildirishnoma yo'q"}
        description="Bog'lanish va loyiha so'rovlari shu yerda ko'rinadi."
      />
    );
  }

  return (
    <ul className="bg-card border-border rounded-card flex flex-col gap-1 border p-2">
      {notifications.map((n) => (
        <NotificationRow key={n.id} notification={n} />
      ))}
    </ul>
  );
}
