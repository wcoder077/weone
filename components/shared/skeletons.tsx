import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const cardClass = "bg-card border-border rounded-card border p-5";

export function PersonCardSkeleton() {
  return (
    <div className={cn(cardClass, "flex flex-col gap-4")} aria-hidden>
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-14 rounded-full" />
      </div>
      <Skeleton className="h-11 w-full rounded-full" />
    </div>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className={cn(cardClass, "flex flex-col gap-4")} aria-hidden>
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 rounded-xl" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-2" aria-hidden>
      <Skeleton className="size-10 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3.5 w-1/4" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({
  count = 3,
  variant = "person",
}: {
  count?: number;
  variant?: "person" | "project";
}) {
  const Card = variant === "person" ? PersonCardSkeleton : ProjectCardSkeleton;
  return (
    <div
      role="status"
      aria-label="Yuklanmoqda"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} />
      ))}
    </div>
  );
}
