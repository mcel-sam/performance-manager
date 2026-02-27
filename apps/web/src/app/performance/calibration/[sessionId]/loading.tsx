export default function CalibrationSessionLoading() {
  return (
    <main className="space-y-6" aria-busy="true">
      <div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="h-[520px] animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="h-[520px] animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>
    </main>
  );
}
