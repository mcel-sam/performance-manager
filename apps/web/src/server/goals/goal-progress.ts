import { KeyResultType } from "@prisma/client";

export interface GoalProgressKeyResultInput {
  type: KeyResultType;
  startValue: number | null;
  targetValue: number | null;
  currentValue: number | null;
  weight?: number | null;
}

/**
 * Deterministic goal progress rule:
 * - each key result contributes a normalized completion between 0 and 1
 * - weights are equal unless explicit positive weights are supplied
 * - number/percent KRs use (current - start) / (target - start), clamped to [0, 1]
 * - boolean KRs are complete when the current value is truthy (>= 1)
 * - the goal progress is the weighted average * 100, rounded to 2 decimals
 */
export function calculateGoalProgressFromKeyResults(
  keyResults: GoalProgressKeyResultInput[],
): number {
  if (keyResults.length === 0) {
    return 0;
  }

  const weightedKeyResults = normalizeWeights(keyResults);
  const progress = weightedKeyResults.reduce((total, keyResult) => {
    return total + normalizeKeyResultProgress(keyResult) * keyResult.weight;
  }, 0);

  return roundToTwo(progress * 100);
}

function normalizeWeights(
  keyResults: GoalProgressKeyResultInput[],
): Array<GoalProgressKeyResultInput & { weight: number }> {
  const explicitWeights = keyResults.map((item) => (item.weight && item.weight > 0 ? item.weight : 0));
  const explicitWeightTotal = explicitWeights.reduce((total, weight) => total + weight, 0);

  if (explicitWeightTotal > 0) {
    return keyResults.map((item, index) => ({
      ...item,
      weight: explicitWeights[index] / explicitWeightTotal,
    }));
  }

  const equalWeight = 1 / keyResults.length;
  return keyResults.map((item) => ({
    ...item,
    weight: equalWeight,
  }));
}

function normalizeKeyResultProgress(keyResult: GoalProgressKeyResultInput): number {
  if (keyResult.type === KeyResultType.BOOLEAN) {
    return keyResult.currentValue && keyResult.currentValue >= 1 ? 1 : 0;
  }

  if (
    keyResult.startValue == null ||
    keyResult.targetValue == null ||
    keyResult.currentValue == null
  ) {
    return 0;
  }

  if (keyResult.targetValue === keyResult.startValue) {
    return keyResult.currentValue >= keyResult.targetValue ? 1 : 0;
  }

  const progress =
    (keyResult.currentValue - keyResult.startValue) /
    (keyResult.targetValue - keyResult.startValue);

  return clamp(progress, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}
