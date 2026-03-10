import { expect, test } from "@playwright/test";

import { ensureDemoSetup, loginAsHrAdmin, loginAsManager } from "./helpers/demo";

test.beforeEach(async ({ request }) => {
  await ensureDemoSetup(request);
});

test("hr admin can create a succession position and add a candidate", async ({ page }) => {
  await loginAsHrAdmin(page);
  await page.goto("/admin/talent/succession");

  await expect(page.getByRole("heading", { name: "Succession Planning" })).toBeVisible();
  await expect(page.getByTestId("succession-export-positions")).toBeVisible();
  await expect(page.getByTestId("succession-export-coverage")).toBeVisible();

  await page.goto("/admin/talent/succession/positions/new");
  await expect(page.getByRole("heading", { name: "Create succession position" })).toBeVisible();

  await page.getByLabel("Position title").fill("Assistant Superintendent Bench");
  await page.getByLabel("Department").fill("Operations");
  await page.getByLabel("Location").fill("Edmonton");
  await page.getByLabel("Plan owner").selectOption("emp_hr_admin_1");
  await page.getByLabel("Visibility scope").selectOption("MANAGERS_IN_SCOPE");
  await page.getByLabel("Review cadence").fill("Monthly");
  await page
    .getByLabel("Planning notes")
    .fill("Keep one ready-now foreman and one medium-term successor active.");
  await page.getByTestId("succession-position-submit").click();

  await expect(page).toHaveURL(/\/admin\/talent\/succession\/positions\/[^/]+$/);
  await expect(page.getByRole("heading", { name: "Assistant Superintendent Bench" })).toBeVisible();
  await expect(page.getByTestId("succession-candidate-form")).toBeVisible();

  await page.getByLabel("Candidate").selectOption("emp_employee_1");
  await page.getByLabel("Readiness").selectOption("READY_NOW");
  await page.getByLabel("Priority rank").fill("1");
  await page.getByLabel("Risk of loss").selectOption("HIGH");
  await page.getByLabel("Confidence").selectOption("MEDIUM");
  await page.getByTestId("succession-candidate-submit").click();

  const elliotCard = page.locator("article", {
    has: page.getByRole("heading", { name: "Elliot Barnes", level: 3 }),
  });
  await expect(elliotCard).toBeVisible();
  await expect(elliotCard).toContainText("Risk HIGH");
  await expect(elliotCard).toContainText("Confidence MEDIUM");
});

test("manager view stays scoped and supports proposing a direct report", async ({ page }) => {
  await loginAsManager(page);
  await page.goto("/talent/succession");

  await expect(page.getByRole("heading", { name: "My Succession Area" })).toBeVisible();
  await expect(page.getByText("Field Training Lead")).toBeVisible();
  await expect(page.getByText("Dispatch Lead")).toHaveCount(0);

  await page.goto(
    "/talent/succession/positions/position_seed_field_training_lead?candidateId=succession_candidate_seed_training_noah",
  );

  await expect(page.getByRole("heading", { name: "Field Training Lead" })).toBeVisible();
  await expect(page.getByTestId("right-drawer")).toBeVisible();
  await expect(page.getByText("Risk of loss")).toHaveCount(0);
  await expect(page.getByText("Confidence")).toHaveCount(0);

  await page.getByLabel("Candidate").selectOption("emp_employee_8");
  await page.getByLabel("Readiness").selectOption("ONE_TO_TWO_YEARS");
  await page.getByLabel("Priority rank").fill("2");
  await page.getByTestId("succession-candidate-submit").click();

  const sofiaCard = page.locator("article", {
    has: page.getByRole("heading", { name: "Sofia Kim", level: 3 }),
  });
  await expect(sofiaCard).toBeVisible();
  await expect(sofiaCard).toContainText("Manager proposal");
});
