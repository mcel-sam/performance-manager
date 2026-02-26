export default function ReviewsLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6" aria-busy="true">
        <div className="h-9 w-64 animate-pulse rounded-md bg-slate-200" />
        <div className="h-5 w-96 animate-pulse rounded-md bg-slate-200" />
        <div className="h-36 w-full animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>
    </main>
  );
}
