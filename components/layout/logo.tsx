import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="we1 bosh sahifa"
      className={cn(
        "inline-flex min-h-11 items-center text-2xl font-bold tracking-tight",
        className,
      )}
    >
      we<span className="text-primary">1</span>
    </Link>
  );
}
