export default function WriteReviewLoading() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
        <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="h-[520px] animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>
    </main>
  );
}
