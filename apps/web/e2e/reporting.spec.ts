import { expect, test, type Download, type Page } from "@playwright/test";

import { ensureDemoSetup, loginAsHrAdmin } from "./helpers/demo";

test.beforeAll(async ({ request }) => {
  await ensureDemoSetup(request);
});

test("reporting page applies filters and clears chips", async ({ page }) => {
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
  await expect(page.getByTestId("reporting-filter-chip-department")).toContainText(
    "Department: Operations",
  );
  const filteredRows = await page.getByTestId("reporting-employee-row").count();
  expect(filteredRows).toBeLessThan(initialRows);

  await page.getByTestId("reporting-filter-chip-clear-department").click();
  await expect(page).not.toHaveURL(/department=Operations/);
  await expect(page.getByTestId("reporting-filter-chip-department")).toHaveCount(0);
});

test("reporting competency drilldown opens from summary table", async ({ page }) => {
  await loginAsHrAdmin(page);
  await page.goto("/admin/performance/reporting?tab=competencies");

  await expect(page.getByRole("heading", { name: "Competency summary" })).toBeVisible();
  await page.locator('[data-testid^="reporting-competency-cell-"]').first().click();

  await expect(page).toHaveURL(/tab=competencies/);
  await expect(page.getByTestId("reporting-competency-drilldown")).toBeVisible();
  await page.getByTestId("reporting-competency-drilldown-close").click();
  await expect(page.getByTestId("reporting-competency-drilldown")).toHaveCount(0);
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
  const downloadButton = page.getByTestId(testId);
  await expect(downloadButton).toBeEnabled();

  let download: Download | undefined;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 20_000 }),
        downloadButton.click(),
      ]);
      break;
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("PNG download did not start.");
      await page.waitForTimeout(750 * attempt);
    }
  }

  if (!download) {
    throw lastError ?? new Error("PNG download did not start.");
  }

  expect(download.suggestedFilename()).toMatch(/\.png$/);

  const stream = await download.createReadStream();
  expect(stream).not.toBeNull();

  let totalBytes = 0;
  for await (const chunk of stream!) {
    totalBytes += chunk.length;
  }

  expect(totalBytes).toBeGreaterThan(1024);
}
