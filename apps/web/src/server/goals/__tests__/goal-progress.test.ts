import { KeyResultType } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { calculateGoalProgressFromKeyResults } from "@/server/goals/goal-progress";

describe("calculateGoalProgressFromKeyResults", () => {
  it("returns zero when there are no key results", () => {
    expect(calculateGoalProgressFromKeyResults([])).toBe(0);
  });

  it("uses weighted normalized completion for numeric key results", () => {
    const progress = calculateGoalProgressFromKeyResults([
      {
        type: KeyResultType.NUMBER,
        startValue: 0,
        targetValue: 10,
        currentValue: 5,
        weight: 2,
      },
      {
        type: KeyResultType.PERCENT,
        startValue: 0,
        targetValue: 100,
        currentValue: 100,
        weight: 1,
      },
    ]);

    expect(progress).toBe(66.67);
  });

  it("clamps boolean and over-complete progress at 100 percent", () => {
    const progress = calculateGoalProgressFromKeyResults([
      {
        type: KeyResultType.BOOLEAN,
        startValue: null,
        targetValue: null,
        currentValue: 1,
      },
      {
        type: KeyResultType.NUMBER,
        startValue: 10,
        targetValue: 20,
        currentValue: 30,
      },
    ]);

    expect(progress).toBe(100);
  });
});
