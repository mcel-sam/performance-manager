"use client";

import { GoalStatus, GoalType, GoalVisibility, KeyResultType } from "@prisma/client";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Toast } from "@/components/ui/toast";
import {
  prepareGoalKeyResults,
  type GoalComposerKeyResultDraft,
  type GoalComposerKeyResultPayload,
} from "@/components/goals/goal-composer-utils";

interface GoalComposerProps {
  auth: {
    userId: string;
    orgId: string;
  };
  cycle: {
    id: string;
    name: string;
    cadence: string;
  };
  owners: Array<{
    id: string;
    name: string;
    department: string | null;
    title: string | null;
  }>;
  competencies: Array<{
    id: string;
    name: string;
    slug: string;
    dimensionKey: string | null;
  }>;
  parentGoals: Array<{
    id: string;
    title: string;
    ownerName: string;
  }>;
  defaultOwnerEmployeeId: string;
  mode: "create" | "edit";
  initialGoal?: {
    id: string;
    ownerEmployeeId: string;
    ownerName: string;
    goalType: GoalType;
    title: string;
    description: string | null;
    status: GoalStatus;
    visibility: GoalVisibility;
    parentGoal: {
      id: string;
      title: string;
    } | null;
    competencies: Array<{
      id: string;
      name: string;
    }>;
    keyResults: Array<{
      id: string;
      title: string;
      type: KeyResultType;
      startValue: number | null;
      targetValue: number | null;
      currentValue: number | null;
      weight: number | null;
      sortOrder: number;
    }>;
  };
  onSaved: (goalId: string, outcome: "draft" | "published" | "saved") => Promise<void> | void;
  onCancel: () => void;
}

type GoalComposerInitialGoal = NonNullable<GoalComposerProps["initialGoal"]>;
type GoalComposerInitialKeyResult = GoalComposerInitialGoal["keyResults"][number];

function blankKeyResult(): GoalComposerKeyResultDraft {
  return {
    title: "",
    type: KeyResultType.PERCENT,
    startValue: "",
    targetValue: "",
    currentValue: "",
    weight: "",
  };
}

