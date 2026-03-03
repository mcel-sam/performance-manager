import { expect, test, type Page } from "@playwright/test";

import { ensureDemoSetup, loginAsHrAdmin } from "./helpers/demo";

test.beforeAll(async ({ request }) => {
  await ensureDemoSetup(request);
});

test("reporting page loads and applies filters", async ({ page }) => {
  await loginAsHrAdmin(page);
  await page.goto("/admin/performance/reporting?tab=progress");

  await expect(
    page.getByRole("heading", {
      name: "Reporting",
    }),
  ).toBeVisible();

  await expect(page.getByTestId("reporting-cycle-select")).toBeVisible();

  const initialRows = await page.getByTestId("reporting-employee-row").count();

  await page
    .getByTestId("reporting-filter-department")
    .selectOption({ label: "Operations" });
  await page.getByTestId("reporting-apply-filters").click();

  await expect(page).toHaveURL(/department=Operations/);
  await expect(page.getByTestId("reporting-current-department")).toHaveText(
    "Operations",
  );
  const filteredRows = await page.getByTestId("reporting-employee-row").count();
  expect(filteredRows).toBeLessThan(initialRows);
});

test("reporting competency drilldown opens from summary table", async ({ page }) => {
  await loginAsHrAdmin(page);
  await page.goto("/admin/performance/reporting?tab=competencies");

  await expect(page.getByRole("heading", { name: "Competency summary" })).toBeVisible();
  await page.locator('[data-testid^="reporting-competency-cell-"]').first().click();

  await expect(page).toHaveURL(/tab=competencies/);
  await expect(page.getByTestId("reporting-competency-drilldown")).toBeVisible();
});

test("reporting chart drilldown filters employee table", async ({ page }) => {
  await loginAsHrAdmin(page);
  await page.goto("/admin/performance/reporting?tab=progress");

  const beforeDrilldown = await page.getByTestId("reporting-employee-row").count();
  await page.getByTestId("reporting-progress-drilldown-IN_PROGRESS").click();

  await expect(page.getByTestId("reporting-active-drilldowns")).toContainText(
    "In progress",
  );

  const afterDrilldown = await page.getByTestId("reporting-employee-row").count();
  expect(afterDrilldown).toBeLessThan(beforeDrilldown);
});

test("reporting charts expose png download actions", async ({ page }) => {
  await loginAsHrAdmin(page);
  await page.goto("/admin/performance/reporting?tab=progress");
  await expect(page.getByTestId("reporting-download-progress-png")).toBeVisible();
  await expectPngDownload(page, "reporting-download-progress-png");

  await page.getByTestId("reporting-tab-results").click();
  await expect(page.getByTestId("reporting-download-results-png")).toBeVisible();
  await expectPngDownload(page, "reporting-download-results-png");

  await page.goto("/admin/performance/reporting?tab=competencies");
  await page.locator('[data-testid^="reporting-competency-cell-"]').first().click();
  await expect(page.getByTestId("reporting-download-competency-png")).toBeVisible();
  await expectPngDownload(page, "reporting-download-competency-png");

  await page.goto("/admin/performance/reporting?tab=scorecard");
  await expect(page.getByTestId("reporting-download-scorecard-png")).toBeVisible();
  await expectPngDownload(page, "reporting-download-scorecard-png");
});

async function expectPngDownload(page: Page, testId: string) {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId(testId).click(),
  ]);

  expect(download.suggestedFilename()).toMatch(/\.png$/);

  const stream = await download.createReadStream();
  expect(stream).not.toBeNull();

  let totalBytes = 0;
  for await (const chunk of stream!) {
    totalBytes += chunk.length;
  }

  expect(totalBytes).toBeGreaterThan(1024);
}
