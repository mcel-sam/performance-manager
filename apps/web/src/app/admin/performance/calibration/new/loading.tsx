export default function NewCalibrationSessionLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4" aria-busy="true">
      <div className="h-16 animate-pulse rounded-xl bg-slate-200" />
      <div className="h-96 animate-pulse rounded-xl bg-slate-200" />
    </div>
  );
}
