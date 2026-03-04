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

test("manager team reviews page loads with direct-report rows", async ({ page }) => {
  await loginAsManager(page);

  await page.getByTestId("nav-link-team-reviews").click();
  await expect(page).toHaveURL(/\/performance\/team-reviews$/);
  await expect(page.getByRole("heading", { name: "My Team" })).toBeVisible();
  await expect(page.getByTestId("my-team-team-size-pill")).toBeVisible();
  await expect(page.getByTestId("my-team-secondary-reviews-link")).toBeVisible();
  await expect(page.getByTestId("my-team-insights")).toBeVisible();
  await expect(page.getByTestId("team-reviews-row").first()).toBeVisible();
  await page.getByTestId("my-team-open-profile-emp_employee_1").click();
  await expect(page.getByTestId("my-team-profile-drawer")).toBeVisible();
  await expect(page.getByTestId("my-team-drawer-mini-insights")).toBeVisible();
  await page.getByTestId("my-team-profile-drawer-close").click();
  await expect(page.getByTestId("my-team-profile-drawer")).toHaveCount(0);
  await expect(page.getByTestId("my-team-profile-drawer-empty")).toBeVisible();

  await page.getByTestId("my-team-open-profile-emp_employee_1").click();
  await page.getByTestId("my-team-drawer-open-review").click();
  await expect(page).toHaveURL(/\/performance\/reviews\/[^/]+\/write\/[^/]+$/);
});

test("packet route keeps one active nav item and enables focus layout collapse", async ({ page }) => {
  await loginAsManager(page);
  await page.goto("/performance/reviews/cycle_seed_draft_1/packet/emp_employee_1");

  await expect(page.getByTestId("app-shell-sidebar")).toHaveAttribute("data-collapsed", "true");
  await expect(page.locator('a[aria-current="page"]')).toHaveCount(1);
  await expect(page.getByTestId("nav-link-packets")).toHaveAttribute("aria-current", "page");
  await expect(page.getByTestId("nav-link-reviews")).not.toHaveAttribute("aria-current", "page");

  await page.getByTestId("focus-layout-toggle-nav").click();
  await expect(page.getByTestId("app-shell-sidebar")).toHaveAttribute("data-collapsed", "false");
});
