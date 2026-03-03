import Link from "next/link";

import WriteReviewForm from "@/components/reviews/write-review-form";
import { PageHeader } from "@/components/layout/page-header";
import { getDevRequestContext } from "@/server/auth/request-context";
import { getWriteReviewData } from "@/server/reviews/participant-review-service";

export const dynamic = "force-dynamic";

const relationshipLabel = {
  SELF: "Self Review",
  MANAGER: "Manager Review",
  PEER: "Peer Review",
  UPWARD: "Upward Review",
} as const;

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
    <div className="mx-auto w-full max-w-[1400px] space-y-6 text-slate-900">
      <nav
        aria-label="Write review breadcrumb"
        data-testid="write-review-breadcrumb"
        className="flex flex-wrap items-center gap-2 text-sm text-slate-600"
      >
        <Link href="/performance/reviews" className="font-medium text-slate-700 hover:text-slate-900">
          Reviews
        </Link>
        <span aria-hidden>/</span>
        <span>{data.submission.cycleName}</span>
        <span aria-hidden>/</span>
        <span>{data.submission.subjectName}</span>
      </nav>

      <PageHeader
        eyebrow="Write Review"
        title={data.template.name}
        description="Complete all required prompts. Autosave keeps your draft current and submit locks the review."
        metadata={
          <>
            {data.submission.cycleName} | Subject: {data.submission.subjectName} | Relationship:{" "}
            {relationshipLabel[data.submission.relationship]}
          </>
        }
      />

      <WriteReviewForm
        cycleId={cycleId}
        submissionId={submissionId}
        subjectEmployeeId={data.submission.subjectEmployeeId}
        auth={{ userId: context.userId, orgId: context.orgId }}
        initialStatus={data.submission.status}
        questions={data.questions}
        submissionContext={{
          cycleName: data.submission.cycleName,
          subjectName: data.submission.subjectName,
          reviewerName: data.submission.reviewerName,
          relationship: relationshipLabel[data.submission.relationship],
          packetHref: `/performance/reviews/${cycleId}/packet/${data.submission.subjectEmployeeId}`,
        }}
      />
    </div>
  );
}
