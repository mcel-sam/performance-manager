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
  await expect(page.getByRole("columnheader", { name: "Cycle" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Subject" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Review type" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Due" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Action" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Priority" })).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Owner" })).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Progress" })).toHaveCount(0);
  await expect(page.getByTestId("reviews-filter-relationship")).toContainText("Manager feedback");
  await expect(page.getByRole("button", { name: "Open Review" }).first()).toBeVisible();
});

test("write review autosave and submit locks the submission", async ({ page }) => {
  await loginAsManager(page);
  await page.goto("/performance/reviews/cycle_seed_draft_1/write/submission_seed_employee_manager_1");

  await expect(page.getByText("Focus mode: review writing")).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to Reviews" })).toBeVisible();
  await expect(page.getByText("Phase Navigation")).toHaveCount(0);
  await expect(page.getByTestId("write-review-section-1")).toContainText("Impact / Results");
  await expect(page.getByTestId("write-review-evidence-overview")).toBeVisible();
  await expect(page.getByTestId("write-review-evidence-target")).toContainText(
    "What impact did this employee deliver this year?",
  );
  await expect(page.getByTestId("write-review-context-toggle")).toHaveCount(0);
  await expect(page.getByTestId("write-review-selected-answer-toggle")).toHaveCount(0);
  await page.getByTestId("write-review-evidence-search").fill("zzzz-no-match");
  await expect(page.getByText("No evidence matches")).toBeVisible();
  await page.getByTestId("write-review-evidence-search").fill("");

  const firstAnswer = page.getByTestId("write-review-answer-template_q_1");
  const secondAnswer = page.getByTestId("write-review-answer-template_q_2");
  const noteSuffix = Date.now();

  await firstAnswer.fill("");
  await page.getByTestId("write-review-next-section").click();
  await expect(page.getByText("1 required response remaining in Impact / Results.")).toBeVisible();
  await expect(firstAnswer).toBeFocused();

  await firstAnswer.fill(`Manager impact summary ${noteSuffix}`);
  await expect(page.getByTestId("write-review-save-state")).toHaveText("Saved", {
    timeout: 10_000,
  });
  await page.getByRole("button", { name: /Growth \/ Development/i }).click();
  await expect(page.getByTestId("write-review-active-section-label")).toContainText(
    "Growth / Development",
  );
  await secondAnswer.fill(`Manager growth guidance ${noteSuffix}`);
  await expect(page.getByTestId("write-review-save-state")).toHaveText("Saved", {
    timeout: 10_000,
  });

  await page.getByRole("button", { name: /Final summary/i }).click();
  await expect(page.getByTestId("write-review-final-summary")).toBeVisible();

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

test("write review returns to the filtered reviews queue", async ({ page }) => {
  await loginAsManager(page);
  await page.goto("/performance/reviews?relationship=UPWARD");

  await page.getByRole("button", { name: "Open Review" }).first().click();
  await expect(page.getByRole("link", { name: "Back to Reviews" })).toBeVisible();
  await page.getByRole("link", { name: "Back to Reviews" }).click();

  await expect(page).toHaveURL(/\/performance\/reviews\?relationship=UPWARD/);
  await expect(page.getByTestId("reviews-filter-relationship")).toHaveValue("UPWARD");
});

test("my team drill-in returns to the selected direct report", async ({ page }) => {
  await loginAsManager(page);
  await page.goto("/performance/team-reviews?employeeId=emp_employee_1");

  await expect(page.getByTestId("my-team-profile-drawer")).toBeVisible();
  await page.getByTestId("my-team-drawer-open-review").click();
  await expect(page.getByRole("link", { name: "Back to My Team" })).toBeVisible();
  await page.getByRole("link", { name: "Back to My Team" }).click();

  await expect(page).toHaveURL(/\/performance\/team-reviews\?.*employeeId=emp_employee_1/);
  await expect(page.getByTestId("my-team-profile-drawer")).toBeVisible();
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
  await page.goto("/performance/improvement-plans");
  await page.getByRole("button", { name: "Open Plan" }).first().click();

  const checkInNote = `E2E check-in ${Date.now()}`;
  await page.getByTestId("improvement-checkin-input").fill(checkInNote);
  await page.getByTestId("improvement-checkin-submit").click();

  await expect(page.getByText("Check-in added.")).toBeVisible();
  await expect(page.getByText(checkInNote)).toBeVisible();
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page).toHaveURL(/\/performance\/improvement-plans$/);
});
