export default function NewReviewCycleLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4" aria-busy="true">
      <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
      <div className="h-6 w-72 animate-pulse rounded bg-slate-200" />
      <div className="h-[420px] w-full animate-pulse rounded-xl border border-slate-200 bg-white" />
    </div>
  );
}
