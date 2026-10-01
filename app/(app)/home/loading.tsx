import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton, ListRowSkeleton } from "@/components/shared/skeletons";

export default function HomeLoading() {
  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex flex-col gap-8">
        <Skeleton className="h-9 w-56" />
        <CardGridSkeleton />
        <CardGridSkeleton variant="project" count={2} />
      </div>
      <div aria-hidden className="bg-card border-border rounded-card flex flex-col gap-2 border p-5">
        <Skeleton className="h-5 w-40" />
        <ListRowSkeleton />
        <ListRowSkeleton />
        <ListRowSkeleton />
      </div>
    </div>
  );
}
