import { expect, test } from "@playwright/test";

import { ensureDemoSetup, loginAsEmployee, loginAsManager } from "./helpers/demo";

test.beforeAll(async ({ request }) => {
  await ensureDemoSetup(request);
});

test("home loads and primary navigation opens reviews", async ({ page }) => {
  await loginAsManager(page);

  await expect(
    page.getByRole("heading", {
      name: "Performance workflows by role",
    }),
  ).toBeVisible();
  await expect(page.getByTestId("nav-link-help")).toBeVisible();
  await expect(page.getByTestId("nav-link-reviews")).toBeVisible();
  await expect(page.getByTestId("home-getting-started-link-0")).toBeVisible();

  await page.getByTestId("nav-link-reviews").click();
  await expect(page).toHaveURL(/\/performance\/reviews$/);
  await expect(
    page.getByRole("heading", {
      name: "Performance Reviews",
    }),
  ).toBeVisible();
});

test("employee navigation hides admin and calibration modules", async ({ page }) => {
  await loginAsEmployee(page);

  await expect(page.getByTestId("nav-link-home")).toBeVisible();
  await expect(page.getByTestId("nav-link-reviews")).toBeVisible();
  await expect(page.getByTestId("nav-link-help")).toBeVisible();
  await expect(page.getByTestId("nav-link-admin-cycles")).toHaveCount(0);
  await expect(page.getByTestId("nav-link-admin-calibration")).toHaveCount(0);
  await expect(page.getByTestId("nav-link-admin-reporting")).toHaveCount(0);
  await expect(page.getByTestId("nav-link-calibration")).toHaveCount(0);
});
