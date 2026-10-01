import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  available,
  className,
}: {
  name: string;
  url: string | null;
  size?: keyof typeof SIZES;
  available?: boolean;
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
      {available ? (
        <span
          className="bg-success ring-bg absolute right-0 bottom-0 size-3 rounded-full ring-2"
          aria-label="Hamkorlikka ochiq"
          role="img"
        />
      ) : null}
    </span>
  );
}
