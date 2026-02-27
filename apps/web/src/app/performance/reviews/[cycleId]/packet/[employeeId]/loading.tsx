import { Skeleton } from "@/components/ui/skeleton";

export default function ReviewPacketLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-28 rounded-[var(--radius-lg)] border border-slate-200 bg-white" />
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Skeleton className="h-40 rounded-[var(--radius-lg)] border border-slate-200 bg-white" />
        <div className="space-y-4">
          <Skeleton className="h-56 rounded-[var(--radius-lg)] border border-slate-200 bg-white" />
          <Skeleton className="h-56 rounded-[var(--radius-lg)] border border-slate-200 bg-white" />
        </div>
      </div>
    </div>
  );
}
