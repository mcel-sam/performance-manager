"use client";

import { EvidenceType } from "@prisma/client";
import { useMemo, useState } from "react";

import { SectionHeader } from "@/components/layout/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { ReviewPacketData } from "@/server/reviews/review-packet-service";

type PacketTab = "thisCycle" | "previousCycles";

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

const evidenceLabel: Record<EvidenceType, string> = {
  FEEDBACK: "Feedback",
  UPDATE: "Updates",
  ONE_ON_ONE: "1:1s",
  GOAL: "Goals",
  VALUE_RECOGNITION: "Values",
};

const evidenceOrder: EvidenceType[] = [
  EvidenceType.FEEDBACK,
  EvidenceType.UPDATE,
  EvidenceType.ONE_ON_ONE,
  EvidenceType.GOAL,
  EvidenceType.VALUE_RECOGNITION,
];

interface ReviewPacketViewProps {
  data: ReviewPacketData;
}

export default function ReviewPacketView({ data }: ReviewPacketViewProps) {
  const [activeTab, setActiveTab] = useState<PacketTab>("thisCycle");

  const evidenceCountTotal = useMemo(
    () =>
      evidenceOrder.reduce(
        (total, type) => total + (data.packet.evidenceCounts[type] ?? 0),
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
          <Card>
            <CardHeader>
              <SectionHeader
                title="Summary"
                description="Summary editing is a placeholder for MVP and will be enabled in a later milestone."
              />
            </CardHeader>
            <CardContent className="pt-0">
              <Textarea
                readOnly
                value=""
                placeholder="Summary placeholder: no packet summary has been authored yet."
                className="min-h-24 border-dashed bg-slate-50 text-slate-500"
                aria-label="Packet summary placeholder"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <SectionHeader
                title="Evidence counts"
                description="Counts by evidence source available in this cycle packet."
                action={<span className="text-xs text-slate-500">Total: {evidenceCountTotal}</span>}
              />
            </CardHeader>
            <CardContent className="grid gap-2 pt-0 sm:grid-cols-2 lg:grid-cols-3">
              {evidenceOrder.map((type) => (
                <div
                  key={type}
                  className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <p className="text-xs text-slate-500">{evidenceLabel[type]}</p>
                  <p className="text-base font-semibold text-slate-900">
                    {data.packet.evidenceCounts[type] ?? 0}
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
                        <p className="text-sm text-slate-600">
                          Relationship: {relationshipLabel[submission.relationship]}
                        </p>
                      </div>
                      <div className="text-right text-xs text-slate-600">
                        <Badge variant="neutral">{statusLabel[submission.status]}</Badge>
                        <p className="mt-2">
                          {submission.submittedAt
                            ? `Submitted ${new Date(submission.submittedAt).toLocaleDateString()}`
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
