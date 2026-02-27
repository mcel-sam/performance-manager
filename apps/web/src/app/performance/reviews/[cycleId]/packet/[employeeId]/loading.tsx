export default function ReviewPacketLoading() {
  return (
    <main className="space-y-6" aria-busy="true">
      <div className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="space-y-4">
          <div className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white" />
          <div className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white" />
        </div>
      </div>
    </main>
  );
}
