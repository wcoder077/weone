import { ListRowSkeleton } from "@/components/shared/skeletons";

export default function MessagesLoading() {
  return (
    <div role="status" aria-label="Yuklanmoqda" className="bg-card border-border rounded-card flex flex-col gap-2 border p-5">
      {Array.from({ length: 6 }, (_, i) => (
        <ListRowSkeleton key={i} />
      ))}
    </div>
  );
}
