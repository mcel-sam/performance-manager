import { KeyResultType } from "@prisma/client";

export interface GoalComposerKeyResultDraft {
  id?: string;
  title: string;
  type: KeyResultType;
  startValue: string;
  targetValue: string;
  currentValue: string;
  weight: string;
}

export interface GoalComposerKeyResultPayload {
  id?: string;
  title: string;
  type: KeyResultType;
  startValue: number | null;
  targetValue: number | null;
  currentValue: number | null;
  weight: number | null;
  sortOrder: number;
}

export interface PreparedGoalKeyResultsResult {
  error?: string;
  keyResults: GoalComposerKeyResultPayload[];
}

export function prepareGoalKeyResults(
  keyResults: GoalComposerKeyResultDraft[],
): PreparedGoalKeyResultsResult {
  const prepared: GoalComposerKeyResultPayload[] = [];

  for (const draft of keyResults) {
    const title = draft.title.trim();
    const hasNumericValues =
      hasValue(draft.startValue) ||
      hasValue(draft.targetValue) ||
      hasValue(draft.currentValue) ||
      hasValue(draft.weight);
    const hasExistingId = typeof draft.id === "string" && draft.id.length > 0;

    if (!title && !hasNumericValues && !hasExistingId) {
      continue;
    }

    if (!title) {
      return {
        error: "Each key result needs a title, or remove the blank draft before saving.",
        keyResults: [],
      };
    }

    prepared.push({
      ...(draft.id ? { id: draft.id } : {}),
      title,
      type: draft.type,
      startValue: coerceNullableNumber(draft.startValue),
      targetValue: coerceNullableNumber(draft.targetValue),
      currentValue: coerceNullableNumber(draft.currentValue),
      weight: coerceNullableNumber(draft.weight),
      sortOrder: prepared.length,
    });
  }

  return {
    keyResults: prepared,
  };
}

function hasValue(value: string): boolean {
  return value.trim().length > 0;
}

function coerceNullableNumber(value: string): number | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? Number(trimmed) : null;
}
