export default function AdminReviewCyclesLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4" aria-busy="true">
      <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
      <div className="h-5 w-96 animate-pulse rounded bg-slate-200" />
      <div className="h-80 w-full animate-pulse rounded-xl border border-slate-200 bg-white" />
    </div>
  );
}
