import { EvidenceType } from "@prisma/client";
import Link from "next/link";

import WriteReviewForm from "@/components/reviews/write-review-form";
import { getDevRequestContext } from "@/server/auth/request-context";
import { getWriteReviewData } from "@/server/reviews/participant-review-service";

export const dynamic = "force-dynamic";

const relationshipLabel = {
  SELF: "Self Review",
  MANAGER: "Manager Review",
  PEER: "Peer Review",
  UPWARD: "Upward Review",
} as const;

const evidenceOrder: EvidenceType[] = [
  EvidenceType.FEEDBACK,
  EvidenceType.UPDATE,
  EvidenceType.ONE_ON_ONE,
  EvidenceType.GOAL,
  EvidenceType.VALUE_RECOGNITION,
];

const evidenceLabel: Record<EvidenceType, string> = {
  FEEDBACK: "Feedback",
  UPDATE: "Updates",
  ONE_ON_ONE: "1:1s",
  GOAL: "Goals",
  VALUE_RECOGNITION: "Values",
};

interface WriteReviewPageProps {
  params: Promise<{
    cycleId: string;
    submissionId: string;
  }>;
}

export default async function WriteReviewPage({ params }: WriteReviewPageProps) {
  const { cycleId, submissionId } = await params;
  const context = await getDevRequestContext();
  const data = await getWriteReviewData(cycleId, submissionId, context);

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Phase Nav</h2>
          <nav className="mt-4 space-y-2">
            <Link
              className="block rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              href="/performance/reviews"
            >
              Review Tasks
            </Link>
            <div className="rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900">
              {relationshipLabel[data.submission.relationship]}
            </div>
          </nav>

          <div className="mt-6 space-y-2 text-sm text-slate-700">
            <p>
              <span className="font-semibold">Cycle:</span> {data.submission.cycleName}
            </p>
            <p>
              <span className="font-semibold">Subject:</span> {data.submission.subjectName}
            </p>
            <p>
              <span className="font-semibold">Reviewer:</span> {data.submission.reviewerName}
            </p>
          </div>
        </aside>

        <section className="space-y-4">
          <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-semibold">{data.template.name}</h1>
            <p className="mt-1 text-sm text-slate-600">
              Complete all required prompts, autosave keeps drafts current, and submit locks the
              review.
            </p>
          </header>

          <WriteReviewForm
            cycleId={cycleId}
            submissionId={submissionId}
            auth={{ userId: context.userId, orgId: context.orgId }}
            initialStatus={data.submission.status}
            questions={data.questions}
          />
        </section>

        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Evidence Context
          </h2>
          <p className="mt-1 text-xs text-slate-500">Counts for this subject in the current org.</p>

          <dl className="mt-4 space-y-3">
            {evidenceOrder.map((type) => (
              <div
                key={type}
                className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
              >
                <dt className="text-sm text-slate-700">{evidenceLabel[type]}</dt>
                <dd className="text-sm font-semibold text-slate-900">
                  {data.evidenceCounts[type] ?? 0}
                </dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </main>
  );
}
