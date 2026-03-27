"use client";

import Link from "next/link";
import {
  CompetencyDimensionKey,
  ReviewQuestionType,
  ReviewSubmissionStatus,
} from "@prisma/client";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip, getReviewStatusTone } from "@/components/ui/status-chip";
import { Textarea } from "@/components/ui/textarea";
import { Toast } from "@/components/ui/toast";

interface WriteReviewQuestion {
  id: string;
  prompt: string;
  questionType: ReviewQuestionType;
  dimensionKey: CompetencyDimensionKey | null;
  isRequired: boolean;
  answerId: string | null;
  responseText: string;
  scaleRating: number | null;
  notObserved: boolean;
}

interface ManagerReviewAssignment {
  id: string;
  subjectName: string;
  status: ReviewSubmissionStatus;
  href: string;
  isCurrent: boolean;
}

interface WriteReviewFormProps {
  cycleId: string;
  submissionId: string;
  auth: {
    userId: string;
    orgId: string;
  };
  questions: WriteReviewQuestion[];
  initialStatus: ReviewSubmissionStatus;
  submissionContext: {
    cycleName: string;
    subjectName: string;
    subjectDepartment: string | null;
    subjectTitle: string | null;
    reviewerName: string;
    relationship: string;
  };
  managerReviewAssignments?: ManagerReviewAssignment[];
}

type SaveState = "idle" | "saving" | "saved" | "error";

const scaleOptions = [
  { value: 1, label: "1", description: "Unsatisfactory" },
  { value: 2, label: "2", description: "Needs improvement" },
  { value: 3, label: "3", description: "Meets expectations" },
  { value: 4, label: "4", description: "Exceeds expectations" },
  { value: 5, label: "5", description: "Exceptional" },
] as const;

