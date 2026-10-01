import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Pagination({
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
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;

  const linkClass = (disabled: boolean) =>
    cn(buttonVariants({ variant: "outline" }), disabled && "pointer-events-none opacity-40");

  return (
    <nav aria-label="Sahifalar" className="flex items-center justify-center gap-3">
      <Link href={hrefFor(page - 1)} aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined} className={linkClass(page <= 1)}>
        <ChevronLeft data-icon="inline-start" />
        Oldingi
      </Link>
      <span className="text-muted text-[14px]">
        {page} / {pages}
      </span>
      <Link href={hrefFor(page + 1)} aria-disabled={page >= pages} tabIndex={page >= pages ? -1 : undefined} className={linkClass(page >= pages)}>
        Keyingi
        <ChevronRight data-icon="inline-end" />
      </Link>
    </nav>
  );
}
