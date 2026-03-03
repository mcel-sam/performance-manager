"use client";

import { EvidenceType, ReviewQuestionType, ReviewSubmissionStatus } from "@prisma/client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SectionHeader } from "@/components/layout/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { HelpHint } from "@/components/ui/help-hint";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toast } from "@/components/ui/toast";

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
  questionType: ReviewQuestionType;
  dimensionKey: string | null;
  isRequired: boolean;
  answerId: string | null;
  responseText: string;
  scaleRating: number | null;
  notObserved: boolean;
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
  submissionContext: {
    cycleName: string;
    subjectName: string;
    reviewerName: string;
    relationship: string;
    packetHref: string;
  };
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
  submissionContext,
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
  const [evidenceSearch, setEvidenceSearch] = useState("");
  const [showContextDetails, setShowContextDetails] = useState(false);
  const [showSelectedAnswerDetails, setShowSelectedAnswerDetails] = useState(false);
  const [evidenceMessage, setEvidenceMessage] = useState<string | null>(null);
  const [attachingEvidenceId, setAttachingEvidenceId] = useState<string | null>(null);
  const [detachingEvidenceKey, setDetachingEvidenceKey] = useState<string | null>(null);

  const isReadOnly = status === ReviewSubmissionStatus.SUBMITTED;

  const activeQuestion = useMemo(
    () => questionState.find((question) => question.id === activeQuestionId) ?? null,
    [activeQuestionId, questionState],
  );

  const sections = useMemo(() => {
    const chunkSize = 4;
    const nextSections: Array<{ id: string; title: string; questionIds: string[] }> = [];

    for (let index = 0; index < questionState.length; index += chunkSize) {
      const slice = questionState.slice(index, index + chunkSize);
      const dimensionLabels = Array.from(
        new Set(
          slice
            .map((question) => question.dimensionKey)
            .filter((dimension): dimension is string => Boolean(dimension))
            .map((dimension) => formatDimensionKey(dimension)),
        ),
      );

      nextSections.push({
        id: `section-${nextSections.length + 1}`,
        title:
          dimensionLabels.length === 1
            ? dimensionLabels[0]
            : `Section ${nextSections.length + 1}`,
        questionIds: slice.map((question) => question.id),
      });
    }

    return nextSections;
  }, [questionState]);

  const [activeSectionId, setActiveSectionId] = useState<string>(sections[0]?.id ?? "section-1");

  const activeSectionIndex = useMemo(
    () => sections.findIndex((section) => section.id === activeSectionId),
    [activeSectionId, sections],
  );

  const activeSection = activeSectionIndex >= 0 ? sections[activeSectionIndex] : sections[0] ?? null;
  const activeSectionQuestionIds = useMemo(
    () => activeSection?.questionIds ?? [],
    [activeSection],
  );
  const activeSectionQuestions = useMemo(
    () =>
      questionState.filter((question) =>
        activeSectionQuestionIds.includes(question.id),
      ),
    [activeSectionQuestionIds, questionState],
  );

  const sectionByQuestionId = useMemo(() => {
    const map = new Map<string, string>();
    for (const section of sections) {
      for (const questionId of section.questionIds) {
        map.set(questionId, section.id);
      }
    }
    return map;
  }, [sections]);

  const selectedEvidenceItems = useMemo(
    () => evidenceItemsByType[selectedEvidenceType] ?? [],
    [evidenceItemsByType, selectedEvidenceType],
  );
  const filteredEvidenceItems = useMemo(() => {
    const normalizedQuery = evidenceSearch.trim().toLowerCase();
    if (!normalizedQuery) {
      return selectedEvidenceItems;
    }

    return selectedEvidenceItems.filter((item) => {
      const haystack = `${item.title} ${item.summary}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [evidenceSearch, selectedEvidenceItems]);

  const sectionProgress = useMemo(
    () =>
      sections.map((section) => {
        const sectionQuestions = questionState.filter((question) =>
          section.questionIds.includes(question.id),
        );
        const requiredQuestions = sectionQuestions.filter((question) => question.isRequired);
        const answeredRequiredCount = requiredQuestions.filter(
          (question) =>
            question.questionType === ReviewQuestionType.SCALE_1_TO_5
              ? question.responseText.trim().length > 0 &&
                (question.notObserved || question.scaleRating != null)
              : question.responseText.trim().length > 0,
        ).length;

        return {
          sectionId: section.id,
          answered: answeredRequiredCount,
          total: requiredQuestions.length,
        };
      }),
    [questionState, sections],
  );
  const requiredProgress = useMemo(() => {
    const requiredQuestions = questionState.filter((question) => question.isRequired);
    const answeredRequiredCount = requiredQuestions.filter(
      (question) =>
        question.questionType === ReviewQuestionType.SCALE_1_TO_5
          ? question.responseText.trim().length > 0 &&
            (question.notObserved || question.scaleRating != null)
          : question.responseText.trim().length > 0,
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
    setEvidenceSearch("");
  }, [selectedEvidenceType]);

  useEffect(() => {
    if (sections.length === 0) {
      return;
    }

    if (!sections.some((section) => section.id === activeSectionId)) {
      setActiveSectionId(sections[0].id);
    }
  }, [activeSectionId, sections]);

  useEffect(() => {
    if (activeSectionQuestionIds.length === 0) {
      return;
    }

    if (!activeQuestionId || !activeSectionQuestionIds.includes(activeQuestionId)) {
      setActiveQuestionId(activeSectionQuestionIds[0]);
    }
  }, [activeQuestionId, activeSectionQuestionIds]);

  useEffect(() => {
    setShowSelectedAnswerDetails(false);
  }, [activeQuestionId]);

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
            const nextSectionId = sectionByQuestionId.get(firstMissingQuestionId);
            if (nextSectionId) {
              setActiveSectionId(nextSectionId);
            }
            setActiveQuestionId(firstMissingQuestionId);

            setTimeout(() => {
              const firstMissingInput = questionInputRefs.current[firstMissingQuestionId];
              if (!firstMissingInput) {
                return;
              }

              firstMissingInput.scrollIntoView({ behavior: "smooth", block: "center" });
              firstMissingInput.focus();
            }, 0);
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

  function goToSection(index: number) {
    const nextSection = sections[index];
    if (!nextSection) {
      return;
    }

    setActiveSectionId(nextSection.id);
  }

  function goToNextSection() {
    if (activeSectionIndex < 0) {
      return;
    }

    goToSection(activeSectionIndex + 1);
  }

  function goToPreviousSection() {
    if (activeSectionIndex < 0) {
      return;
    }

    goToSection(activeSectionIndex - 1);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardHeader className="space-y-3">
          <SectionHeader
            title="Write Review"
            description={`Required progress: ${requiredProgress.answered}/${requiredProgress.total} answered`}
            action={
              <span
                className="text-sm font-medium text-slate-600"
                data-testid="write-review-save-state"
              >
                {saveLabel}
              </span>
            }
          />
          <HelpHint label="Submit guidance" buttonLabel="Toggle submit guidance">
            Submit is final for this phase. After submit, answers become read-only and packet
            visibility follows cycle policy.
          </HelpHint>
        </CardHeader>
        <CardContent className="space-y-5">
          {questionState.length === 0 ? (
            <EmptyState
              title="No questions assigned"
              description="This submission has no template questions yet."
            />
          ) : (
            <div className="space-y-5">
              <Card className="border-slate-200 bg-slate-50 shadow-none">
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">Section progress</p>
                    <p className="text-xs text-slate-600">
                      Section {activeSectionIndex + 1} of {sections.length}
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {sections.map((section, index) => {
                      const progress = sectionProgress.find(
                        (entry) => entry.sectionId === section.id,
                      );
                      const isActiveSection = section.id === activeSection?.id;

                      return (
                        <Button
                          key={section.id}
                          type="button"
                          variant={isActiveSection ? "primary" : "outline"}
                          className="justify-between"
                          data-testid={`write-review-section-${index + 1}`}
                          onClick={() => goToSection(index)}
                        >
                          <span>{section.title}</span>
                          <span className="text-xs">
                            {progress?.answered ?? 0}/{progress?.total ?? 0}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousSection}
                      disabled={activeSectionIndex <= 0}
                    >
                      Previous section
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      data-testid="write-review-next-section"
                      onClick={goToNextSection}
                      disabled={activeSectionIndex === -1 || activeSectionIndex >= sections.length - 1}
                    >
                      Next section
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {missingQuestionIds.some((questionId) =>
                activeSectionQuestionIds.includes(questionId),
              ) ? (
                <Toast variant="warning">
                  This section has required questions that still need answers.
                </Toast>
              ) : null}

              <ol className="space-y-5">
                {activeSectionQuestions.map((question, index) => {
                const isMissing = missingQuestionIds.includes(question.id);
                const isActive = activeQuestionId === question.id;

                return (
                  <li
                    key={question.id}
                    className={`space-y-3 rounded-[var(--radius-md)] border p-4 ${
                      isActive ? "border-slate-400 bg-slate-50" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="block text-sm font-semibold text-slate-800" htmlFor={question.id}>
                        {index + 1}. {question.prompt}
                        {question.isRequired ? <span className="ml-1 text-rose-700">*</span> : null}
                      </label>
                      <Button
                        type="button"
                        size="sm"
                        variant={isActive ? "primary" : "outline"}
                        onClick={() => setActiveQuestionId(question.id)}
                      >
                        {isActive ? "Selected for evidence" : "Attach evidence here"}
                      </Button>
                    </div>

                    {question.questionType === ReviewQuestionType.SCALE_1_TO_5 ? (
                      <div className="grid gap-3 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3 md:grid-cols-[220px_minmax(0,1fr)]">
                        <label className="space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Rating (1-5)
                          </span>
                          <Select
                            data-testid={`write-review-scale-${question.id}`}
                            value={
                              question.notObserved
                                ? ""
                                : question.scaleRating != null
                                  ? String(question.scaleRating)
                                  : ""
                            }
                            disabled={isReadOnly || question.notObserved}
                            onChange={(event) => {
                              const value = event.target.value;
                              const nextScaleRating = value ? Number(value) : null;

                              setQuestionState((previous) =>
                                previous.map((entry) =>
                                  entry.id === question.id
                                    ? {
                                        ...entry,
                                        scaleRating: Number.isNaN(nextScaleRating)
                                          ? null
                                          : nextScaleRating,
                                        notObserved: false,
                                      }
                                    : entry,
                                ),
                              );
                              setDirtyQuestionId(question.id);
                              setMissingQuestionIds((previous) =>
                                previous.filter((missingId) => missingId !== question.id),
                              );
                            }}
                          >
                            <option value="">Select a rating</option>
                            <option value="1">1 - Unsatisfactory</option>
                            <option value="2">2 - Needs Improvement</option>
                            <option value="3">3 - Meets</option>
                            <option value="4">4 - Exceeds</option>
                            <option value="5">5 - Exceptional</option>
                          </Select>
                        </label>

                        <label className="flex items-center gap-2 self-end text-sm text-slate-700">
                          <input
                            data-testid={`write-review-not-observed-${question.id}`}
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300"
                            checked={question.notObserved}
                            disabled={isReadOnly}
                            onChange={(event) => {
                              const checked = event.target.checked;

                              setQuestionState((previous) =>
                                previous.map((entry) =>
                                  entry.id === question.id
                                    ? {
                                        ...entry,
                                        notObserved: checked,
                                        scaleRating: checked ? null : entry.scaleRating,
                                      }
                                    : entry,
                                ),
                              );
                              setDirtyQuestionId(question.id);
                              setMissingQuestionIds((previous) =>
                                previous.filter((missingId) => missingId !== question.id),
                              );
                            }}
                          />
                          Not observed (exclude from scoring)
                        </label>
                      </div>
                    ) : null}

                    <Textarea
                      id={question.id}
                      data-testid={`write-review-answer-${question.id}`}
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
                      className={`${isMissing ? "border-rose-400 bg-rose-50" : ""} ${
                        isReadOnly ? "bg-slate-100 text-slate-500" : ""
                      }`}
                      placeholder={
                        question.questionType === ReviewQuestionType.SCALE_1_TO_5
                          ? "Add a short comment to support this rating"
                          : "Write your answer"
                      }
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
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-auto border-0 bg-transparent px-1 py-0 text-xs text-slate-700 shadow-none hover:bg-transparent hover:text-rose-700"
                                  onClick={() =>
                                    void handleDetachEvidence(question.id, evidence.evidenceItemId)
                                  }
                                  disabled={detachingEvidenceKey === removeKey}
                                >
                                  {detachingEvidenceKey === removeKey ? "Removing..." : "Remove"}
                                </Button>
                              ) : null}
                            </span>
                          );
                        })}
                      </div>
                    ) : null}
                  </li>
                );
                })}
              </ol>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isReadOnly || isSubmitting}
              data-testid="write-review-submit"
            >
              {isReadOnly ? "Submitted" : isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
            {submitMessage ? (
              <Toast variant={submitMessage.includes("success") ? "success" : "info"}>
                {submitMessage}
              </Toast>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Drawer
        title="Evidence"
        description="Attach supporting evidence without leaving this review."
      >
        <Card className="border-slate-200 shadow-none">
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Context</p>
              <p className="text-sm font-medium text-slate-900">{submissionContext.subjectName}</p>
              <p className="text-xs text-slate-600">
                {submissionContext.relationship} · {submissionContext.cycleName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {evidenceTypeOrder.map((type) => (
                <div
                  key={type}
                  className="rounded-[var(--radius-sm)] border border-slate-200 bg-slate-50 px-2 py-1"
                >
                  <span className="font-medium text-slate-700">{evidenceTypeLabel[type]}</span>
                  <span className="ml-1 text-slate-500">({evidenceCounts[type] ?? 0})</span>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="write-review-context-toggle"
              onClick={() => setShowContextDetails((value) => !value)}
            >
              {showContextDetails ? "Hide details" : "Show details"}
            </Button>

            {showContextDetails ? (
              <div className="space-y-3 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3">
                <dl className="space-y-1 text-sm text-slate-700">
                  <div>
                    <dt className="font-semibold text-slate-900">Cycle</dt>
                    <dd>{submissionContext.cycleName}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-900">Subject</dt>
                    <dd>{submissionContext.subjectName}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-900">Reviewer</dt>
                    <dd>{submissionContext.reviewerName}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-900">Relationship</dt>
                    <dd>{submissionContext.relationship}</dd>
                  </div>
                </dl>
                <Link href={submissionContext.packetHref}>
                  <Button variant="outline" size="sm">
                    Open packet view
                  </Button>
                </Link>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <HelpHint label="Evidence guidance" buttonLabel="Toggle evidence guidance">
          Include concrete evidence from feedback, updates, goals, and values recognition. You can
          only attach items visible to your role.
        </HelpHint>

        <Card className="border-slate-200 shadow-none">
          <CardContent className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected answer</p>
            <p className="text-sm text-slate-700">
              {activeQuestion
                ? truncateText(activeQuestion.prompt, 96)
                : "Select an answer to attach evidence."}
            </p>
            {activeQuestion ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="write-review-selected-answer-toggle"
                onClick={() => setShowSelectedAnswerDetails((value) => !value)}
              >
                {showSelectedAnswerDetails ? "Hide full prompt" : "Show full prompt"}
              </Button>
            ) : null}
            {activeQuestion && showSelectedAnswerDetails ? (
              <p className="rounded-[var(--radius-sm)] border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                {activeQuestion.prompt}
              </p>
            ) : null}
            {!activeQuestion?.answerId ? (
              <Toast variant="warning">
                Type in this answer and wait for autosave before attaching evidence.
              </Toast>
            ) : null}
          </CardContent>
        </Card>

        {evidenceLoadState === "loading" ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-9 rounded-[var(--radius-md)]" />
            <Skeleton className="h-9 rounded-[var(--radius-md)]" />
            <Skeleton className="h-32 rounded-[var(--radius-md)]" />
          </div>
        ) : null}

        {evidenceLoadState === "error" ? (
          <Toast variant="error">
            <div className="space-y-3">
              <p>{evidenceError ?? "Unable to load evidence."}</p>
              <Button type="button" size="sm" variant="danger" onClick={() => void loadEvidence()}>
                Retry
              </Button>
            </div>
          </Toast>
        ) : null}

        {evidenceLoadState === "loaded" ? (
          <div className="space-y-4">
            <Tabs
              ariaLabel="Evidence type tabs"
              value={selectedEvidenceType}
              onValueChange={(nextValue) => setSelectedEvidenceType(nextValue as EvidenceType)}
              tabs={evidenceTypeOrder.map((type) => ({
                value: type,
                label: `${evidenceTypeLabel[type]} (${evidenceCounts[type] ?? 0})`,
              }))}
            />

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  {evidenceTypeLabel[selectedEvidenceType]} details
                </h3>
                <span className="text-xs text-slate-500">Max {evidenceLimitPerType}</span>
              </div>

              <div className="space-y-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Search
                  </span>
                  <Input
                    data-testid="write-review-evidence-search"
                    value={evidenceSearch}
                    onChange={(event) => setEvidenceSearch(event.target.value)}
                    placeholder="Search title or summary"
                  />
                </label>
                <p className="text-xs text-slate-500">
                  Showing {filteredEvidenceItems.length} of {selectedEvidenceItems.length}
                </p>
              </div>

              {selectedEvidenceItems.length === 0 ? (
                <EmptyState
                  title="No evidence items"
                  description="No evidence items are available for this type."
                  className="p-4"
                />
              ) : filteredEvidenceItems.length === 0 ? (
                <EmptyState
                  title="No evidence matches"
                  description="Try a broader keyword or switch evidence type."
                  className="p-4"
                />
              ) : (
                <div className="space-y-2">
                  {filteredEvidenceItems.map((item) => {
                    const isAttaching = attachingEvidenceId === item.evidenceItemId;

                    return (
                      <Card key={item.evidenceItemId}>
                        <CardContent className="space-y-2.5">
                          <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                          <p className="text-xs text-slate-600">
                            {truncateText(item.summary, 160)}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                            <span>{new Date(item.occurredAt).toLocaleDateString()}</span>
                            <span>Source: {evidenceTypeLabel[item.type]}</span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void handleAttachEvidence(item)}
                            disabled={isReadOnly || !activeQuestion?.answerId || isAttaching}
                          >
                            {isAttaching ? "Attaching..." : "Attach to this answer"}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {evidenceMessage ? (
                <Toast variant={evidenceMessage.includes("Unable") ? "error" : "info"}>
                  {evidenceMessage}
                </Toast>
              ) : null}
            </section>
          </div>
        ) : null}
      </Drawer>
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

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}

function formatDimensionKey(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
