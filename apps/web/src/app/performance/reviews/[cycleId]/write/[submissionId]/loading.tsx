import { Skeleton } from "@/components/ui/skeleton";

export default function WriteReviewLoading() {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[260px_minmax(0,1fr)]" aria-busy="true">
      <Skeleton className="h-[420px] rounded-[var(--radius-lg)] border border-slate-200 bg-white" />
      <Skeleton className="h-[620px] rounded-[var(--radius-lg)] border border-slate-200 bg-white" />
    </div>
  );
}
