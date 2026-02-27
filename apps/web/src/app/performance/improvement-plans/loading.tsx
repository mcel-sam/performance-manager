import { Skeleton } from "@/components/ui/skeleton";

export default function ImprovementPlansListLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-24 rounded-[var(--radius-lg)] border border-slate-200 bg-white" />
      <Skeleton className="h-[420px] rounded-[var(--radius-lg)] border border-slate-200 bg-white" />
    </div>
  );
}
