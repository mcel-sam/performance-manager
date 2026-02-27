import { Skeleton } from "@/components/ui/skeleton";

export default function NewReviewCycleLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4" aria-busy="true">
      <Skeleton className="h-14 rounded-[var(--radius-lg)] border border-slate-200 bg-white" />
      <Skeleton className="h-[420px] w-full rounded-[var(--radius-lg)] border border-slate-200 bg-white" />
    </div>
  );
}
