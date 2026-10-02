import { Suspense } from "react";
import { LoadingRegion } from "@/components/shared/loading-region";
import { Bell } from "lucide-react";
import { MarkNotificationsRead } from "@/components/notifications/mark-read";
import { NotificationRow } from "@/components/notifications/notification-row";
import { EmptyState } from "@/components/shared/empty-state";
import { RefreshIfStale } from "@/components/shared/refresh-if-stale";
import { LinkTabs } from "@/components/shared/link-tabs";
import { ListRowSkeleton } from "@/components/shared/skeletons";
import { requireUserId } from "@/lib/auth";
import { getNotifications } from "@/lib/queries/notifications";
import { single } from "@/lib/url";
import { BackLink } from "@/components/shared/back-link";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Bildirishnomalar") };
}

export default async function NotificationsPage({ searchParams }: PageProps<"/notifications">) {
  const t = await getT();
  const tab = single((await searchParams).tab) === "requests" ? "requests" : "all";

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
      <BackLink fallback="/home" />
      <h1 className="text-2xl font-bold lg:text-[32px]">{t("Bildirishnomalar")}</h1>
      <LinkTabs
        label={t("Bildirishnoma turlari")}
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
      <RefreshIfStale path="/notifications" />
    </div>
  );
}

function ListSkeleton() {
  return (
    <LoadingRegion className="flex flex-col gap-2">
      {Array.from({ length: 6 }, (_, i) => (
        <ListRowSkeleton key={i} />
      ))}
    </LoadingRegion>
  );
}

async function NotificationList({ onlyRequests }: { onlyRequests: boolean }) {
  const t = await getT();
  const userId = await requireUserId();
  const notifications = await getNotifications(userId, onlyRequests);

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title={onlyRequests ? t("So'rovlar yo'q") : t("Hozircha bildirishnoma yo'q")}
        description={t("Bog'lanish va loyiha so'rovlari shu yerda ko'rinadi.")}
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
