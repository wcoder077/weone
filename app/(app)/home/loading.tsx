import { Skeleton } from "@/components/ui/skeleton";
import { FeedSkeleton } from "@/components/posts/feed-skeleton";
import { ListRowSkeleton } from "@/components/shared/skeletons";

export default function HomeLoading() {
  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="mx-auto flex w-full max-w-[680px] flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="rounded-card h-40" />
        <FeedSkeleton />
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
