export const reportingChartTheme = {
  progress: {
    notStarted: "var(--chart-progress-not-started)",
    inProgress: "var(--chart-progress-in-progress)",
    completed: "var(--chart-progress-completed)",
  },
  ratingSource: {
    FINAL: "var(--chart-rating-final)",
    SCORECARD: "var(--chart-rating-scorecard)",
  },
  competency: {
    low: "var(--chart-competency-low)",
    medium: "var(--chart-competency-medium)",
    high: "var(--chart-competency-high)",
  },
  metricSeries: {
    self: "var(--chart-metric-self)",
    manager: "var(--chart-metric-manager)",
    gap: "var(--chart-metric-gap)",
  },
} as const;
