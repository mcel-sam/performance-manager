import Link from "next/link";

import WriteReviewForm from "@/components/reviews/write-review-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="mx-auto w-full max-w-7xl space-y-6 text-slate-900">
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

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Task Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <nav className="space-y-2">
              <Link href="/performance/reviews">
                <Button variant="outline" className="w-full justify-start">
                  Review Tasks
                </Button>
              </Link>
              <p className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                {relationshipLabel[data.submission.relationship]}
              </p>
            </nav>

            <dl className="space-y-2 text-sm text-slate-700">
              <div>
                <dt className="font-semibold text-slate-900">Cycle</dt>
                <dd>{data.submission.cycleName}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">Subject</dt>
                <dd>{data.submission.subjectName}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">Reviewer</dt>
                <dd>{data.submission.reviewerName}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <WriteReviewForm
          cycleId={cycleId}
          submissionId={submissionId}
          subjectEmployeeId={data.submission.subjectEmployeeId}
          auth={{ userId: context.userId, orgId: context.orgId }}
          initialStatus={data.submission.status}
          questions={data.questions}
        />
      </div>
    </div>
  );
}
