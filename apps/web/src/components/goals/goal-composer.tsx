"use client";

import { GoalStatus, GoalVisibility, KeyResultType } from "@prisma/client";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Toast } from "@/components/ui/toast";

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
  onSaved: (goalId: string) => Promise<void> | void;
  onCancel: () => void;
}

type GoalComposerInitialGoal = NonNullable<GoalComposerProps["initialGoal"]>;
type GoalComposerInitialKeyResult = GoalComposerInitialGoal["keyResults"][number];

interface KeyResultDraft {
  id?: string;
  title: string;
  type: KeyResultType;
  startValue: string;
  targetValue: string;
  currentValue: string;
  weight: string;
}

function blankKeyResult(): KeyResultDraft {
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<GoalStatus>(GoalStatus.NOT_STARTED);
  const [visibility, setVisibility] = useState<GoalVisibility>(GoalVisibility.TEAM);
  const [parentGoalId, setParentGoalId] = useState("");
  const [competencyIds, setCompetencyIds] = useState<string[]>([]);
  const [keyResults, setKeyResults] = useState<KeyResultDraft[]>([blankKeyResult()]);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && initialGoal) {
      setOwnerEmployeeId(initialGoal.ownerEmployeeId);
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
          : [blankKeyResult()],
      );
      return;
    }

    setOwnerEmployeeId(defaultOwnerEmployeeId);
    setTitle("");
    setDescription("");
    setStatus(GoalStatus.NOT_STARTED);
    setVisibility(GoalVisibility.TEAM);
    setParentGoalId("");
    setCompetencyIds([]);
    setKeyResults([blankKeyResult()]);
  }, [defaultOwnerEmployeeId, initialGoal, mode]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        const response = await fetch("/api/goals", {
          method: "POST",
          headers: authHeaders(auth),
          body: JSON.stringify({
            ownerEmployeeId,
            cycleId: cycle.id,
            title,
            description: normalizeNullableString(description),
            status,
            visibility,
            parentGoalId: normalizeNullableString(parentGoalId),
            competencyIds,
            watcherUserIds: [],
            keyResults: buildKeyResultPayload(keyResults),
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

        await onSaved(payload.goal.id);
        return;
      }

      if (!initialGoal) {
        throw new Error("Goal details are missing for edit mode");
      }

      const updateResponse = await fetch(`/api/goals/${initialGoal.id}`, {
        method: "PATCH",
        headers: authHeaders(auth),
        body: JSON.stringify({
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

      await syncKeyResults(initialGoal.id, initialGoal.keyResults, keyResults, auth);
      await syncGoalAlignment(initialGoal.id, initialGoal.parentGoal?.id ?? null, parentGoalId, auth);

      await onSaved(initialGoal.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save goal");
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateKeyResultDraft(index: number, nextDraft: KeyResultDraft) {
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

  return (
    <Card data-testid="goal-composer-card">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{mode === "create" ? "Create goal" : "Edit goal"}</CardTitle>
            <CardDescription>
              Capture the objective, attach measurable results, align it upward, and tag the competencies it should reinforce.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{cycle.name}</Badge>
            <Badge variant="neutral">{cycle.cadence.toLowerCase()}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8" data-testid="goal-composer-form">
          <section className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Objective</span>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} required />
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Description</span>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder="Spell out the operating context, why it matters, and what success should feel like."
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Owner</span>
              {mode === "create" ? (
                <Select
                  value={ownerEmployeeId}
                  onChange={(event) => setOwnerEmployeeId(event.target.value)}
                  required
                >
                  <option value="">Select owner</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name}
                      {owner.title ? ` · ${owner.title}` : ""}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input value={initialGoal?.ownerName ?? ""} disabled />
              )}
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Status</span>
              <Select value={status} onChange={(event) => setStatus(event.target.value as GoalStatus)}>
                <option value={GoalStatus.NOT_STARTED}>Not started</option>
                <option value={GoalStatus.ON_TRACK}>On track</option>
                <option value={GoalStatus.AT_RISK}>At risk</option>
                <option value={GoalStatus.OFF_TRACK}>Off track</option>
                <option value={GoalStatus.COMPLETE}>Complete</option>
                <option value={GoalStatus.CANCELED}>Canceled</option>
              </Select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Visibility</span>
              <Select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as GoalVisibility)}
              >
                <option value={GoalVisibility.PRIVATE}>Private</option>
                <option value={GoalVisibility.TEAM}>Team</option>
                <option value={GoalVisibility.ORG}>Org</option>
              </Select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Align to parent</span>
              <Select value={parentGoalId} onChange={(event) => setParentGoalId(event.target.value)}>
                <option value="">No parent goal</option>
                {availableParentGoals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title} · {goal.ownerName}
                  </option>
                ))}
              </Select>
            </label>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Key results</h3>
                <p className="text-sm text-slate-500">
                  Mix percent, number, or binary checks so progress can roll up cleanly.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setKeyResults((current) => [...current, blankKeyResult()])}
                data-testid="goal-composer-add-kr"
              >
                Add key result
              </Button>
            </div>

            {keyResults.map((keyResult, index) => (
              <div
                key={keyResult.id ?? `draft-${index}`}
                className="space-y-3 rounded-[var(--radius-lg)] border border-slate-200 bg-slate-50 p-4"
              >
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                  <label className="space-y-1 md:col-span-2 xl:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      KR title
                    </span>
                    <Input
                      value={keyResult.title}
                      onChange={(event) =>
                        updateKeyResultDraft(index, {
                          ...keyResult,
                          title: event.target.value,
                        })
                      }
                      required
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
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
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
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
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
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
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
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
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
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
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
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
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
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

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setKeyResults((current) =>
                        current.length === 1
                          ? [blankKeyResult()]
                          : current.filter((_, draftIndex) => draftIndex !== index),
                      )
                    }
                  >
                    Remove KR
                  </Button>
                </div>
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Competency tags</h3>
              <p className="text-sm text-slate-500">
                Link the objective to the capabilities it should reinforce.
              </p>
            </div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {competencies.map((competency) => {
                const checked = competencyIds.includes(competency.id);
                return (
                  <label
                    key={competency.id}
                    className="flex items-start gap-2 rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 py-3"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCompetency(competency.id)}
                    />
                    <span className="space-y-1">
                      <span className="block text-sm font-medium text-slate-900">
                        {competency.name}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {competency.dimensionKey ?? competency.slug}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isSubmitting} data-testid="goal-composer-submit">
              {isSubmitting
                ? mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : mode === "create"
                  ? "Create goal"
                  : "Save goal"}
            </Button>
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
  nextKeyResults: KeyResultDraft[],
  auth: GoalComposerProps["auth"],
) {
  const previousById = new Map(
    previousKeyResults.map((keyResult: GoalComposerInitialKeyResult) => [keyResult.id, keyResult]),
  );
  const nextExistingIds = new Set(nextKeyResults.map((keyResult) => keyResult.id).filter(Boolean));

  for (const previousKeyResult of previousKeyResults) {
    if (!nextExistingIds.has(previousKeyResult.id)) {
      await fetch(`/api/goals/${goalId}/key-results/${previousKeyResult.id}`, {
        method: "DELETE",
        headers: authHeaders(auth),
      });
    }
  }

  for (const [index, keyResult] of nextKeyResults.entries()) {
    const payload = {
      title: keyResult.title,
      type: keyResult.type,
      startValue: coerceNullableNumber(keyResult.startValue),
      targetValue: coerceNullableNumber(keyResult.targetValue),
      currentValue: coerceNullableNumber(keyResult.currentValue),
      weight: coerceNullableNumber(keyResult.weight),
      sortOrder: index,
    };

    if (keyResult.id && previousById.has(keyResult.id)) {
      await fetch(`/api/goals/${goalId}/key-results/${keyResult.id}`, {
        method: "PATCH",
        headers: authHeaders(auth),
        body: JSON.stringify(payload),
      });
      continue;
    }

    await fetch(`/api/goals/${goalId}/key-results`, {
      method: "POST",
      headers: authHeaders(auth),
      body: JSON.stringify(payload),
    });
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
    await fetch(`/api/goals/${goalId}/unlink`, {
      method: "POST",
      headers: authHeaders(auth),
    });
    return;
  }

  await fetch(`/api/goals/${goalId}/align`, {
    method: "POST",
    headers: authHeaders(auth),
    body: JSON.stringify({
      parentGoalId: normalizedNextParentGoalId,
    }),
  });
}

function buildKeyResultPayload(keyResults: KeyResultDraft[]) {
  return keyResults.map((keyResult, index) => ({
    title: keyResult.title,
    type: keyResult.type,
    startValue: coerceNullableNumber(keyResult.startValue),
    targetValue: coerceNullableNumber(keyResult.targetValue),
    currentValue: coerceNullableNumber(keyResult.currentValue),
    weight: coerceNullableNumber(keyResult.weight),
    sortOrder: index,
  }));
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

function coerceNullableNumber(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? Number(trimmed) : null;
}
