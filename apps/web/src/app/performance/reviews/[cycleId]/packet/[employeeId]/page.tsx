import Link from "next/link";

import { getDevRequestContext } from "@/server/auth/request-context";
import { getReviewPacket } from "@/server/reviews/review-packet-service";

export const dynamic = "force-dynamic";

const relationshipLabel = {
  SELF: "Self",
  MANAGER: "Manager",
  PEER: "Peer",
  UPWARD: "Upward",
} as const;

const statusLabel = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  SUBMITTED: "Submitted",
  RETURNED: "Returned",
} as const;

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

        <section className="space-y-4">
          {packet.submissions.length === 0 ? (
            <section
              aria-label="Empty review packet"
              className="rounded-xl border border-dashed border-slate-300 bg-white p-8 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-slate-900">No submissions in this packet yet</h2>
              <p className="mt-2 text-sm text-slate-600">
                Assigned reviewers have not started writing answers for this cycle.
              </p>
            </section>
          ) : (
            <section aria-label="Review packet submissions" className="space-y-4">
              {packet.submissions.map((submission) => (
                <article key={submission.submissionId} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{submission.reviewerName}</h2>
                      <p className="text-sm text-slate-600">
                        Relationship: {relationshipLabel[submission.relationship]}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-600">
                      <p className="rounded-full bg-slate-100 px-3 py-1 font-medium inline-block">
                        {statusLabel[submission.status]}
                      </p>
                      <p className="mt-2">
                        {submission.submittedAt
                          ? `Submitted ${new Date(submission.submittedAt).toLocaleDateString()}`
                          : "Not submitted yet"}
                      </p>
                    </div>
                  </div>

                  {submission.answers.length === 0 ? (
                    <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                      No answers have been saved for this submission.
                    </div>
                  ) : (
                    <ol className="mt-4 space-y-3">
                      {submission.answers.map((answer) => (
                        <li key={answer.answerId} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-semibold text-slate-900">
                            {answer.prompt}
                            {answer.isRequired ? <span className="ml-1 text-rose-700">*</span> : null}
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                            {answer.responseText || "No response provided."}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                </article>
              ))}
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
