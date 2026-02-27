import Link from "next/link";

import ReviewPacketView from "@/components/reviews/review-packet-view";
import { getDevRequestContext } from "@/server/auth/request-context";
import { getReviewPacket } from "@/server/reviews/review-packet-service";

export const dynamic = "force-dynamic";

interface ReviewPacketPageProps {
  params: Promise<{
    cycleId: string;
    employeeId: string;
  }>;
}

export default async function ReviewPacketPage({ params }: ReviewPacketPageProps) {
  const { cycleId, employeeId } = await params;
  const context = await getDevRequestContext();
  const packet = await getReviewPacket(cycleId, employeeId, context);

  return (
    <main className="space-y-6 text-slate-900">
      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Review Packet</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{packet.packet.subjectName}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {packet.packet.cycleName} • {packet.packet.submittedCount} of {packet.packet.totalSubmissions} submitted
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">
            Status: {packet.packet.cycleStatus}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">
            Visibility: {packet.packet.visibilityPolicy}
          </span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Navigation</h2>
          <nav className="mt-3 space-y-2">
            <Link
              href="/performance/reviews"
              className="block rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Review Tasks
            </Link>
            <span className="block rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900">
              Packet View
            </span>
          </nav>
        </aside>

        <ReviewPacketView data={packet} />
      </div>
    </main>
  );
}
