"use client";

import { EvidenceType, ReviewSubmissionStatus } from "@prisma/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface EvidenceSummary {
  evidenceItemId: string;
  type: EvidenceType;
  title: string;
  summary: string;
  occurredAt: string;
}

interface WriteReviewQuestion {
  id: string;
  prompt: string;
  isRequired: boolean;
  answerId: string | null;
  responseText: string;
  attachedEvidence: EvidenceSummary[];
}

interface WriteReviewFormProps {
  cycleId: string;
  submissionId: string;
  subjectEmployeeId: string;
  auth: {
    userId: string;
    orgId: string;
  };
  questions: WriteReviewQuestion[];
  initialStatus: ReviewSubmissionStatus;
}

interface EvidenceResponse {
  counts: Record<EvidenceType, number>;
  itemsByType: Record<EvidenceType, EvidenceSummary[]>;
  limitPerType: number;
}

type SaveState = "idle" | "saving" | "saved" | "error";
type EvidenceLoadState = "loading" | "loaded" | "error";

const evidenceTypeOrder: EvidenceType[] = [
  EvidenceType.FEEDBACK,
  EvidenceType.UPDATE,
  EvidenceType.ONE_ON_ONE,
  EvidenceType.GOAL,
  EvidenceType.VALUE_RECOGNITION,
];

const evidenceTypeLabel: Record<EvidenceType, string> = {
  FEEDBACK: "Feedback",
  UPDATE: "Updates",
  ONE_ON_ONE: "1:1s",
  GOAL: "Goals",
  VALUE_RECOGNITION: "Values",
};

