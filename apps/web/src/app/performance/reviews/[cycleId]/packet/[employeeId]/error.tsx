"use client";

interface ReviewPacketErrorProps {
  error: Error;
  reset: () => void;
}

export default function ReviewPacketError({ error, reset }: ReviewPacketErrorProps) {
  return (
    <main className="rounded-xl border border-rose-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-rose-900">Unable to load review packet</h1>
      <p className="mt-2 text-sm text-rose-700">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800"
      >
        Try again
      </button>
    </main>
  );
}
