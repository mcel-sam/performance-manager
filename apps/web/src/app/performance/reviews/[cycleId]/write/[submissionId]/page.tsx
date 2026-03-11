import Link from "next/link";

import WriteReviewForm from "@/components/reviews/write-review-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getBackLabelForHref, resolveReturnTo } from "@/lib/navigation/return-to";
import { getReviewRelationshipLabel } from "@/lib/reviews/review-copy";
import { getDevRequestContext } from "@/server/auth/request-context";
import { getWriteReviewData } from "@/server/reviews/participant-review-service";

export const dynamic = "force-dynamic";

interface WriteReviewPageProps {
  params: Promise<{
    cycleId: string;
    submissionId: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function WriteReviewPage({
  params,
  searchParams,
}: WriteReviewPageProps) {
  const { cycleId, submissionId } = await params;
  const rawSearchParams = await searchParams;
  const context = await getDevRequestContext();
  const data = await getWriteReviewData(cycleId, submissionId, context);
  const returnHref = resolveReturnTo(getSingleValue(rawSearchParams.returnTo), "/performance/reviews");
  const returnLabel = getBackLabelForHref(returnHref, "Back");

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 text-slate-900">
      <PageHeader
        eyebrow="Write Review"
        title={data.template.name}
        description="Complete all required prompts. Autosave keeps your draft current and submit locks the review."
        action={
          <Link href={returnHref}>
            <Button variant="outline" size="sm">
              {returnLabel}
            </Button>
          </Link>
        }
        metadata={
          <>
            {data.submission.cycleName} | Subject: {data.submission.subjectName} | Review type:{" "}
            {getReviewRelationshipLabel(data.submission.relationship, "full")}
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
          subjectDepartment: data.submission.subjectDepartment,
          subjectTitle: data.submission.subjectTitle,
          reviewerName: data.submission.reviewerName,
          relationship: getReviewRelationshipLabel(data.submission.relationship, "full"),
        }}
      />
    </div>
  );
}

function getSingleValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}
