import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div role="status" aria-label="Yuklanmoqda" className="flex flex-col gap-6">
      <div className="bg-card border-border rounded-card overflow-hidden border">
        <Skeleton className="h-32 rounded-none sm:h-44 lg:h-52" />
        <div className="flex flex-col gap-4 px-5 pb-6 sm:flex-row sm:gap-5 sm:px-6">
          <Skeleton className="ring-card -mt-12 size-24 shrink-0 rounded-full ring-4" />
          <div className="flex flex-1 flex-col gap-3 sm:pt-4">
            <Skeleton className="h-7 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
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
