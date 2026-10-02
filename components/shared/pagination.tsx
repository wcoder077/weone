import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

export async function Pagination({
  page,
  total,
  pageSize,
  hrefFor,
}: {
  page: number;
  total: number;
  pageSize: number;
  hrefFor: (page: number) => string;
}) {
  const t = await getT();
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;

  const linkClass = (disabled: boolean) =>
    cn(buttonVariants({ variant: "outline" }), disabled && "pointer-events-none opacity-40");

  return (
    <nav aria-label={t("Sahifalar")} className="flex items-center justify-center gap-3">
      <Link href={hrefFor(page - 1)} aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined} className={linkClass(page <= 1)}>
        <ChevronLeft data-icon="inline-start" />
        {t("Oldingi")}</Link>
      <span className="text-muted text-[14px]">
        {page} / {pages}
      </span>
      <Link href={hrefFor(page + 1)} aria-disabled={page >= pages} tabIndex={page >= pages ? -1 : undefined} className={linkClass(page >= pages)}>
        {t("Keyingi")}<ChevronRight data-icon="inline-end" />
      </Link>
    </nav>
  );
}
