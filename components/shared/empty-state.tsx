import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
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
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-muted max-w-sm text-[15px]">{description}</p>
      {action ? (
        <Link href={action.href} className={cn(buttonVariants(), "mt-2")}>
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
