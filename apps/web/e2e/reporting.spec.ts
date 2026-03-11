import { expect, test, type Download, type Page } from "@playwright/test";

import { ensureDemoSetup, loginAsHrAdmin } from "./helpers/demo";
import { getSettledByTestId } from "./helpers/locators";

test.beforeAll(async ({ request }) => {
  await ensureDemoSetup(request);
});

test("reporting page applies filters and clears chips", async ({ page }) => {
  await loginAsHrAdmin(page);
  await page.goto("/admin/performance/reporting?tab=queue");

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

  await expect(page.getByRole("heading", { name: "Competency heatmap" })).toBeVisible();
  await page.locator('[data-testid^="reporting-competency-cell-"]').first().click();

  await expect(page).toHaveURL(/tab=competencies/);
  const drilldown = page.getByTestId("reporting-competency-drilldown");
  await expect(drilldown).toHaveCount(1);
  await expect(drilldown.first()).toBeVisible();
  await expect(page.getByTestId("reporting-competency-department-chart")).toBeVisible();
  await page.getByRole("link", { name: "Clear focus" }).click();
  await expect(page.getByTestId("reporting-competency-drilldown")).toHaveCount(0);
});

test("reporting employee queue uses explicit status filters", async ({ page }) => {
  await loginAsHrAdmin(page);
  await page.goto("/admin/performance/reporting?tab=queue");

  const beforeDrilldown = await page.getByTestId("reporting-employee-row").count();
  const inProgressFilter = await getSettledByTestId(
    page,
    "reporting-queue-filter-IN_PROGRESS",
  );
  await inProgressFilter.click();

  await expect(page).toHaveURL(/tab=queue/);
  await expect(page).toHaveURL(/status=IN_PROGRESS/);
  await expect(page.getByRole("heading", { name: "Employee queue" })).toBeVisible();

  const afterDrilldown = await page.getByTestId("reporting-employee-row").count();
  expect(afterDrilldown).toBeLessThan(beforeDrilldown);

  await page.getByTestId("reporting-queue-filter-all").click();
  await expect(page).not.toHaveURL(/status=IN_PROGRESS/);
});

test("reporting exposes manager accountability as a dedicated tab", async ({ page }) => {
  await loginAsHrAdmin(page);
  await page.goto("/admin/performance/reporting?tab=overview");

  const managersTab = await getSettledByTestId(page, "reporting-tab-managers");
  await managersTab.click();
  await expect(page).toHaveURL(/tab=managers/);
  await expect(page.getByTestId("reporting-manager-overview")).toBeVisible();

  await page.getByTestId("reporting-manager-row").first().getByRole("button").click();
  await expect(page.getByTestId("reporting-manager-drilldown")).toBeVisible();
});

test("reporting charts expose png download actions", async ({ page }) => {
  await loginAsHrAdmin(page);
  await page.goto("/admin/performance/reporting?tab=overview");
  await expect(await getSettledByTestId(page, "reporting-download-progress-png")).toBeVisible();
  await expectPngDownload(page, "reporting-download-progress-png");

  const resultsTab = await getSettledByTestId(page, "reporting-tab-results");
  await resultsTab.click();
  await expect(await getSettledByTestId(page, "reporting-download-results-png")).toBeVisible();
  await expectPngDownload(page, "reporting-download-results-png");

  await page.goto("/admin/performance/reporting?tab=competencies");
  await page.locator('[data-testid^="reporting-competency-cell-"]').first().click();
  await expect(await getSettledByTestId(page, "reporting-download-competency-png")).toBeVisible();
  await expectPngDownload(page, "reporting-download-competency-png");

  await page.goto("/admin/performance/reporting?tab=scorecard");
  await expect(await getSettledByTestId(page, "reporting-download-scorecard-png")).toBeVisible();
  await expectPngDownload(page, "reporting-download-scorecard-png");
});

async function expectPngDownload(page: Page, testId: string) {
  const settledDownloadButton = await getSettledByTestId(page, testId);
  await expect(settledDownloadButton).toBeEnabled();

  let download: Download | undefined;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 20_000 }),
        settledDownloadButton.click(),
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
