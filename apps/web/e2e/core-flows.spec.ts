import { expect, test } from "@playwright/test";

import { ensureDemoSetup, loginAsManager } from "./helpers/demo";

test.beforeAll(async ({ request }) => {
  await ensureDemoSetup(request);
});

test("reviews tasks list loads", async ({ page }) => {
  await loginAsManager(page);
  await page.goto("/performance/reviews");

  await expect(
    page.getByRole("heading", {
      name: "Performance Reviews",
    }),
  ).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Review" }).first()).toBeVisible();
});

test("write review autosave and submit locks the submission", async ({ page }) => {
  await loginAsManager(page);
  await page.goto("/performance/reviews/cycle_seed_draft_1/write/submission_seed_employee_manager_1");

  await expect(page.getByTestId("write-review-breadcrumb")).toBeVisible();
  await expect(page.getByText("Phase Navigation")).toHaveCount(0);
  await expect(page.getByTestId("write-review-section-1")).toBeVisible();
  await expect(page.getByTestId("write-review-context-toggle")).toHaveText("Show details");
  await page.getByTestId("write-review-context-toggle").click();
  await expect(page.getByTestId("write-review-context-toggle")).toHaveText("Hide details");
  await page.getByTestId("write-review-selected-answer-toggle").click();
  await expect(page.getByTestId("write-review-selected-answer-toggle")).toHaveText(
    "Hide full prompt",
  );
  await page.getByTestId("write-review-evidence-search").fill("zzzz-no-match");
  await expect(page.getByText("No evidence matches")).toBeVisible();
  await page.getByTestId("write-review-evidence-search").fill("");

  const firstAnswer = page.getByTestId("write-review-answer-template_q_1");
  const secondAnswer = page.getByTestId("write-review-answer-template_q_2");
  const noteSuffix = Date.now();

  await firstAnswer.fill(`Manager impact summary ${noteSuffix}`);
  await expect(page.getByTestId("write-review-save-state")).toHaveText("Saved", {
    timeout: 10_000,
  });
  if (!(await secondAnswer.isVisible())) {
    await page.getByTestId("write-review-next-section").click();
  }
  await secondAnswer.fill(`Manager growth guidance ${noteSuffix}`);
  await expect(page.getByTestId("write-review-save-state")).toHaveText("Saved", {
    timeout: 10_000,
  });

  await page.getByTestId("write-review-submit").click();
  await expect(page.getByText("now read-only")).toBeVisible();
  await expect(page.getByTestId("write-review-submit")).toHaveText("Submitted");
});

test("packet page renders for manager visibility scope", async ({ page }) => {
  await loginAsManager(page);
  await page.goto("/performance/reviews/cycle_seed_draft_1/packet/emp_employee_1");

  await expect(page.locator("header").getByRole("heading", { name: /Elliot/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Evidence counts" })).toBeVisible();
  await expect(page.getByText("Packet visibility")).toBeVisible();
});

test("calibration allows drawer context and placement movement", async ({ page }) => {
  await loginAsManager(page);
  await page.goto("/performance/calibration/calibration_session_seed_1");

  await page.getByTestId("calibration-placement-emp_employee_1").click();
  await expect(page.getByRole("heading", { name: "Participant Context" })).toBeVisible();
  await page.getByTestId("calibration-performance-select").selectOption("HIGH");
  await page.getByTestId("calibration-potential-select").selectOption("LOW");
  await page.getByTestId("calibration-save-placement").click();
  await expect(page.getByTestId("calibration-save-placement")).toHaveText("Save placement");

  await page.reload();
  await page.getByTestId("calibration-placement-emp_employee_1").click();
  await expect(page.getByTestId("calibration-potential-select")).toHaveValue("LOW");
});

test("improvement plan check-in creates a timeline entry", async ({ page }) => {
  await loginAsManager(page);
  await page.goto("/performance/improvement-plans/improvement_plan_seed_1");

  const checkInNote = `E2E check-in ${Date.now()}`;
  await page.getByTestId("improvement-checkin-input").fill(checkInNote);
  await page.getByTestId("improvement-checkin-submit").click();

  await expect(page.getByText("Check-in added.")).toBeVisible();
  await expect(page.getByText(checkInNote)).toBeVisible();
});
