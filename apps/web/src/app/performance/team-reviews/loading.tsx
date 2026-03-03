import { Skeleton } from "@/components/ui/skeleton";

export default function TeamReviewsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6" aria-busy="true">
      <Skeleton className="h-24 rounded-[var(--radius-lg)] border border-slate-200 bg-white" />
      <Skeleton className="h-36 rounded-[var(--radius-lg)] border border-slate-200 bg-white" />
      <Skeleton className="h-[420px] rounded-[var(--radius-lg)] border border-slate-200 bg-white" />
    </div>
  );
}