export function GoalComposer({
  auth,
  cycle,
  owners,
  competencies,
  parentGoals,
  defaultOwnerEmployeeId,
  mode,
  initialGoal,
  onSaved,
  onCancel,
}: GoalComposerProps) {
  const [ownerEmployeeId, setOwnerEmployeeId] = useState(defaultOwnerEmployeeId);
  const [goalType, setGoalType] = useState<GoalType>(GoalType.PERFORMANCE);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<GoalStatus>(GoalStatus.NOT_STARTED);
  const [visibility, setVisibility] = useState<GoalVisibility>(GoalVisibility.TEAM);
  const [parentGoalId, setParentGoalId] = useState("");
  const [competencyIds, setCompetencyIds] = useState<string[]>([]);
  const [keyResults, setKeyResults] = useState<GoalComposerKeyResultDraft[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitIntent, setSubmitIntent] = useState<"draft" | "publish" | "save">(
    mode === "create" ? "publish" : "save",
  );
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);
  const defaultOwnerName =
    owners.find((owner) => owner.id === ownerEmployeeId)?.name ?? "Current employee";

  useEffect(() => {
    if (mode === "edit" && initialGoal) {
      setOwnerEmployeeId(initialGoal.ownerEmployeeId);
      setGoalType(initialGoal.goalType);
      setTitle(initialGoal.title);
      setDescription(initialGoal.description ?? "");
      setStatus(initialGoal.status);
      setVisibility(initialGoal.visibility);
      setParentGoalId(initialGoal.parentGoal?.id ?? "");
      setCompetencyIds(initialGoal.competencies.map((competency) => competency.id));
      setKeyResults(
        initialGoal.keyResults.length > 0
          ? initialGoal.keyResults.map((keyResult) => ({
              id: keyResult.id,
              title: keyResult.title,
              type: keyResult.type,
              startValue: toInputNumberValue(keyResult.startValue),
              targetValue: toInputNumberValue(keyResult.targetValue),
              currentValue: toInputNumberValue(keyResult.currentValue),
              weight: toInputNumberValue(keyResult.weight),
            }))
          : [],
      );
      setIsDescriptionVisible(Boolean(initialGoal.description));
      setMessage(null);
      return;
    }

    setOwnerEmployeeId(defaultOwnerEmployeeId);
    setGoalType(GoalType.PERFORMANCE);
    setTitle("");
    setDescription("");
    setStatus(GoalStatus.NOT_STARTED);
    setVisibility(GoalVisibility.TEAM);
    setParentGoalId("");
    setCompetencyIds([]);
    setKeyResults([]);
    setIsDescriptionVisible(false);
    setMessage(null);
  }, [defaultOwnerEmployeeId, initialGoal, mode]);

  async function handlePersist(intent: "draft" | "publish" | "save") {
    setMessage(null);
    setIsSubmitting(true);
    setSubmitIntent(intent);

    try {
      const preparedKeyResults = prepareGoalKeyResults(keyResults);
      if (preparedKeyResults.error) {
        throw new Error(preparedKeyResults.error);
      }

      if (mode === "create") {
        const response = await fetch("/api/goals", {
          method: "POST",
          headers: authHeaders(auth),
          body: JSON.stringify({
            ownerEmployeeId,
            cycleId: cycle.id,
            goalType,
            title,
            description: normalizeNullableString(description),
            status,
            visibility,
            parentGoalId: normalizeNullableString(parentGoalId),
            competencyIds,
            watcherUserIds: [],
            keyResults: preparedKeyResults.keyResults,
          }),
        });
        const payload = (await response.json()) as {
          message?: string;
          goal?: {
            id: string;
          };
        };

        if (!response.ok || !payload.goal) {
          throw new Error(payload.message ?? "Unable to create goal");
        }

        if (intent === "publish") {
          const submitResponse = await fetch(`/api/goals/${payload.goal.id}/workflow`, {
            method: "POST",
            headers: authHeaders(auth),
            body: JSON.stringify({
              action: "submit",
              note: null,
            }),
          });
          const submitPayload = (await submitResponse.json()) as { message?: string };

          if (!submitResponse.ok) {
            await onSaved(payload.goal.id, "draft");
            throw new Error(
              submitPayload.message ?? "Goal was saved as a draft, but it could not be published.",
            );
          }

          await onSaved(payload.goal.id, "published");
          return;
        }

        await onSaved(payload.goal.id, "draft");
        return;
      }

      if (!initialGoal) {
        throw new Error("Goal details are missing for edit mode");
      }

      const updateResponse = await fetch(`/api/goals/${initialGoal.id}`, {
        method: "PATCH",
        headers: authHeaders(auth),
        body: JSON.stringify({
          goalType,
          title,
          description: normalizeNullableString(description),
          status,
          visibility,
          competencyIds,
          watcherUserIds: [],
        }),
      });
      const updatePayload = (await updateResponse.json()) as {
        message?: string;
      };
      if (!updateResponse.ok) {
        throw new Error(updatePayload.message ?? "Unable to update goal");
      }

      await syncKeyResults(initialGoal.id, initialGoal.keyResults, preparedKeyResults.keyResults, auth);
      await syncGoalAlignment(initialGoal.id, initialGoal.parentGoal?.id ?? null, parentGoalId, auth);

      await onSaved(initialGoal.id, "saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save goal");
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateKeyResultDraft(index: number, nextDraft: GoalComposerKeyResultDraft) {
    setKeyResults((current) =>
      current.map((draft, draftIndex) => (draftIndex === index ? nextDraft : draft)),
    );
  }

  function toggleCompetency(competencyId: string) {
    setCompetencyIds((current) =>
      current.includes(competencyId)
        ? current.filter((value) => value !== competencyId)
        : [...current, competencyId],
    );
  }

  const availableParentGoals = parentGoals.filter((goal) => goal.id !== initialGoal?.id);
  const selectedParentGoal =
    availableParentGoals.find((goal) => goal.id === parentGoalId) ?? null;
  const selectedVisibilityLabel =
    visibility === GoalVisibility.PRIVATE
      ? "Private"
      : visibility === GoalVisibility.ORG
        ? "Org"
        : "Team";
  const measureSummary =
    keyResults.length === 0
      ? "No measures yet"
      : `${keyResults.length} ${keyResults.length === 1 ? "measure" : "measures"}`;
  const competencySummary =
    competencyIds.length === 0
      ? "No competency tags"
      : `${competencyIds.length} ${competencyIds.length === 1 ? "tag" : "tags"} selected`;

  return (
    <Card data-testid="goal-composer-card">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{mode === "create" ? "Create goal" : "Edit goal"}</CardTitle>
            <CardDescription>
              Start with the objective, then open details only if they help shape the goal.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{cycle.name}</Badge>
            <Badge variant="neutral">{cycle.cadence.toLowerCase()}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handlePersist(mode === "create" ? "publish" : "save");
          }}
          className="space-y-8"
          data-testid="goal-composer-form"
        >
          <section className="space-y-4">
            <label className="space-y-1">
              <span className="text-sm font-medium text-[var(--color-text-primary)]">What do you want to accomplish?</span>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} required />
            </label>

            {isDescriptionVisible || description.length > 0 ? (
              <label className="space-y-1">
                <span className="text-sm font-medium text-[var(--color-text-primary)]">Description</span>
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  placeholder="Spell out the operating context, why it matters, and what success should feel like."
                />
              </label>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-fit border-0 bg-transparent px-0 shadow-none text-[var(--color-text-muted)] hover:bg-transparent hover:text-[var(--color-text-primary)]"
                onClick={() => setIsDescriptionVisible(true)}
              >
                Add description (optional)
              </Button>
            )}

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[18px] border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                  Goal cycle
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">{cycle.name}</p>
              </div>
              <div className="rounded-[18px] border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                  Owner
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
                  {mode === "create" ? defaultOwnerName : initialGoal?.ownerName ?? defaultOwnerName}
                </p>
              </div>
              <div className="rounded-[18px] border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                  Visibility
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">{selectedVisibilityLabel}</p>
              </div>
            </div>
          </section>

          <details className="group overflow-hidden rounded-[20px] border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)]" open={mode === "edit"}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Details</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {humanizeGoalType(goalType)} · {selectedVisibilityLabel}
                  {selectedParentGoal ? ` · aligned to ${selectedParentGoal.title}` : ""}
                  {mode === "edit" ? ` · ${humanizeGoalStatus(status)}` : ""}
                </p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)] group-open:hidden">
                Expand
              </span>
              <span className="hidden text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)] group-open:inline">
                Collapse
              </span>
            </summary>
            <div className="border-t border-[var(--color-shell-divider)] bg-[var(--color-surface-default)] px-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">Goal type</span>
                  <Select value={goalType} onChange={(event) => setGoalType(event.target.value as GoalType)}>
                    <option value={GoalType.PERFORMANCE}>Performance goal</option>
                    <option value={GoalType.DEVELOPMENT}>Development goal</option>
                  </Select>
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">Visibility</span>
                  <Select
                    value={visibility}
                    onChange={(event) => setVisibility(event.target.value as GoalVisibility)}
                  >
                    <option value={GoalVisibility.PRIVATE}>Private</option>
                    <option value={GoalVisibility.TEAM}>Team</option>
                    <option value={GoalVisibility.ORG}>Org</option>
                  </Select>
                </label>

                {mode === "edit" ? (
                  <label className="space-y-1">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">Status</span>
                    <Select value={status} onChange={(event) => setStatus(event.target.value as GoalStatus)}>
                      <option value={GoalStatus.NOT_STARTED}>Not started</option>
                      <option value={GoalStatus.ON_TRACK}>On track</option>
                      <option value={GoalStatus.AT_RISK}>At risk</option>
                      <option value={GoalStatus.OFF_TRACK}>Off track</option>
                      <option value={GoalStatus.COMPLETE}>Complete</option>
                      <option value={GoalStatus.CANCELED}>Canceled</option>
                    </Select>
                  </label>
                ) : null}

                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">Align to parent</span>
                  <Select value={parentGoalId} onChange={(event) => setParentGoalId(event.target.value)}>
                    <option value="">No parent goal</option>
                    {availableParentGoals.map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {goal.title} · {goal.ownerName}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>

              <div className="mt-5 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Competency tags</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Link the objective to the capabilities it should reinforce.
                  </p>
                </div>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {competencies.map((competency) => {
                    const checked = competencyIds.includes(competency.id);
                    return (
                      <label
                        key={competency.id}
                        className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-shell-border)] bg-[var(--color-surface-default)] px-3 py-3"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCompetency(competency.id)}
                        />
                        <span className="space-y-1">
                          <span className="block text-sm font-medium text-[var(--color-text-primary)]">
                            {competency.name}
                          </span>
                          <span className="block text-xs text-[var(--color-text-muted)]">
                            {competency.dimensionKey ?? competency.slug}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">{competencySummary}</p>
              </div>
            </div>
          </details>

          <details className="group overflow-hidden rounded-[20px] border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)]" open={keyResults.length > 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Measures</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Add the metrics or checkpoints that show whether this goal is moving.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                  {measureSummary}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)] group-open:hidden">
                  Expand
                </span>
                <span className="hidden text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)] group-open:inline">
                  Collapse
                </span>
              </div>
            </summary>
            <div className="space-y-3 border-t border-[var(--color-shell-divider)] bg-[var(--color-surface-default)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[var(--color-text-muted)]">
                  Use percent, number, or binary checks so progress can roll up cleanly.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setKeyResults((current) => [...current, blankKeyResult()])}
                  data-testid="goal-composer-add-kr"
                >
                  Add measure
                </Button>
              </div>

              {keyResults.length === 0 ? (
                <EmptyState
                  title="No measures yet"
                  description="You can save the goal now and add the measures later, or add one before saving."
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setKeyResults([blankKeyResult()])}
                    >
                      Add first measure
                    </Button>
                  }
                />
              ) : (
                keyResults.map((keyResult, index) => (
                  <div
                    key={keyResult.id ?? `draft-${index}`}
                    className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">Measure {index + 1}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setKeyResults((current) => current.filter((_, draftIndex) => draftIndex !== index))}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                      <label className="space-y-1 md:col-span-2 xl:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                          Measure title
                        </span>
                        <Input
                          value={keyResult.title}
                          onChange={(event) =>
                            updateKeyResultDraft(index, {
                              ...keyResult,
                              title: event.target.value,
                            })
                          }
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                          Type
                        </span>
                        <Select
                          value={keyResult.type}
                          onChange={(event) =>
                            updateKeyResultDraft(index, {
                              ...keyResult,
                              type: event.target.value as KeyResultType,
                            })
                          }
                        >
                          <option value={KeyResultType.PERCENT}>Percent</option>
                          <option value={KeyResultType.NUMBER}>Number</option>
                          <option value={KeyResultType.BOOLEAN}>Binary</option>
                        </Select>
                      </label>

                      {keyResult.type === KeyResultType.BOOLEAN ? (
                        <>
                          <label className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                              Current
                            </span>
                            <Select
                              value={keyResult.currentValue}
                              onChange={(event) =>
                                updateKeyResultDraft(index, {
                                  ...keyResult,
                                  currentValue: event.target.value,
                                })
                              }
                            >
                              <option value="">Unset</option>
                              <option value="0">No</option>
                              <option value="1">Yes</option>
                            </Select>
                          </label>
                          <label className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                              Target
                            </span>
                            <Select
                              value={keyResult.targetValue}
                              onChange={(event) =>
                                updateKeyResultDraft(index, {
                                  ...keyResult,
                                  targetValue: event.target.value,
                                })
                              }
                            >
                              <option value="1">Yes</option>
                              <option value="0">No</option>
                            </Select>
                          </label>
                        </>
                      ) : (
                        <>
                          <label className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                              Start
                            </span>
                            <Input
                              type="number"
                              value={keyResult.startValue}
                              onChange={(event) =>
                                updateKeyResultDraft(index, {
                                  ...keyResult,
                                  startValue: event.target.value,
                                })
                              }
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                              Current
                            </span>
                            <Input
                              type="number"
                              value={keyResult.currentValue}
                              onChange={(event) =>
                                updateKeyResultDraft(index, {
                                  ...keyResult,
                                  currentValue: event.target.value,
                                })
                              }
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                              Target
                            </span>
                            <Input
                              type="number"
                              value={keyResult.targetValue}
                              onChange={(event) =>
                                updateKeyResultDraft(index, {
                                  ...keyResult,
                                  targetValue: event.target.value,
                                })
                              }
                            />
                          </label>
                        </>
                      )}

                      <label className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                          Weight
                        </span>
                        <Input
                          type="number"
                          step="0.1"
                          value={keyResult.weight}
                          onChange={(event) =>
                            updateKeyResultDraft(index, {
                              ...keyResult,
                              weight: event.target.value,
                            })
                          }
                        />
                      </label>
                    </div>
                  </div>
                ))
              )}
            </div>
          </details>

          <div className="flex flex-wrap items-center gap-3">
            {mode === "create" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => void handlePersist("draft")}
                >
                  {isSubmitting && submitIntent === "draft" ? "Saving..." : "Save draft"}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="goal-composer-submit"
                >
                  {isSubmitting && submitIntent === "publish" ? "Publishing..." : "Publish goal"}
                </Button>
              </>
            ) : (
              <Button type="submit" disabled={isSubmitting} data-testid="goal-composer-submit">
                {isSubmitting ? "Saving..." : "Save goal"}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            {message ? (
              <Toast variant="error">
                {message}
              </Toast>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

async function syncKeyResults(
  goalId: string,
  previousKeyResults: GoalComposerInitialGoal["keyResults"],
  nextKeyResults: GoalComposerKeyResultPayload[],
  auth: GoalComposerProps["auth"],
) {
  const previousById = new Map(
    previousKeyResults.map((keyResult: GoalComposerInitialKeyResult) => [keyResult.id, keyResult]),
  );
  const nextExistingIds = new Set(nextKeyResults.map((keyResult) => keyResult.id).filter(Boolean));

  for (const previousKeyResult of previousKeyResults) {
    if (!nextExistingIds.has(previousKeyResult.id)) {
      const response = await fetch(`/api/goals/${goalId}/key-results/${previousKeyResult.id}`, {
        method: "DELETE",
        headers: authHeaders(auth),
      });
      await assertGoalMutationResponse(response, "Unable to remove key result");
    }
  }

  for (const [index, keyResult] of nextKeyResults.entries()) {
    const payload = {
      title: keyResult.title,
      type: keyResult.type,
      startValue: keyResult.startValue,
      targetValue: keyResult.targetValue,
      currentValue: keyResult.currentValue,
      weight: keyResult.weight,
      sortOrder: index,
    };

    if (keyResult.id && previousById.has(keyResult.id)) {
      const response = await fetch(`/api/goals/${goalId}/key-results/${keyResult.id}`, {
        method: "PATCH",
        headers: authHeaders(auth),
        body: JSON.stringify(payload),
      });
      await assertGoalMutationResponse(response, "Unable to update key result");
      continue;
    }

    const response = await fetch(`/api/goals/${goalId}/key-results`, {
      method: "POST",
      headers: authHeaders(auth),
      body: JSON.stringify(payload),
    });
    await assertGoalMutationResponse(response, "Unable to create key result");
  }
}

async function syncGoalAlignment(
  goalId: string,
  previousParentGoalId: string | null,
  nextParentGoalId: string,
  auth: GoalComposerProps["auth"],
) {
  const normalizedNextParentGoalId = normalizeNullableString(nextParentGoalId);
  if (previousParentGoalId === normalizedNextParentGoalId) {
    return;
  }

  if (!normalizedNextParentGoalId) {
    const response = await fetch(`/api/goals/${goalId}/unlink`, {
      method: "POST",
      headers: authHeaders(auth),
    });
    await assertGoalMutationResponse(response, "Unable to remove goal alignment");
    return;
  }

  const response = await fetch(`/api/goals/${goalId}/align`, {
    method: "POST",
    headers: authHeaders(auth),
    body: JSON.stringify({
      parentGoalId: normalizedNextParentGoalId,
    }),
  });
  await assertGoalMutationResponse(response, "Unable to align goal");
}

function authHeaders(auth: GoalComposerProps["auth"]) {
  return {
    "content-type": "application/json",
    "x-user-id": auth.userId,
    "x-org-id": auth.orgId,
  };
}

function normalizeNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toInputNumberValue(value: number | null) {
  return value == null ? "" : String(value);
}

function humanizeGoalType(goalType: GoalType) {
  switch (goalType) {
    case GoalType.DEVELOPMENT:
      return "Development goal";
    case GoalType.PERFORMANCE:
    default:
      return "Performance goal";
  }
}

function humanizeGoalStatus(status: GoalStatus) {
  switch (status) {
    case GoalStatus.NOT_STARTED:
      return "Not started";
    case GoalStatus.ON_TRACK:
      return "On track";
    case GoalStatus.AT_RISK:
      return "At risk";
    case GoalStatus.OFF_TRACK:
      return "Off track";
    case GoalStatus.COMPLETE:
      return "Complete";
    case GoalStatus.CANCELED:
    default:
      return "Canceled";
  }
}

async function assertGoalMutationResponse(response: Response, fallbackMessage: string) {
  if (response.ok) {
    return;
  }

  let message = fallbackMessage;
  try {
    const payload = (await response.json()) as { message?: string };
    if (payload.message) {
      message = payload.message;
    }
  } catch {
    // Ignore non-JSON error payloads and use the fallback message.
  }

  throw new Error(message);
}
