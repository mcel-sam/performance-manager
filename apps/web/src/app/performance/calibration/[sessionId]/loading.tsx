import { Skeleton } from "@/components/ui/skeleton";

export default function CalibrationSessionLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-24 rounded-[var(--radius-lg)] border border-slate-200 bg-white" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-[520px] rounded-[var(--radius-lg)] border border-slate-200 bg-white" />
        <Skeleton className="h-[520px] rounded-[var(--radius-lg)] border border-slate-200 bg-white" />
      </div>
    </div>
  );
}
