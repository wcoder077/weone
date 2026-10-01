import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectLoading() {
  return (
    <div role="status" aria-label="Yuklanmoqda" className="flex flex-col gap-6">
      <Skeleton className="rounded-card h-36" />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-20" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="rounded-card h-64" />
      </div>
    </div>
  );
}
