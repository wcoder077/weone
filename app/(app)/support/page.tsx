import { LifeBuoy } from "lucide-react";
import { SupportForm } from "@/components/support/support-form";
import { BackLink } from "@/components/shared/back-link";
import { Badge } from "@/components/shared/badge";
import { SectionCard } from "@/components/shared/section-card";
import { requireUserId } from "@/lib/auth";
import { formatRelative } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { getMyTickets } from "@/lib/queries/support";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Yordam va qo'llab-quvvatlash") };
}

export default async function SupportPage() {
  const [t, userId] = await Promise.all([getT(), requireUserId()]);
  const tickets = await getMyTickets(userId).catch(() => []);

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
      <BackLink fallback="/settings" />
      <div className="flex flex-col gap-2">
        <h1 className="inline-flex items-center gap-3 text-2xl font-bold lg:text-[32px]">
          <LifeBuoy className="size-7 shrink-0" aria-hidden />
          {t("Yordam va qo'llab-quvvatlash")}
        </h1>
        <p className="text-muted text-[15px]">
          {t("Muammoga duch kelsangiz yoki taklifingiz bo'lsa, yozing. Jamoamiz ko'rib chiqadi.")}
        </p>
      </div>

      <SectionCard title={t("Yangi murojaat")}>
        <SupportForm userId={userId} />
      </SectionCard>

      {tickets.length > 0 ? (
        <SectionCard title={t("Oldingi murojaatlarim")}>
          <ul className="flex flex-col gap-4">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="border-border flex flex-col gap-1 border-b pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <time dateTime={ticket.createdAt} className="text-muted text-[13px]">
                    {formatRelative(ticket.createdAt, t)}
                  </time>
                  <Badge className="h-5 px-2 text-[11px]">{ticket.status === "resolved" ? t("Hal qilindi") : t("Ko'rib chiqilmoqda")}</Badge>
                </div>
                <p className="line-clamp-3 text-[15px] break-words whitespace-pre-wrap">{ticket.message}</p>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}
    </div>
  );
}
