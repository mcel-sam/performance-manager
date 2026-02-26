"use client";

interface ReviewsErrorProps {
  error: Error;
  reset: () => void;
}

export default function ReviewsError({ error, reset }: ReviewsErrorProps) {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-rose-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-rose-900">Unable to load reviews</h1>
        <p className="mt-2 text-sm text-rose-700">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-md bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
