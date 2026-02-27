export default function ImprovementPlanDetailLoading() {
  return (
    <main className="space-y-6" aria-busy="true">
      <div className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />
          <div className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white" />
        </div>
        <div className="space-y-4">
          <div className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white" />
          <div className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white" />
        </div>
      </div>
    </main>
  );
}
