import { Skeleton } from "@/components/ui/skeleton";

export default function ImprovementPlanDetailLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-32 rounded-[var(--radius-lg)] border border-slate-200 bg-white" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-[var(--radius-lg)] border border-slate-200 bg-white" />
          <Skeleton className="h-96 rounded-[var(--radius-lg)] border border-slate-200 bg-white" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-56 rounded-[var(--radius-lg)] border border-slate-200 bg-white" />
          <Skeleton className="h-56 rounded-[var(--radius-lg)] border border-slate-200 bg-white" />
        </div>
      </div>
    </div>
  );
}
