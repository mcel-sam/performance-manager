import { KeyResultType } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  prepareGoalKeyResults,
  type GoalComposerKeyResultDraft,
} from "@/components/goals/goal-composer-utils";

function buildDraft(
  overrides: Partial<GoalComposerKeyResultDraft> = {},
): GoalComposerKeyResultDraft {
  return {
    title: "",
    type: KeyResultType.PERCENT,
    startValue: "",
    targetValue: "",
    currentValue: "",
    weight: "",
    ...overrides,
  };
}

describe("prepareGoalKeyResults", () => {
  it("ignores fully blank drafts so goals can be saved without key results", () => {
    const result = prepareGoalKeyResults([buildDraft()]);

    expect(result.error).toBeUndefined();
    expect(result.keyResults).toEqual([]);
  });

  it("returns a validation error for partially completed drafts without a title", () => {
    const result = prepareGoalKeyResults([
      buildDraft({
        currentValue: "42",
      }),
    ]);

    expect(result.keyResults).toEqual([]);
    expect(result.error).toBe("Each key result needs a title, or remove the blank draft before saving.");
  });

  it("keeps valid drafts and normalizes numbers in display order", () => {
    const result = prepareGoalKeyResults([
      buildDraft(),
      buildDraft({
        title: "Ship onboarding refresh",
        type: KeyResultType.NUMBER,
        startValue: "10",
        currentValue: "18",
        targetValue: "25",
        weight: "2.5",
      }),
      buildDraft({
        id: "kr_existing_1",
        title: "Launch manager enablement",
        type: KeyResultType.BOOLEAN,
        currentValue: "1",
        targetValue: "1",
      }),
    ]);

    expect(result.error).toBeUndefined();
    expect(result.keyResults).toEqual([
      {
        title: "Ship onboarding refresh",
        type: KeyResultType.NUMBER,
        startValue: 10,
        currentValue: 18,
        targetValue: 25,
        weight: 2.5,
        sortOrder: 0,
      },
      {
        id: "kr_existing_1",
        title: "Launch manager enablement",
        type: KeyResultType.BOOLEAN,
        startValue: null,
        currentValue: 1,
        targetValue: 1,
        weight: null,
        sortOrder: 1,
      },
    ]);
  });
});
