import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingLoading() {
  return (
    <div role="status" aria-label="Yuklanmoqda" className="mx-auto flex max-w-[520px] flex-col gap-6 px-4 pt-20">
      <Skeleton className="h-1 w-full rounded-full" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-12 w-full rounded-full" />
      <Skeleton className="h-12 w-full rounded-full" />
      <Skeleton className="h-12 w-full rounded-full" />
    </div>
  );
}