export default function WriteReviewForm({
  cycleId,
  submissionId,
  subjectEmployeeId,
  auth,
  questions,
  initialStatus,
}: WriteReviewFormProps) {
  const [questionState, setQuestionState] = useState<WriteReviewQuestion[]>(questions);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(questions[0]?.id ?? null);
  const [dirtyQuestionId, setDirtyQuestionId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [status, setStatus] = useState<ReviewSubmissionStatus>(initialStatus);
  const [missingQuestionIds, setMissingQuestionIds] = useState<string[]>([]);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const questionInputRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const [evidenceCounts, setEvidenceCounts] = useState<Record<EvidenceType, number>>(
    createEmptyEvidenceCounts(),
  );
  const [evidenceItemsByType, setEvidenceItemsByType] = useState<
    Record<EvidenceType, EvidenceSummary[]>
  >(createEmptyEvidenceItemsByType());
  const [evidenceLimitPerType, setEvidenceLimitPerType] = useState(20);
  const [evidenceLoadState, setEvidenceLoadState] = useState<EvidenceLoadState>("loading");
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [selectedEvidenceType, setSelectedEvidenceType] = useState<EvidenceType>(
    EvidenceType.FEEDBACK,
  );
  const [evidenceMessage, setEvidenceMessage] = useState<string | null>(null);
  const [attachingEvidenceId, setAttachingEvidenceId] = useState<string | null>(null);
  const [detachingEvidenceKey, setDetachingEvidenceKey] = useState<string | null>(null);

  const isReadOnly = status === ReviewSubmissionStatus.SUBMITTED;

  const activeQuestion = useMemo(
    () => questionState.find((question) => question.id === activeQuestionId) ?? null,
    [activeQuestionId, questionState],
  );

  const selectedEvidenceItems = useMemo(
    () => evidenceItemsByType[selectedEvidenceType] ?? [],
    [evidenceItemsByType, selectedEvidenceType],
  );
  const requiredProgress = useMemo(() => {
    const requiredQuestions = questionState.filter((question) => question.isRequired);
    const answeredRequiredCount = requiredQuestions.filter(
      (question) => question.responseText.trim().length > 0,
    ).length;

    return {
      answered: answeredRequiredCount,
      total: requiredQuestions.length,
    };
  }, [questionState]);

  const loadEvidence = useCallback(async () => {
    setEvidenceLoadState("loading");
    setEvidenceError(null);

    try {
      const query = new URLSearchParams({
        subjectEmployeeId,
      });

      const response = await fetch(`/api/evidence?${query.toString()}`, {
        headers: {
          "x-user-id": auth.userId,
          "x-org-id": auth.orgId,
        },
      });

      const payload = (await response.json()) as Partial<EvidenceResponse> & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to load evidence");
      }

      setEvidenceCounts(normalizeEvidenceCounts(payload.counts));
      setEvidenceItemsByType(normalizeEvidenceItemsByType(payload.itemsByType));
      setEvidenceLimitPerType(
        typeof payload.limitPerType === "number" ? payload.limitPerType : evidenceLimitPerType,
      );
      setEvidenceLoadState("loaded");
    } catch (error) {
      setEvidenceError(error instanceof Error ? error.message : "Unable to load evidence");
      setEvidenceLoadState("error");
    }
  }, [auth.orgId, auth.userId, evidenceLimitPerType, subjectEmployeeId]);

  useEffect(() => {
    void loadEvidence();
  }, [loadEvidence]);

  useEffect(() => {
    if (!dirtyQuestionId || isReadOnly) {
      return;
    }

    const dirtyQuestion = questionState.find((question) => question.id === dirtyQuestionId);
    if (!dirtyQuestion) {
      return;
    }

    setSaveState("saving");

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/performance/reviews/${cycleId}/submissions/${submissionId}/answers`,
          {
            method: "PATCH",
            headers: {
              "content-type": "application/json",
              "x-user-id": auth.userId,
              "x-org-id": auth.orgId,
            },
            body: JSON.stringify({
              questionId: dirtyQuestion.id,
              responseText: dirtyQuestion.responseText,
            }),
          },
        );

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.message ?? "Unable to save answer");
        }

        setQuestionState((previous) =>
          previous.map((question) =>
            question.id === dirtyQuestion.id
              ? {
                  ...question,
                  answerId:
                    typeof payload.answerId === "string" && payload.answerId.length > 0
                      ? payload.answerId
                      : question.answerId,
                }
              : question,
          ),
        );

        if (payload.status && payload.status !== status) {
          setStatus(payload.status as ReviewSubmissionStatus);
        }

        setDirtyQuestionId(null);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 700);

    return () => clearTimeout(timeout);
  }, [auth.orgId, auth.userId, cycleId, dirtyQuestionId, isReadOnly, questionState, status, submissionId]);

  const saveLabel = useMemo(() => {
    if (isReadOnly) {
      return "Submitted";
    }

    if (saveState === "saving") {
      return "Saving...";
    }

    if (saveState === "saved") {
      return "Saved";
    }

    if (saveState === "error") {
      return "Save failed";
    }

    return "";
  }, [isReadOnly, saveState]);

  async function handleSubmit() {
    setSubmitMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/performance/reviews/${cycleId}/submissions/${submissionId}/submit`,
        {
          method: "POST",
          headers: {
            "x-user-id": auth.userId,
            "x-org-id": auth.orgId,
          },
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        if (
          payload?.code === "VALIDATION_ERROR" &&
          Array.isArray(payload?.details?.missingQuestionIds)
        ) {
          const missingIds = payload.details.missingQuestionIds.filter(
            (questionId: unknown): questionId is string =>
              typeof questionId === "string" && questionId.length > 0,
          );
          setMissingQuestionIds(missingIds);
          setSubmitMessage("Please complete all required questions before submitting.");

          const firstMissingQuestionId = missingIds[0];
          if (firstMissingQuestionId) {
            setActiveQuestionId(firstMissingQuestionId);

            requestAnimationFrame(() => {
              const firstMissingInput = questionInputRefs.current[firstMissingQuestionId];
              if (!firstMissingInput) {
                return;
              }

              firstMissingInput.scrollIntoView({ behavior: "smooth", block: "center" });
              firstMissingInput.focus();
            });
          }

          return;
        }

        throw new Error(payload?.message ?? "Submit failed");
      }

      setStatus(payload.status as ReviewSubmissionStatus);
      setMissingQuestionIds([]);
      setSubmitMessage("Review submitted successfully. This submission is now read-only.");
      setSaveState("saved");
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : "Submit failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAttachEvidence(evidenceItem: EvidenceSummary) {
    if (!activeQuestion) {
      return;
    }

    if (!activeQuestion.answerId) {
      setEvidenceMessage("Type in the selected answer and wait for autosave before attaching evidence.");
      return;
    }

    setEvidenceMessage(null);
    setAttachingEvidenceId(evidenceItem.evidenceItemId);

    try {
      const response = await fetch(
        `/api/review-answers/${activeQuestion.answerId}/evidence-links`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-user-id": auth.userId,
            "x-org-id": auth.orgId,
          },
          body: JSON.stringify({
            evidenceItemId: evidenceItem.evidenceItemId,
          }),
        },
      );

      const payload = (await response.json()) as {
        evidence?: EvidenceSummary;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to attach evidence");
      }

      if (payload.evidence) {
        const attachedEvidence = payload.evidence;

        setQuestionState((previous) =>
          previous.map((question) => {
            if (question.id !== activeQuestion.id) {
              return question;
            }

            const exists = question.attachedEvidence.some(
              (attached) => attached.evidenceItemId === attachedEvidence.evidenceItemId,
            );

            return exists
              ? question
              : {
                  ...question,
                  attachedEvidence: [...question.attachedEvidence, attachedEvidence],
                };
          }),
        );
      }

      setEvidenceMessage("Evidence attached to the selected answer.");
    } catch (error) {
      setEvidenceMessage(error instanceof Error ? error.message : "Unable to attach evidence");
    } finally {
      setAttachingEvidenceId(null);
    }
  }

  async function handleDetachEvidence(questionId: string, evidenceItemId: string) {
    const question = questionState.find((entry) => entry.id === questionId);
    if (!question?.answerId) {
      return;
    }

    const key = `${questionId}:${evidenceItemId}`;
    setDetachingEvidenceKey(key);

    try {
      const response = await fetch(
        `/api/review-answers/${question.answerId}/evidence-links/${evidenceItemId}`,
        {
          method: "DELETE",
          headers: {
            "x-user-id": auth.userId,
            "x-org-id": auth.orgId,
          },
        },
      );

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to remove evidence");
      }

      setQuestionState((previous) =>
        previous.map((entry) =>
          entry.id === questionId
            ? {
                ...entry,
                attachedEvidence: entry.attachedEvidence.filter(
                  (evidence) => evidence.evidenceItemId !== evidenceItemId,
                ),
              }
            : entry,
        ),
      );
      setEvidenceMessage("Evidence removed from answer.");
    } catch (error) {
      setEvidenceMessage(error instanceof Error ? error.message : "Unable to remove evidence");
    } finally {
      setDetachingEvidenceKey(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Write Review</h2>
            <p className="mt-1 text-sm text-slate-600">
              Required progress: {requiredProgress.answered}/{requiredProgress.total} answered
            </p>
          </div>
          <div className="text-sm font-medium text-slate-600">{saveLabel}</div>
        </div>

        <div className="space-y-5">
          {questionState.map((question, index) => {
            const isMissing = missingQuestionIds.includes(question.id);
            const isActive = activeQuestionId === question.id;

            return (
              <div
                key={question.id}
                className={`space-y-2 rounded-lg border p-4 ${
                  isActive ? "border-slate-400 bg-slate-50" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-sm font-semibold text-slate-800" htmlFor={question.id}>
                    {index + 1}. {question.prompt}
                    {question.isRequired ? <span className="ml-1 text-rose-700">*</span> : null}
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveQuestionId(question.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "border border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    {isActive ? "Selected for Evidence" : "Attach Evidence Here"}
                  </button>
                </div>

                <textarea
                  id={question.id}
                  ref={(element) => {
                    questionInputRefs.current[question.id] = element;
                  }}
                  value={question.responseText}
                  onFocus={() => setActiveQuestionId(question.id)}
                  onChange={(event) => {
                    const nextValue = event.target.value;

                    setQuestionState((previous) =>
                      previous.map((entry) =>
                        entry.id === question.id
                          ? {
                              ...entry,
                              responseText: nextValue,
                            }
                          : entry,
                      ),
                    );
                    setDirtyQuestionId(question.id);
                    setMissingQuestionIds((previous) =>
                      previous.filter((missingId) => missingId !== question.id),
                    );
                  }}
                  rows={5}
                  readOnly={isReadOnly}
                  aria-invalid={isMissing}
                  aria-describedby={isMissing ? `${question.id}-error` : undefined}
                  className={`w-full rounded-md border px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-slate-300 ${
                    isMissing ? "border-rose-400 bg-rose-50" : "border-slate-300"
                  } ${isReadOnly ? "bg-slate-100 text-slate-500" : "bg-white"}`}
                  placeholder="Write your answer"
                />

                {isMissing ? (
                  <p id={`${question.id}-error`} className="text-xs font-medium text-rose-700">
                    This required question is missing an answer.
                  </p>
                ) : null}

                {question.attachedEvidence.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {question.attachedEvidence.map((evidence) => {
                      const removeKey = `${question.id}:${evidence.evidenceItemId}`;

                      return (
                        <span
                          key={evidence.evidenceItemId}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs"
                        >
                          <span>{evidence.title}</span>
                          {!isReadOnly ? (
                            <button
                              type="button"
                              onClick={() =>
                                void handleDetachEvidence(question.id, evidence.evidenceItemId)
                              }
                              disabled={detachingEvidenceKey === removeKey}
                              className="font-semibold text-slate-700 hover:text-rose-700 disabled:opacity-50"
                            >
                              {detachingEvidenceKey === removeKey ? "Removing..." : "Remove"}
                            </button>
                          ) : null}
                        </span>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isReadOnly || isSubmitting}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isReadOnly ? "Submitted" : isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
          {submitMessage ? <p className="text-sm text-slate-700">{submitMessage}</p> : null}
        </div>
      </section>

      <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Evidence Context</h2>
        <p className="mt-1 text-xs text-slate-500">
          Select an answer and attach evidence items to support your review.
        </p>

        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected Answer</p>
          <p className="mt-1 text-sm text-slate-700">
            {activeQuestion ? activeQuestion.prompt : "Select an answer to attach evidence."}
          </p>
          {!activeQuestion?.answerId ? (
            <p className="mt-1 text-xs text-amber-700">
              Type in this answer and wait for autosave before attaching evidence.
            </p>
          ) : null}
        </div>

        {evidenceLoadState === "loading" ? (
          <div className="mt-4 space-y-3" aria-busy="true">
            <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-28 w-full animate-pulse rounded bg-slate-200" />
          </div>
        ) : null}

        {evidenceLoadState === "error" ? (
          <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <p>{evidenceError ?? "Unable to load evidence."}</p>
            <button
              type="button"
              onClick={() => void loadEvidence()}
              className="mt-2 rounded bg-rose-700 px-3 py-1 text-xs font-semibold text-white"
            >
              Retry
            </button>
          </div>
        ) : null}

        {evidenceLoadState === "loaded" ? (
          <div className="mt-4 space-y-4">
            <dl className="space-y-2">
              {evidenceTypeOrder.map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setSelectedEvidenceType(type)}
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left ${
                    selectedEvidenceType === type
                      ? "border-slate-800 bg-slate-100"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <dt className="text-sm text-slate-700">{evidenceTypeLabel[type]}</dt>
                  <dd className="text-sm font-semibold text-slate-900">{evidenceCounts[type] ?? 0}</dd>
                </button>
              ))}
            </dl>

            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  {evidenceTypeLabel[selectedEvidenceType]} Details
                </h3>
                <span className="text-xs text-slate-500">Max {evidenceLimitPerType}</span>
              </div>

              {selectedEvidenceItems.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                  No evidence items available for this type.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedEvidenceItems.map((item) => {
                    const isAttaching = attachingEvidenceId === item.evidenceItemId;

                    return (
                      <article key={item.evidenceItemId} className="rounded-md border border-slate-200 p-3">
                        <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                        <p className="mt-1 text-xs text-slate-600">{item.summary}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span>{new Date(item.occurredAt).toLocaleDateString()}</span>
                          <span>Source: {evidenceTypeLabel[item.type]}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleAttachEvidence(item)}
                          disabled={isReadOnly || !activeQuestion?.answerId || isAttaching}
                          className="mt-2 rounded bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          {isAttaching ? "Attaching..." : "Attach to This Answer"}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}

              {evidenceMessage ? <p className="mt-2 text-xs text-slate-700">{evidenceMessage}</p> : null}
            </section>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function createEmptyEvidenceCounts(): Record<EvidenceType, number> {
  return {
    [EvidenceType.FEEDBACK]: 0,
    [EvidenceType.UPDATE]: 0,
    [EvidenceType.ONE_ON_ONE]: 0,
    [EvidenceType.GOAL]: 0,
    [EvidenceType.VALUE_RECOGNITION]: 0,
  };
}

function createEmptyEvidenceItemsByType(): Record<EvidenceType, EvidenceSummary[]> {
  return {
    [EvidenceType.FEEDBACK]: [],
    [EvidenceType.UPDATE]: [],
    [EvidenceType.ONE_ON_ONE]: [],
    [EvidenceType.GOAL]: [],
    [EvidenceType.VALUE_RECOGNITION]: [],
  };
}

function normalizeEvidenceCounts(
  counts: Partial<Record<EvidenceType, number>> | undefined,
): Record<EvidenceType, number> {
  return {
    ...createEmptyEvidenceCounts(),
    ...(counts ?? {}),
  };
}

function normalizeEvidenceItemsByType(
  itemsByType: Partial<Record<EvidenceType, EvidenceSummary[]>> | undefined,
): Record<EvidenceType, EvidenceSummary[]> {
  return {
    ...createEmptyEvidenceItemsByType(),
    ...(itemsByType ?? {}),
  };
}