export default function WriteReviewForm({
  cycleId,
  submissionId,
  auth,
  questions,
  initialStatus,
  submissionContext,
  managerReviewAssignments = [],
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

  const isReadOnly = status === ReviewSubmissionStatus.SUBMITTED;
  const activeQuestion = useMemo(
    () => questionState.find((question) => question.id === activeQuestionId) ?? null,
    [activeQuestionId, questionState],
  );
  const requiredProgress = useMemo(() => {
    const requiredQuestions = questionState.filter((question) => question.isRequired);
    const answeredRequiredCount = requiredQuestions.filter((question) => isQuestionAnswered(question)).length;

    return {
      answered: answeredRequiredCount,
      total: requiredQuestions.length,
    };
  }, [questionState]);

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
              scaleRating:
                dirtyQuestion.questionType === ReviewQuestionType.SCALE_1_TO_5
                  ? dirtyQuestion.scaleRating
                  : null,
              notObserved:
                dirtyQuestion.questionType === ReviewQuestionType.SCALE_1_TO_5
                  ? dirtyQuestion.notObserved
                  : false,
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

    return "Draft";
  }, [isReadOnly, saveState]);

  function focusQuestionInput(questionId: string) {
    setActiveQuestionId(questionId);

    setTimeout(() => {
      const input = questionInputRefs.current[questionId];
      if (!input) {
        return;
      }

      input.scrollIntoView({ behavior: "smooth", block: "center" });
      input.focus();
    }, 0);
  }

  function updateQuestion(
    questionId: string,
    update: Partial<Pick<WriteReviewQuestion, "responseText" | "scaleRating" | "notObserved">>,
  ) {
    setQuestionState((previous) =>
      previous.map((entry) =>
        entry.id === questionId
          ? {
              ...entry,
              ...update,
            }
          : entry,
      ),
    );
    setDirtyQuestionId(questionId);
    setMissingQuestionIds((previous) => previous.filter((missingId) => missingId !== questionId));
    setActiveQuestionId(questionId);
  }

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
            focusQuestionInput(firstMissingQuestionId);
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

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">Review progress</CardTitle>
            <CardDescription>
              {requiredProgress.answered}/{requiredProgress.total} required questions answered
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {questionState.map((question, index) => {
              const isActive = question.id === activeQuestionId;
              const isAnswered = isQuestionAnswered(question);
              const isMissing = missingQuestionIds.includes(question.id);

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => focusQuestionInput(question.id)}
                  className={cn(
                    "w-full rounded-[18px] border px-4 py-3 text-left transition-[border-color,background-color,box-shadow] duration-150",
                    isActive
                      ? "border-[color-mix(in_srgb,var(--brand-primary)_30%,white)] bg-[color-mix(in_srgb,var(--brand-primary)_5%,white)] shadow-[var(--shadow-xs)]"
                      : "border-[var(--color-shell-border)] bg-[var(--color-surface-default)] hover:border-[var(--color-focus-border)] hover:bg-[var(--color-shell-surface-muted)]",
                    isMissing && "border-[var(--color-status-danger-border)] bg-[var(--color-status-danger-surface)]",
                  )}
                  data-testid={`write-review-question-nav-${index + 1}`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        isActive
                          ? "bg-[var(--brand-primary)] text-white"
                          : "bg-[var(--color-shell-surface-muted)] text-[var(--color-text-primary)]",
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[var(--color-text-primary)]">
                        {truncatePrompt(question.prompt)}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                        <span>{question.questionType === ReviewQuestionType.SCALE_1_TO_5 ? "Rating + comment" : "Written response"}</span>
                        <span aria-hidden="true">•</span>
                        <span>{isAnswered ? "Complete" : question.isRequired ? "Required" : "Optional"}</span>
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {managerReviewAssignments.length > 0 ? (
          <Card>
            <CardHeader className="space-y-2">
              <CardTitle className="text-base">Direct reports</CardTitle>
              <CardDescription>Switch between assigned manager reviews in this cycle.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {managerReviewAssignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  href={assignment.href}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-[16px] border px-3 py-3 text-left transition-[border-color,background-color] duration-150",
                    assignment.isCurrent
                      ? "border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_5%,white)]"
                      : "border-[var(--color-shell-border)] bg-[var(--color-surface-default)] hover:border-[var(--color-focus-border)] hover:bg-[var(--color-shell-surface-muted)]",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[var(--color-text-primary)]">
                      {assignment.subjectName}
                    </span>
                    <span className="mt-1 block text-xs text-[var(--color-text-muted)]">
                      {assignment.isCurrent ? "Open now" : "Open review"}
                    </span>
                  </span>
                  <StatusChip tone={getReviewStatusTone(assignment.status)}>
                    {formatSubmissionStatus(assignment.status)}
                  </StatusChip>
                </Link>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </aside>

      <div className="space-y-6">
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <CardTitle>{submissionContext.subjectName}</CardTitle>
                <CardDescription>
                  {[
                    submissionContext.relationship,
                    submissionContext.subjectTitle,
                    submissionContext.subjectDepartment,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </CardDescription>
              </div>
              <div className="text-right">
                <p
                  className="text-sm font-medium text-[var(--color-text-primary)]"
                  data-testid="write-review-save-state"
                >
                  {saveLabel}
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {submissionContext.cycleName}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {submitMessage ? (
          <Toast variant={status === ReviewSubmissionStatus.SUBMITTED ? "success" : "info"}>
            {submitMessage}
          </Toast>
        ) : null}

        {questionState.length === 0 ? (
          <EmptyState
            title="No questions assigned"
            description="This submission has no template questions yet."
          />
        ) : (
          <div className="space-y-5">
            {questionState.map((question, index) => {
              const isActive = question.id === activeQuestionId;
              const isMissing = missingQuestionIds.includes(question.id);

              return (
                <section
                  key={question.id}
                  className={cn(
                    "scroll-mt-24 rounded-[24px] border bg-[var(--color-surface-default)] p-5 shadow-[var(--shadow-xs)] transition-[border-color,box-shadow] duration-150 sm:p-6",
                    isActive
                      ? "border-[color-mix(in_srgb,var(--brand-primary)_28%,white)] shadow-[var(--shadow-sm)]"
                      : "border-[var(--color-shell-border)]",
                    isMissing && "border-[var(--color-status-danger-border)]",
                  )}
                >
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                            Question {index + 1}
                          </span>
                          {question.dimensionKey ? (
                            <span className="rounded-full border border-[color-mix(in_srgb,var(--brand-primary)_16%,white)] bg-[color-mix(in_srgb,var(--brand-primary)_7%,white)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">
                              {formatDimensionLabel(question.dimensionKey)}
                            </span>
                          ) : null}
                          <span className="rounded-full border border-[var(--color-shell-border)] bg-[var(--color-surface-default)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                            {question.questionType === ReviewQuestionType.SCALE_1_TO_5 ? "Rating + comment" : "Written response"}
                          </span>
                        </div>
                        <label
                          className="block max-w-4xl text-[1.05rem] font-semibold leading-8 text-[var(--color-text-primary)]"
                          htmlFor={question.id}
                        >
                          {question.prompt}
                          {question.isRequired ? <span className="ml-1 text-[var(--color-status-danger)]">*</span> : null}
                        </label>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant={isActive ? "primary" : "outline"}
                        onClick={() => focusQuestionInput(question.id)}
                      >
                        {isActive ? "Writing now" : "Focus"}
                      </Button>
                    </div>

                    {question.questionType === ReviewQuestionType.SCALE_1_TO_5 ? (
                      <div className="space-y-4 rounded-[20px] border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] p-4">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                              Rating
                            </span>
                            <div
                              role="radiogroup"
                              aria-label={`Rating for ${question.prompt}`}
                              className="grid grid-cols-5 gap-2"
                            >
                              {scaleOptions.map((option) => {
                                const isSelected =
                                  !question.notObserved && question.scaleRating === option.value;

                                return (
                                  <button
                                    key={`${question.id}-${option.value}`}
                                    type="button"
                                    role="radio"
                                    aria-checked={isSelected}
                                    data-testid={`write-review-scale-${question.id}-${option.value}`}
                                    disabled={isReadOnly || question.notObserved}
                                    onClick={() =>
                                      updateQuestion(question.id, {
                                        scaleRating: option.value,
                                        notObserved: false,
                                      })
                                    }
                                    className={cn(
                                      "rounded-[16px] border px-3 py-3 text-center transition-[border-color,background-color,color,box-shadow] duration-150",
                                      isSelected
                                        ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white shadow-[var(--shadow-xs)]"
                                        : "border-[var(--color-shell-border)] bg-[var(--color-surface-default)] text-[var(--color-text-primary)] hover:border-[var(--color-focus-border)] hover:bg-[var(--color-shell-surface-muted)]",
                                    )}
                                  >
                                    <span className="block text-base font-semibold">{option.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                            <div className="grid grid-cols-5 gap-2 text-center text-[11px] leading-4 text-[var(--color-text-muted)]">
                              {scaleOptions.map((option) => (
                                <span key={`${question.id}-${option.value}-label`}>{option.description}</span>
                              ))}
                            </div>
                          </div>

                          <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                            <input
                              data-testid={`write-review-not-observed-${question.id}`}
                              type="checkbox"
                              className="h-4 w-4 rounded border-[var(--color-border-default)]"
                              checked={question.notObserved}
                              disabled={isReadOnly}
                              onChange={(event) => {
                                const checked = event.target.checked;

                                updateQuestion(question.id, {
                                  notObserved: checked,
                                  scaleRating: checked ? null : question.scaleRating,
                                });
                              }}
                            />
                            Not observed
                          </label>
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-3 rounded-[20px] border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {question.questionType === ReviewQuestionType.SCALE_1_TO_5 ? "Comment" : "Response"}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Plain text. Line breaks are preserved.
                        </p>
                      </div>

                      <Textarea
                        id={question.id}
                        data-testid={`write-review-answer-${question.id}`}
                        ref={(element) => {
                          questionInputRefs.current[question.id] = element;
                        }}
                        value={question.responseText}
                        onFocus={() => setActiveQuestionId(question.id)}
                        onChange={(event) => {
                          updateQuestion(question.id, {
                            responseText: event.target.value,
                          });
                        }}
                        rows={8}
                        readOnly={isReadOnly}
                        aria-invalid={isMissing}
                        aria-describedby={isMissing ? `${question.id}-error` : undefined}
                        className={cn(
                          "min-h-[220px] resize-y rounded-[18px] border-0 bg-[var(--color-surface-default)] px-5 py-4 text-[15px] leading-7 shadow-none focus:ring-0",
                          isMissing && "bg-[var(--color-status-danger-surface)]",
                          isReadOnly && "bg-[var(--color-shell-surface-muted)] text-[var(--color-text-muted)]",
                        )}
                        placeholder={
                          question.questionType === ReviewQuestionType.SCALE_1_TO_5
                            ? "Explain the rating with specific examples, outcomes, and context."
                            : "Write a clear response with specific examples and outcomes."
                        }
                      />
                    </div>

                    {isMissing ? (
                      <p id={`${question.id}-error`} className="text-sm font-medium text-[var(--color-status-danger)]">
                        This required question still needs an answer.
                      </p>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {requiredProgress.answered}/{requiredProgress.total} required questions complete
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Autosave keeps your draft current until you submit.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isReadOnly || isSubmitting}
              data-testid="write-review-submit"
            >
              {isReadOnly ? "Submitted" : isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatDimensionLabel(value: CompetencyDimensionKey): string {
  return value
    .split("_")
    .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
    .join(" ");
}

function truncatePrompt(prompt: string): string {
  if (prompt.length <= 64) {
    return prompt;
  }

  return `${prompt.slice(0, 61).trimEnd()}...`;
}

function formatSubmissionStatus(status: ReviewSubmissionStatus): string {
  switch (status) {
    case ReviewSubmissionStatus.NOT_STARTED:
      return "Not started";
    case ReviewSubmissionStatus.IN_PROGRESS:
      return "In progress";
    case ReviewSubmissionStatus.SUBMITTED:
      return "Submitted";
    case ReviewSubmissionStatus.RETURNED:
      return "Returned";
    default:
      return status;
  }
}

function isQuestionAnswered(question: WriteReviewQuestion): boolean {
  if (question.responseText.trim().length === 0) {
    return false;
  }

  if (question.questionType !== ReviewQuestionType.SCALE_1_TO_5) {
    return true;
  }

  return question.notObserved || question.scaleRating != null;
}
