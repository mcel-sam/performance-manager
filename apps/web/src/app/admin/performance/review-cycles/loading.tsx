import { Skeleton } from "@/components/ui/skeleton";

export default function AdminReviewCyclesLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4" aria-busy="true">
      <Skeleton className="h-24 rounded-[var(--radius-lg)] border border-slate-200 bg-white" />
      <Skeleton className="h-[460px] rounded-[var(--radius-lg)] border border-slate-200 bg-white" />
    </div>
  );
}
