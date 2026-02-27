"use client";

import { EvidenceType } from "@prisma/client";
import { useMemo, useState } from "react";

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
      <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("thisCycle")}
          className={`rounded px-3 py-1.5 text-xs font-medium ${
            activeTab === "thisCycle" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
          }`}
        >
          This cycle
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("previousCycles")}
          className={`rounded px-3 py-1.5 text-xs font-medium ${
            activeTab === "previousCycles"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600"
          }`}
        >
          Previous cycles
        </button>
      </div>

      {activeTab === "previousCycles" ? (
        <section
          aria-label="Previous cycle packet state"
          className="rounded-xl border border-dashed border-slate-300 bg-white p-8 shadow-sm"
        >
          <h2 className="text-xl font-semibold text-slate-900">No previous cycle packet data yet</h2>
          <p className="mt-2 text-sm text-slate-600">
            Historical packet comparisons will appear here when prior cycle data is available.
          </p>
        </section>
      ) : (
        <>
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
            <p className="mt-1 text-sm text-slate-600">
              Summary editing is a placeholder for MVP and will be enabled in a later milestone.
            </p>
            <textarea
              readOnly
              value=""
              placeholder="Summary placeholder: no packet summary has been authored yet."
              className="mt-3 min-h-24 w-full rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              aria-label="Packet summary placeholder"
            />
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">Evidence counts</h2>
              <span className="text-xs text-slate-500">Total: {evidenceCountTotal}</span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {evidenceOrder.map((type) => (
                <div key={type} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-500">{evidenceLabel[type]}</p>
                  <p className="text-base font-semibold text-slate-900">
                    {data.packet.evidenceCounts[type] ?? 0}
                  </p>
                </div>
              ))}
            </div>
          </article>

          {data.submissions.length === 0 ? (
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
              {data.submissions.map((submission) => (
                <article
                  key={submission.submissionId}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{submission.reviewerName}</h2>
                      <p className="text-sm text-slate-600">
                        Relationship: {relationshipLabel[submission.relationship]}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-600">
                      <p className="inline-block rounded-full bg-slate-100 px-3 py-1 font-medium">
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
        </>
      )}
    </section>
  );
}
