import { expect, test } from "@playwright/test";

import { ensureDemoSetup, loginAsHrAdmin } from "./helpers/demo";

test.beforeAll(async ({ request }) => {
  await ensureDemoSetup(request);
});

test("reporting page loads and applies filters", async ({ page }) => {
  await loginAsHrAdmin(page);
  await page.goto("/admin/performance/reporting");

  await expect(
    page.getByRole("heading", {
      name: "Reporting",
    }),
  ).toBeVisible();

  await expect(page.getByTestId("reporting-cycle-select")).toBeVisible();

  await page.getByTestId("reporting-tab-results").click();
  await expect(page).toHaveURL(/tab=results/);

  await page
    .getByTestId("reporting-filter-department")
    .selectOption({ label: "Field Operations" });
  await page.getByTestId("reporting-apply-filters").click();

  await expect(page).toHaveURL(/department=Field(\+|%20)Operations/);
  await expect(page.getByTestId("reporting-current-department")).toHaveText(
    "Field Operations",
  );
  await expect(
    page.getByRole("heading", {
      name: "Insufficient data for selected filters",
    }),
  ).toBeVisible();
});
