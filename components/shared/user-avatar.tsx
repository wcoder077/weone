import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OnlineDot } from "@/components/layout/online-presence";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-8 text-[12px]",
  md: "size-10 text-[13px]",
  lg: "size-12 text-[15px]",
  xl: "size-24 text-2xl",
} as const;

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

export function UserAvatar({
  name,
  url,
  size = "md",
  userId,
  className,
}: {
  name: string;
  url: string | null;
  size?: keyof typeof SIZES;
  /** Shows the green "online" dot while this user is online. */
  userId?: string;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <Avatar className={SIZES[size]}>
        {url ? <AvatarImage src={url} alt="" /> : null}
        <AvatarFallback className="bg-surface text-text font-semibold">
          {initialsOf(name)}
        </AvatarFallback>
      </Avatar>
      {userId ? <OnlineDot userId={userId} className={size === "xl" ? "right-1 bottom-1 size-5 ring-4" : undefined} /> : null}
    </span>
  );
}
