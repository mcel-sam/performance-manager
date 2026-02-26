"use client";

import { ReviewSubmissionStatus } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";

interface WriteReviewQuestion {
  id: string;
  prompt: string;
  isRequired: boolean;
  responseText: string;
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
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function WriteReviewForm({
  cycleId,
  submissionId,
  auth,
  questions,
  initialStatus,
}: WriteReviewFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(questions.map((question) => [question.id, question.responseText])),
  );
  const [dirtyQuestionId, setDirtyQuestionId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [status, setStatus] = useState<ReviewSubmissionStatus>(initialStatus);
  const [missingQuestionIds, setMissingQuestionIds] = useState<string[]>([]);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isReadOnly = status === ReviewSubmissionStatus.SUBMITTED;

  useEffect(() => {
    if (!dirtyQuestionId || isReadOnly) {
      return;
    }

    const questionId = dirtyQuestionId;
    const responseText = answers[questionId] ?? "";

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
              questionId,
              responseText,
            }),
          },
        );

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.message ?? "Unable to save answer");
        }

        if (payload.status && payload.status !== status) {
          setStatus(payload.status as ReviewSubmissionStatus);
        }

        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 700);

    return () => clearTimeout(timeout);
  }, [answers, auth.orgId, auth.userId, cycleId, dirtyQuestionId, isReadOnly, status, submissionId]);

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
          setMissingQuestionIds(payload.details.missingQuestionIds);
          setSubmitMessage("Please complete all required questions before submitting.");
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
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Write Review</h2>
        <div className="text-sm font-medium text-slate-600">{saveLabel}</div>
      </div>

      <div className="space-y-5">
        {questions.map((question, index) => {
          const isMissing = missingQuestionIds.includes(question.id);

          return (
            <div key={question.id} className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800" htmlFor={question.id}>
                {index + 1}. {question.prompt}
                {question.isRequired ? <span className="ml-1 text-rose-700">*</span> : null}
              </label>
              <textarea
                id={question.id}
                value={answers[question.id] ?? ""}
                onChange={(event) => {
                  const nextValue = event.target.value;

                  setAnswers((previous) => ({
                    ...previous,
                    [question.id]: nextValue,
                  }));
                  setDirtyQuestionId(question.id);
                  setMissingQuestionIds((previous) =>
                    previous.filter((missingId) => missingId !== question.id),
                  );
                }}
                rows={5}
                readOnly={isReadOnly}
                className={`w-full rounded-md border px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-slate-300 ${
                  isMissing ? "border-rose-400 bg-rose-50" : "border-slate-300"
                } ${isReadOnly ? "bg-slate-100 text-slate-500" : "bg-white"}`}
                placeholder="Write your answer"
              />
              {isMissing ? (
                <p className="text-xs font-medium text-rose-700">This question is required.</p>
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
  );
}
