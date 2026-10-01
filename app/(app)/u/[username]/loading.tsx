import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div role="status" aria-label="Yuklanmoqda" className="flex flex-col gap-6">
      <div className="bg-card border-border rounded-card flex items-center gap-5 border p-6">
        <Skeleton className="size-24 rounded-full" />
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-7 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-4">
          <Skeleton className="rounded-card h-32" />
          <Skeleton className="rounded-card h-48" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-12 w-72 rounded-full" />
          <Skeleton className="rounded-card h-80" />
        </div>
      </div>
    </div>
  );
}
