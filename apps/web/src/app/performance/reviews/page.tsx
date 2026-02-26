export default function PerformanceReviewsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Performance Reviews</h1>
          <p className="text-sm text-slate-600">
            Track review cycles and complete your assigned submissions.
          </p>
        </header>

        <section
          aria-label="Empty review cycle state"
          className="rounded-xl border border-dashed border-slate-300 bg-white p-8 shadow-sm"
        >
          <h2 className="text-xl font-semibold text-slate-900">No review cycles yet</h2>
          <p className="mt-2 text-sm text-slate-600">
            Review cycles created by HR will appear here once they are active.
          </p>
        </section>
      </div>
    </main>
  );
}
