"use client";

import { EvidenceType } from "@prisma/client";
import { useMemo, useState } from "react";

import { SectionHeader } from "@/components/layout/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatStableDate } from "@/lib/dates/stable-format";
import { Tabs } from "@/components/ui/tabs";
import { getReviewRelationshipLabel } from "@/lib/reviews/review-copy";
import type { ReviewPacketData } from "@/server/reviews/review-packet-service";

type PacketTab = "thisCycle" | "previousCycles";

const statusLabel = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  SUBMITTED: "Submitted",
  RETURNED: "Returned",
} as const;

const evidenceBuckets: Array<{
  label: string;
  types: EvidenceType[];
}> = [
  { label: "Feedback", types: [EvidenceType.FEEDBACK] },
  { label: "Updates", types: [EvidenceType.UPDATE] },
  { label: "1:1s", types: [EvidenceType.ONE_ON_ONE] },
  { label: "Goals", types: [EvidenceType.GOAL, EvidenceType.GOAL_UPDATE] },
  { label: "Values", types: [EvidenceType.VALUE_RECOGNITION] },
];

interface ReviewPacketViewProps {
  data: ReviewPacketData;
}

export default function ReviewPacketView({ data }: ReviewPacketViewProps) {
  const [activeTab, setActiveTab] = useState<PacketTab>("thisCycle");

  const evidenceCountTotal = useMemo(
    () =>
      evidenceBuckets.reduce(
        (total, bucket) =>
          total +
          bucket.types.reduce(
            (bucketTotal, type) => bucketTotal + (data.packet.evidenceCounts[type] ?? 0),
            0,
          ),
        0,
      ),
    [data.packet.evidenceCounts],
  );

  return (
    <section className="space-y-4">
      <Tabs
        ariaLabel="Packet tabs"
        value={activeTab}
        onValueChange={(nextValue) => setActiveTab(nextValue as PacketTab)}
        tabs={[
          {
            value: "thisCycle",
            label: "This cycle",
          },
          {
            value: "previousCycles",
            label: "Previous cycles",
          },
        ]}
      />

      {activeTab === "previousCycles" ? (
        <EmptyState
          aria-label="Previous cycle packet state"
          title="No previous cycle packet data yet"
          description="Historical packet comparisons will appear here when prior cycle data is available."
        />
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <SectionHeader
                  title="Role expectations"
                  description="Role baseline and competency expectations relevant to this packet."
                />
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Role baseline</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {data.trackContext
                      ? `${data.trackContext.trackLabel} · ${data.trackContext.levelLabel}`
                      : "Role baseline not available"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {data.trackContext?.summary ??
                      "Role expectations will appear here when the baseline is available."}
                  </p>
                </div>
                {data.trackContext?.competencies.length ? (
                  <div className="flex flex-wrap gap-2">
                    {data.trackContext.competencies.map((competency) => (
                      <span
                        key={competency.label}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                      >
                        {competency.label}
                      </span>
                    ))}
                  </div>
                ) : null}
                {data.trackContext ? (
                  <p className="text-sm font-medium text-slate-600">
                    Competency expectations are shown inline for this review packet.
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <SectionHeader
                  title="Goals snapshot"
                  description="Current-cycle goals and the latest visible check-ins."
                />
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                  <span>{data.goalContext?.cycleName ?? "No active goal cycle"}</span>
                  <span>{data.goalContext?.goals.length ?? 0} goals</span>
                </div>
                {data.goalContext?.goals.length ? (
                  <div className="space-y-2">
                    {data.goalContext.goals.slice(0, 3).map((goal) => (
                      <div
                        key={goal.id}
                        className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-3"
                      >
                        <p className="text-sm font-semibold text-slate-900">{goal.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {goal.progressPercent.toFixed(0)}% · {goal.lastUpdate ? "Updated" : "No update"}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {goal.lastUpdate?.note ?? "No update posted yet."}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No visible goals"
                    description="There are no active goals available for this packet context."
                    className="p-4"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <SectionHeader
                title="Evidence counts"
                description="Counts by evidence source available in this cycle packet."
                action={<span className="text-xs text-slate-500">Total: {evidenceCountTotal}</span>}
              />
            </CardHeader>
            <CardContent className="grid gap-2 pt-0 sm:grid-cols-2 lg:grid-cols-3">
              {evidenceBuckets.map((bucket) => (
                <div
                  key={bucket.label}
                  className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <p className="text-xs text-slate-500">{bucket.label}</p>
                  <p className="text-base font-semibold text-slate-900">
                    {bucket.types.reduce(
                      (total, type) => total + (data.packet.evidenceCounts[type] ?? 0),
                      0,
                    )}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {data.submissions.length === 0 ? (
            <EmptyState
              aria-label="Empty review packet"
              title="No submissions in this packet yet"
              description="Assigned reviewers have not started writing answers for this cycle."
            />
          ) : (
            <section aria-label="Review packet submissions" className="space-y-4">
              {data.submissions.map((submission) => (
                <Card key={submission.submissionId}>
                  <CardHeader className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{submission.reviewerName}</CardTitle>
                        <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                          <span>Review type: {getReviewRelationshipLabel(submission.relationship, "full")}</span>
                          {submission.isReferenceInput ? (
                            <Badge variant="info">Reference input</Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-600">
                        <Badge variant="neutral">{statusLabel[submission.status]}</Badge>
                        <p className="mt-2">
                          {submission.submittedAt
                            ? `Submitted ${formatStableDate(submission.submittedAt)}`
                            : "Not submitted yet"}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {submission.answers.length === 0 ? (
                      <EmptyState
                        title="No saved answers yet"
                        description="No answers have been saved for this submission."
                        className="p-4"
                      />
                    ) : (
                      <ol className="space-y-3">
                        {submission.answers.map((answer) => (
                          <li
                            key={answer.answerId}
                            className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4"
                          >
                            <p className="text-sm font-semibold text-slate-900">
                              {answer.prompt}
                              {answer.isRequired ? <span className="ml-1 text-rose-700">*</span> : null}
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                              {answer.responseText || "No response provided."}
                            </p>
                            {answer.questionType === "SCALE_1_TO_5" ? (
                              <p className="mt-2 text-xs font-medium text-slate-600">
                                Rating:{" "}
                                {answer.notObserved
                                  ? "Not observed (excluded from score)"
                                  : answer.scaleRating != null
                                    ? `${answer.scaleRating}/5`
                                    : "Not rated"}
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    )}
                  </CardContent>
                </Card>
              ))}
            </section>
          )}
        </>
      )}
    </section>
  );
}
