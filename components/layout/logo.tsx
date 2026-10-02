"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/i18n-provider";

export function Logo({ className }: { className?: string }) {
  const t = useT();
  return (
    <Link
      href="/"
      aria-label={t("we1 bosh sahifa")}
      className={cn(
        "inline-flex min-h-11 items-center text-2xl font-bold tracking-tight",
        className,
      )}
    >
      we<span className="text-primary">1</span>
    </Link>
  );
}
