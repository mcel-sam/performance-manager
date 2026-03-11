# Goals Domain Notes

## Goal progress calculation

Goal progress is deterministic and derived from key results:

- each key result contributes normalized completion between `0` and `1`
- explicit positive weights are honored; otherwise key results are weighted equally
- `NUMBER` and `PERCENT` key results use `(current - start) / (target - start)`, clamped to `[0, 1]`
- `BOOLEAN` key results are complete when the current value is truthy (`>= 1`)
- the final goal progress is the weighted average multiplied by `100`, rounded to 2 decimals

This rule is implemented in `goal-progress.ts` and is the source of truth for stored `Goal.progressPercent`.
