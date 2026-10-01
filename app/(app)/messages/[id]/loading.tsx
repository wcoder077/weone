import { Skeleton } from "@/components/ui/skeleton";

export default function ConversationLoading() {
  return (
    <div role="status" aria-label="Yuklanmoqda" className="bg-card border-border rounded-card flex h-[calc(100dvh-11rem)] flex-col gap-4 border p-5 lg:h-full">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-10 w-2/3 rounded-3xl" />
      <Skeleton className="h-10 w-1/2 self-end rounded-3xl" />
      <Skeleton className="h-10 w-3/5 rounded-3xl" />
    </div>
  );
}
