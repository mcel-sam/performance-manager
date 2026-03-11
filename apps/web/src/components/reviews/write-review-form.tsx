"use client";

import {
  CompetencyDimensionKey,
  EvidenceType,
  ReviewQuestionType,
  ReviewSubmissionStatus,
} from "@prisma/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SectionHeader } from "@/components/layout/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
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
  dimensionKey: CompetencyDimensionKey | null;
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
    subjectDepartment: string | null;
    subjectTitle: string | null;
    reviewerName: string;
    relationship: string;
  };
}

interface EvidenceResponse {
  counts: Record<EvidenceType, number>;
  itemsByType: Record<EvidenceType, EvidenceSummary[]>;
  limitPerType: number;
}

type SaveState = "idle" | "saving" | "saved" | "error";
type EvidenceLoadState = "loading" | "loaded" | "error";
type ReviewSectionKind =
  | "impact-results"
  | "competencies"
  | "growth-development"
  | "goals"
  | "additional"
  | "final-summary";

interface ReviewSection {
  id: string;
  title: string;
  subtitle: string;
  questionIds: string[];
  kind: ReviewSectionKind;
}

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
  VALUE_RECOGNITION: "Company values",
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
  const [evidenceMessage, setEvidenceMessage] = useState<string | null>(null);
  const [attachingEvidenceId, setAttachingEvidenceId] = useState<string | null>(null);
  const [detachingEvidenceKey, setDetachingEvidenceKey] = useState<string | null>(null);

  const isReadOnly = status === ReviewSubmissionStatus.SUBMITTED;

  const activeQuestion = useMemo(
    () => questionState.find((question) => question.id === activeQuestionId) ?? null,
    [activeQuestionId, questionState],
  );
  const questionById = useMemo(
    () => new Map(questionState.map((question) => [question.id, question])),
    [questionState],
  );

  const sections = useMemo(() => buildReviewSections(questionState), [questionState]);

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
    () => activeSectionQuestionIds.map((questionId) => questionById.get(questionId)).filter(isPresent),
    [activeSectionQuestionIds, questionById],
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
  const [sectionMessage, setSectionMessage] = useState<string | null>(null);

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
  const evidenceTotalCount = useMemo(
    () => evidenceTypeOrder.reduce((sum, type) => sum + (evidenceCounts[type] ?? 0), 0),
    [evidenceCounts],
  );
  const activeQuestionEvidenceCount = activeQuestion?.attachedEvidence.length ?? 0;

  const sectionProgress = useMemo(
    () =>
      sections.map((section) => {
        const sectionQuestions = section.questionIds.map((questionId) => questionById.get(questionId)).filter(isPresent);
        const requiredQuestions = sectionQuestions.filter((question) => question.isRequired);
        const answeredRequiredCount = requiredQuestions.filter((question) => isQuestionAnswered(question)).length;

        return {
          sectionId: section.id,
          answered: answeredRequiredCount,
          total: requiredQuestions.length,
          remaining: requiredQuestions.length - answeredRequiredCount,
        };
      }),
    [questionById, sections],
  );
  const requiredProgress = useMemo(() => {
    const requiredQuestions = questionState.filter((question) => question.isRequired);
    const answeredRequiredCount = requiredQuestions.filter((question) => isQuestionAnswered(question)).length;

    return {
      answered: answeredRequiredCount,
      total: requiredQuestions.length,
    };
  }, [questionState]);
  const sectionProgressById = useMemo(
    () => new Map(sectionProgress.map((entry) => [entry.sectionId, entry])),
    [sectionProgress],
  );
  const activeSectionProgress = activeSection ? sectionProgressById.get(activeSection.id) ?? null : null;
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
    if (!sectionMessage || !activeSection) {
      return;
    }

    const progress = sectionProgress.find((entry) => entry.sectionId === activeSection.id);
    if ((progress?.remaining ?? 0) === 0) {
      setSectionMessage(null);
    }
  }, [activeSection, sectionMessage, sectionProgress]);

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
          setSectionMessage(null);
          setSubmitMessage("Please complete all required questions before submitting.");

          const firstMissingQuestionId = missingIds[0];
          if (firstMissingQuestionId) {
            const nextSectionId = sectionByQuestionId.get(firstMissingQuestionId);
            if (nextSectionId) {
              setActiveSectionId(nextSectionId);
            }
            focusQuestionInput(firstMissingQuestionId);
          }

          return;
        }

        throw new Error(payload?.message ?? "Submit failed");
      }

      setStatus(payload.status as ReviewSubmissionStatus);
      setMissingQuestionIds([]);
      setSectionMessage(null);
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

  function goToSection(index: number) {
    const nextSection = sections[index];
    if (!nextSection) {
      return;
    }

    setSectionMessage(null);
    setActiveSectionId(nextSection.id);
  }

  function goToNextSection() {
    if (activeSectionIndex < 0) {
      return;
    }

    if (!isReadOnly) {
      const currentSection = sections[activeSectionIndex];
      if (currentSection) {
        const missingRequiredIds = currentSection.questionIds.filter((questionId) => {
          const question = questionById.get(questionId);
          return question?.isRequired ? !isQuestionAnswered(question) : false;
        });

        if (missingRequiredIds.length > 0) {
          setMissingQuestionIds((previous) =>
            Array.from(new Set([...previous, ...missingRequiredIds])),
          );
          setSectionMessage(
            `${missingRequiredIds.length} required response${missingRequiredIds.length === 1 ? "" : "s"} remaining in ${currentSection.title}.`,
          );
          focusQuestionInput(missingRequiredIds[0]);
          return;
        }
      }
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
    <div className="grid gap-6 xl:grid-cols-[248px_minmax(0,1fr)_336px] 2xl:grid-cols-[264px_minmax(0,1fr)_360px]">
      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start" data-testid="write-review-phase-rail">
        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-sm)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Review phases
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">
            Move section by section
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Required progress: {requiredProgress.answered}/{requiredProgress.total} answered.
          </p>

          <div className="mt-5 space-y-2.5">
            {sections.map((section, index) => {
              const progress = sectionProgressById.get(section.id);
              const isActiveSection = section.id === activeSection?.id;
              const progressLabel = getSectionProgressLabel(section, progress);

              return (
                <button
                  key={section.id}
                  type="button"
                  className={cn(
                    "w-full rounded-[18px] border px-4 py-3 text-left transition-[border-color,background-color,box-shadow] duration-150",
                    isActiveSection
                      ? "border-teal-300 bg-teal-50/70 shadow-[var(--shadow-xs)]"
                      : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white",
                  )}
                  data-testid={`write-review-section-${index + 1}`}
                  onClick={() => goToSection(index)}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        isActiveSection
                          ? "bg-[var(--brand-primary)] text-white"
                          : "bg-white text-slate-600",
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className="block text-sm font-semibold leading-5 text-slate-900">
                          {section.title}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                            isActiveSection
                              ? "bg-white text-teal-700"
                              : "bg-white text-slate-500",
                          )}
                          data-testid={`write-review-section-remaining-${index + 1}`}
                        >
                          {progressLabel}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        {section.subtitle}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="write-review-previous-section"
              onClick={goToPreviousSection}
              disabled={activeSectionIndex <= 0}
            >
              Previous
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-testid="write-review-next-section"
              onClick={goToNextSection}
              disabled={activeSectionIndex === -1 || activeSectionIndex >= sections.length - 1}
            >
              Next
            </Button>
          </div>
        </section>
      </aside>

      <Card className="overflow-hidden border-slate-200/90 bg-white">
        <CardHeader className="space-y-4 border-b border-slate-100 bg-white px-6 py-5 sm:px-7 sm:py-6">
          <SectionHeader
            title={activeSection?.title ?? "Review writing"}
            description={getSectionDescription(activeSection)}
            action={
              <div className="space-y-1 text-right">
                <span
                  className="block text-sm font-medium text-slate-600"
                  data-testid="write-review-save-state"
                >
                  {saveLabel || "Draft"}
                </span>
                <span
                  className="block text-xs text-slate-500"
                  data-testid="write-review-active-section-label"
                >
                  {activeSection ? `Current: ${activeSection.title}` : ""}
                </span>
              </div>
            }
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              Phase {Math.max(activeSectionIndex + 1, 1)} of {sections.length}
            </span>
            <span className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
              {getSectionProgressLabel(activeSection, activeSectionProgress)}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
              {activeSection?.subtitle ?? "No prompts"}
            </span>
          </div>
          <HelpHint label="Submission notes" buttonLabel="Toggle submission tips">
            <ul className="space-y-1">
              <li>Finish every required response in the active cycle template.</li>
              <li>Pause for autosave before leaving the page or attaching evidence.</li>
              <li>Submit only when the tone, examples, and outcomes reflect your final draft.</li>
            </ul>
          </HelpHint>
        </CardHeader>
        <CardContent className="space-y-6 bg-white px-6 py-6 sm:px-7">
          {questionState.length === 0 ? (
            <EmptyState
              title="No questions assigned"
              description="This submission has no template questions yet."
            />
          ) : (
            <div className="space-y-6">
              {sectionMessage ? <Toast variant="warning">{sectionMessage}</Toast> : null}

              {missingQuestionIds.some((questionId) =>
                activeSectionQuestionIds.includes(questionId),
              ) ? (
                <Toast variant="warning">
                  This section has required questions that still need answers.
                </Toast>
              ) : null}

              {activeSection?.kind === "final-summary" ? (
                <div
                  className="space-y-3 rounded-[22px] border border-slate-200 bg-slate-50/80 p-5"
                  data-testid="write-review-final-summary"
                >
                  <h3 className="text-base font-semibold text-slate-900">Final summary</h3>
                  <p className="text-sm leading-6 text-slate-700">
                    Confirm each phase before submitting this review.
                  </p>
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    {sectionProgress
                      .filter((entry) => entry.sectionId !== activeSection.id)
                      .map((entry) => {
                        const section = sections.find((candidate) => candidate.id === entry.sectionId);
                        if (!section || entry.total === 0) {
                          return null;
                        }

                        return (
                          <li key={entry.sectionId}>
                            {section.title}: {entry.remaining > 0 ? `${entry.remaining} required remaining` : "complete"}
                          </li>
                        );
                      })}
                  </ul>
                </div>
              ) : null}

              <ol className="space-y-6">
                {activeSectionQuestions.map((question, index) => {
                  const isMissing = missingQuestionIds.includes(question.id);
                  const isActive = activeQuestionId === question.id;

                  return (
                    <li
                      key={question.id}
                      className={cn(
                        "space-y-4 rounded-[24px] border bg-white p-5 transition-[border-color,box-shadow,background-color] duration-150 sm:p-6",
                        isActive
                          ? "border-teal-300 bg-teal-50/35 shadow-[var(--shadow-sm)] ring-1 ring-teal-100"
                          : "border-slate-200",
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 max-w-3xl space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {question.dimensionKey ? (
                              <span className="rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-teal-700">
                                {formatDimensionLabel(question.dimensionKey)}
                              </span>
                            ) : null}
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                              {question.questionType === ReviewQuestionType.SCALE_1_TO_5
                                ? "Competency rating"
                                : "Written response"}
                            </span>
                          </div>
                          <label
                            className="block text-[1.02rem] font-semibold leading-7 text-slate-900"
                            htmlFor={question.id}
                          >
                            {index + 1}. {question.prompt}
                            {question.isRequired ? <span className="ml-1 text-rose-700">*</span> : null}
                          </label>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant={isActive ? "primary" : "outline"}
                          className="shrink-0"
                          onClick={() => setActiveQuestionId(question.id)}
                        >
                          {isActive ? "Evidence target" : "Use in overview"}
                        </Button>
                      </div>

                      {question.questionType === ReviewQuestionType.SCALE_1_TO_5 ? (
                        <div className="grid gap-4 rounded-[18px] border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-[240px_minmax(0,1fr)]">
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
                        rows={6}
                        readOnly={isReadOnly}
                        aria-invalid={isMissing}
                        aria-describedby={isMissing ? `${question.id}-error` : undefined}
                        className={cn(
                          "min-h-[176px] rounded-[18px] border-slate-200 px-5 py-4 text-[15px] leading-7 shadow-none",
                          !isReadOnly && "focus:border-teal-300 focus:ring-teal-100",
                          isMissing && "border-rose-400 bg-rose-50",
                          isReadOnly && "bg-slate-100 text-slate-500",
                        )}
                        placeholder={
                          question.questionType === ReviewQuestionType.SCALE_1_TO_5
                            ? "Support the rating with specific examples, outcomes, and context"
                            : "Write a focused response with concrete outcomes and examples"
                        }
                      />

                      {isMissing ? (
                        <p id={`${question.id}-error`} className="text-sm font-medium text-rose-700">
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
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700"
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

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
            <div className="flex flex-wrap items-center gap-2">
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
                variant="outline"
                size="sm"
                onClick={goToNextSection}
                disabled={activeSectionIndex === -1 || activeSectionIndex >= sections.length - 1}
              >
                Next section
              </Button>
            </div>

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
          </div>
        </CardContent>
      </Card>

      <Drawer
        title="Evidence"
        description="Attach supporting evidence without leaving the review."
        className="xl:sticky xl:top-6"
      >
        <section
          className="space-y-4 rounded-[20px] border border-slate-200 bg-slate-50/80 p-5"
          data-testid="write-review-evidence-overview"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Evidence workspace
              </p>
              <h3 className="text-base font-semibold text-slate-900">
                {submissionContext.subjectName}
              </h3>
              <p className="text-sm text-slate-600">
                {submissionContext.subjectTitle ?? "Role not set"} · {submissionContext.relationship}
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
              {evidenceTotalCount} items available
            </span>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[var(--radius-md)] border border-white bg-white p-4 shadow-[var(--shadow-xs)]" data-testid="write-review-context-card">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Current context
              </p>
              <dl className="mt-3 space-y-3 text-sm text-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <dt className="font-medium text-slate-500">Role</dt>
                  <dd className="text-right text-slate-900">
                    {submissionContext.subjectTitle ?? "Not set"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="font-medium text-slate-500">Department</dt>
                  <dd className="text-right text-slate-900">
                    {submissionContext.subjectDepartment ?? "Not set"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="font-medium text-slate-500">Current phase</dt>
                  <dd className="text-right text-slate-900">
                    {activeSection?.title ?? "No phase selected"}
                  </dd>
                </div>
              </dl>
            </div>

            <div
              className="rounded-[var(--radius-md)] border border-white bg-white p-4 shadow-[var(--shadow-xs)]"
              data-testid="write-review-evidence-target"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Attach to
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {activeQuestion ? activeSection?.title ?? "Current prompt" : "No prompt selected"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {activeQuestion
                  ? activeQuestion.prompt
                  : "Choose a question in the review form to attach evidence."}
              </p>
              <p className="mt-3 text-xs text-slate-500">
                {activeQuestionEvidenceCount} evidence item
                {activeQuestionEvidenceCount === 1 ? "" : "s"} linked to this answer
              </p>
            </div>

            <div className="rounded-[var(--radius-md)] border border-white bg-white p-4 shadow-[var(--shadow-xs)]">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Review details
              </p>
              <dl className="mt-2 space-y-2 text-sm text-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <dt className="font-medium text-slate-500">Cycle</dt>
                  <dd className="text-right text-slate-900">{submissionContext.cycleName}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="font-medium text-slate-500">Reviewer</dt>
                  <dd className="text-right text-slate-900">{submissionContext.reviewerName}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="font-medium text-slate-500">Review type</dt>
                  <dd className="text-right text-slate-900">{submissionContext.relationship}</dd>
                </div>
              </dl>
            </div>
          </div>

          {!activeQuestion?.answerId ? (
            <Toast variant="warning">
              Type in this answer and wait for autosave before attaching evidence.
            </Toast>
          ) : null}

          <p className="text-xs leading-5 text-slate-500">
            Attach concrete evidence from feedback, updates, goals, and values recognition. Only
            items visible to your role appear here.
          </p>
        </section>

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
              className="w-full"
              tabs={evidenceTypeOrder.map((type) => ({
                value: type,
                label: `${evidenceTypeLabel[type]} (${evidenceCounts[type] ?? 0})`,
              }))}
            />

            <section className="space-y-4 rounded-[var(--radius-lg)] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {evidenceTypeLabel[selectedEvidenceType]}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Showing {filteredEvidenceItems.length} of {selectedEvidenceItems.length}
                  </p>
                </div>
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
                <div className="space-y-3">
                  {filteredEvidenceItems.map((item) => {
                    const isAttaching = attachingEvidenceId === item.evidenceItemId;

                    return (
                      <article
                        key={item.evidenceItemId}
                        className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50/55 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-600">
                                {new Date(item.occurredAt).toLocaleDateString()}
                              </span>
                              <span>Source: {evidenceTypeLabel[item.type]}</span>
                            </div>
                            <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                            <p className="text-sm leading-6 text-slate-600">
                              {truncateText(item.summary, 160)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="shrink-0 self-start"
                            onClick={() => void handleAttachEvidence(item)}
                            disabled={isReadOnly || !activeQuestion?.answerId || isAttaching}
                          >
                            {isAttaching ? "Attaching..." : "Attach to this answer"}
                          </Button>
                        </div>
                      </article>
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

function getSectionDescription(section: ReviewSection | null): string {
  if (!section) {
    return "Write clear, evidence-backed responses for this review.";
  }

  switch (section.kind) {
    case "impact-results":
      return "Capture what was delivered, the outcomes created, and the business impact.";
    case "competencies":
      return "Describe how the work was done across the competency areas in scope.";
    case "growth-development":
      return "Document coaching themes, development priorities, and next-step growth needs.";
    case "goals":
      return "Connect future goals to the role baseline, recent evidence, and company expectations.";
    case "additional":
      return "Complete any remaining prompts that add important context to the review.";
    case "final-summary":
      return "Run a final quality check before you lock the review.";
    default:
      return "Write clear, evidence-backed responses for this review.";
  }
}

function getSectionProgressLabel(
  section: ReviewSection | null,
  progress:
    | {
        answered: number;
        total: number;
        remaining: number;
      }
    | null
    | undefined,
): string {
  if (!section) {
    return "No phase";
  }

  const hasRequiredQuestions = (progress?.total ?? 0) > 0;
  const remainingCount = Math.max(progress?.remaining ?? 0, 0);

  if (hasRequiredQuestions) {
    return remainingCount === 0 ? "Complete" : `${remainingCount} remaining`;
  }

  return section.kind === "final-summary" ? "Final step" : "Optional";
}

function formatDimensionLabel(value: CompetencyDimensionKey): string {
  return value
    .split("_")
    .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
    .join(" ");
}

function buildReviewSections(questions: WriteReviewQuestion[]): ReviewSection[] {
  const buckets: Record<ReviewSectionKind, WriteReviewQuestion[]> = {
    "impact-results": [],
    competencies: [],
    "growth-development": [],
    goals: [],
    additional: [],
    "final-summary": [],
  };

  for (const question of questions) {
    buckets[classifyQuestion(question)].push(question);
  }

  const sections: ReviewSection[] = [];
  const pushSection = (kind: ReviewSectionKind, title: string, sectionQuestions: WriteReviewQuestion[]) => {
    if (sectionQuestions.length === 0) {
      return;
    }

    sections.push({
      id: `section-${kind}-${sections.length + 1}`,
      title,
      subtitle: `${sectionQuestions.length} prompt${sectionQuestions.length === 1 ? "" : "s"}`,
      questionIds: sectionQuestions.map((question) => question.id),
      kind,
    });
  };

  pushSection("impact-results", "Impact / Results", buckets["impact-results"]);

  chunkQuestions(buckets.competencies, 4).forEach((chunk, index, allChunks) => {
    sections.push({
      id: `section-competencies-${index + 1}`,
      title: allChunks.length === 1 ? "Competencies" : `Competencies · Part ${index + 1}`,
      subtitle: `${chunk.length} prompt${chunk.length === 1 ? "" : "s"}`,
      questionIds: chunk.map((question) => question.id),
      kind: "competencies",
    });
  });

  pushSection("growth-development", "Growth / Development", buckets["growth-development"]);
  pushSection("goals", "Goals", buckets.goals);

  chunkQuestions(buckets.additional, 4).forEach((chunk, index) => {
    sections.push({
      id: `section-additional-${index + 1}`,
      title: `Additional prompts ${index + 1}`,
      subtitle: `${chunk.length} prompt${chunk.length === 1 ? "" : "s"}`,
      questionIds: chunk.map((question) => question.id),
      kind: "additional",
    });
  });

  sections.push({
    id: "section-final-summary",
    title: "Final summary",
    subtitle:
      buckets["final-summary"].length > 0
        ? `${buckets["final-summary"].length} prompt${buckets["final-summary"].length === 1 ? "" : "s"}`
        : "Review completion before submit",
    questionIds: buckets["final-summary"].map((question) => question.id),
    kind: "final-summary",
  });

  return sections;
}

function classifyQuestion(question: WriteReviewQuestion): ReviewSectionKind {
  if (question.questionType === ReviewQuestionType.SCALE_1_TO_5 || question.dimensionKey) {
    return "competencies";
  }

  const normalizedPrompt = question.prompt.toLowerCase();

  if (includesAny(normalizedPrompt, ["overall summary", "final summary", "overall assessment", "final assessment"])) {
    return "final-summary";
  }

  if (includesAny(normalizedPrompt, ["impact", "result", "outcome", "delivered"])) {
    return "impact-results";
  }

  if (includesAny(normalizedPrompt, ["growth", "develop", "coaching", "improve", "priority"])) {
    return "growth-development";
  }

  if (includesAny(normalizedPrompt, ["goal", "objective", "target", "milestone"])) {
    return "goals";
  }

  return "additional";
}

function includesAny(value: string, keywords: string[]): boolean {
  return keywords.some((keyword) => value.includes(keyword));
}

function chunkQuestions<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value != null;
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
