import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
  className?: string;
};

export async function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  const t = await getT();
  return (
    <div
      className={cn(
        "bg-card border-border rounded-card flex flex-col items-center gap-3 border px-6 py-12 text-center",
        className,
      )}
    >
      {Icon ? (
        <span className="bg-surface text-muted flex size-12 items-center justify-center rounded-full">
          <Icon className="size-5" aria-hidden />
        </span>
      ) : null}
      <h2 className="text-base font-semibold">{t(title)}</h2>
      <p className="text-muted max-w-sm text-[15px]">{t(description)}</p>
      {action ? (
        <Link href={action.href} className={cn(buttonVariants(), "mt-2")}>
          {t(action.label)}
        </Link>
      ) : null}
    </div>
  );
}
