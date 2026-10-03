import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Inbox } from "lucide-react";
import { AdminGate } from "@/components/admin/admin-gate";
import { LockButton } from "@/components/admin/lock-button";
import { TicketStatusButton } from "@/components/admin/ticket-status-button";
import { Badge } from "@/components/shared/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ImageLightbox } from "@/components/shared/image-lightbox";
import { LinkTabs } from "@/components/shared/link-tabs";
import { RetryErrorState } from "@/components/shared/retry-error-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { isAdminPath } from "@/lib/admin/config";
import { hasValidGate } from "@/lib/admin/gate";
import { getUserId } from "@/lib/auth";
import { formatRelative } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { getTickets, type TicketFilter } from "@/lib/queries/admin";
import { createClient } from "@/lib/supabase/server";
import { single } from "@/lib/url";

// Never indexed, never linked. Anyone who is not the admin sees the ordinary 404 page.
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

const FILTERS: TicketFilter[] = ["open", "resolved", "all"];

export default async function AdminPage({ params, searchParams }: PageProps<"/[adminPath]">) {
  const { adminPath } = await params;
  if (!isAdminPath(adminPath)) notFound();
  const userId = await getUserId();
  if (!userId) notFound();
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) notFound();

  if (!(await hasValidGate(userId, adminPath))) return <AdminGate adminPath={adminPath} />;

  const requested = single((await searchParams).status);
  const filter: TicketFilter = FILTERS.find((value) => value === requested) ?? "open";
  return <Panel adminPath={adminPath} filter={filter} />;
}

async function Panel({ adminPath, filter }: { adminPath: string; filter: TicketFilter }) {
  const t = await getT();
  let result;
  try {
    result = await getTickets(filter);
  } catch {
    return <RetryErrorState description={t("Murojaatlarni yuklab bo'lmadi.")} />;
  }
  const { tickets, openCount, pageSize } = result;

  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold lg:text-[32px]">{t("Murojaatlar")}</h1>
        <LockButton adminPath={adminPath} />
      </div>
      <LinkTabs
        label="Murojaatlar holati"
        active={filter}
        tabs={[
          { value: "open", label: "Ochiq", href: `/${adminPath}`, count: openCount },
          { value: "resolved", label: "Hal qilingan", href: `/${adminPath}?status=resolved` },
          { value: "all", label: "Hammasi", href: `/${adminPath}?status=all` },
        ]}
      />

      {tickets.length === 0 ? (
        <EmptyState icon={Inbox} title={t("Murojaatlar yo'q")} description={t("Yangi murojaat kelsa, shu yerda chiqadi.")} />
      ) : (
        <ul className="flex flex-col gap-4">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="bg-card border-border rounded-card flex flex-col gap-3 border p-4">
              <div className="flex items-start gap-3">
                {ticket.user ? (
                  <>
                    <UserAvatar name={ticket.user.fullName} url={ticket.user.avatarUrl} userId={ticket.user.id} size="sm" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <Link href={`/u/${ticket.user.username}`} className="truncate font-semibold hover:underline">
                        {ticket.user.fullName}
                      </Link>
                      <span className="text-muted truncate text-[13px]">@{ticket.user.username}</span>
                    </div>
                  </>
                ) : (
                  <span className="text-muted flex-1 text-[14px]">{t("Foydalanuvchi o'chirilgan")}</span>
                )}
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge className="h-5 px-2 text-[11px]">{ticket.status === "resolved" ? t("Hal qilingan") : t("Ochiq")}</Badge>
                  <time dateTime={ticket.createdAt} className="text-muted text-[12px]">
                    {formatRelative(ticket.createdAt, t)}
                  </time>
                </div>
              </div>
              <p className="max-w-[65ch] text-[15px] leading-[1.6] break-words whitespace-pre-wrap select-text">{ticket.message}</p>
              {ticket.imageUrl ? (
                <ImageLightbox src={ticket.imageUrl} alt={t("Murojaat rasmi")} className="border-border max-h-72 rounded-2xl border object-cover" />
              ) : null}
              <div>
                <TicketStatusButton adminPath={adminPath} ticketId={ticket.id} status={ticket.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
      {tickets.length === pageSize ? (
        <p className="text-muted text-center text-[13px]">{t("Eng yangi {n} ta ko'rsatilmoqda.", { n: pageSize })}</p>
      ) : null}
    </div>
  );
}
