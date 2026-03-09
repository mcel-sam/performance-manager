import { expect, test } from "@playwright/test";

import {
  ensureDemoSetup,
  loginAsEmployee,
  loginAsHrAdmin,
  loginAsManager,
} from "./helpers/demo";

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
  await expect(page.getByTestId("home-getting-started-link-0")).toBeVisible();
  await expect(page.getByTestId("home-summary-title")).toHaveText("My team");
  await expect(page.getByText("Direct reports")).toBeVisible();
  await expect(page.getByText("Awaiting manager review")).toBeVisible();
  await expect(page.getByText("Self reviews not started")).toBeVisible();
  const homeTaskTexts = await page
    .locator('[data-testid^="home-getting-started-link-"]')
    .allTextContents();
  expect(homeTaskTexts.length).toBeGreaterThan(0);
  expect(homeTaskTexts.every((text) => text.includes("review"))).toBe(true);
  expect(homeTaskTexts.some((text) => text.includes("Submitted"))).toBe(false);
  await expect(page.getByTestId("app-shell-sidebar")).toHaveAttribute("data-collapsed", "true");

  await openMenu(page);
  await expect(page.getByTestId("nav-link-help")).toBeVisible();
  await expect(page.getByTestId("nav-link-reviews")).toBeVisible();
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

  await openMenu(page);
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

  await openMenu(page);
  await page.getByTestId("nav-link-team-reviews").click();
  await expect(page).toHaveURL(/\/performance\/team-reviews$/);
  await expect(page.getByRole("heading", { name: "My Team" })).toBeVisible();
  await expect(page.getByTestId("my-team-team-size-pill")).toBeVisible();
  await expect(page.getByTestId("my-team-secondary-reviews-link")).toBeVisible();
  await expect(page.getByTestId("my-team-insights")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Direct report" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Role" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Reviews" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Feedback" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Next step" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Self" })).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Manager" })).toHaveCount(0);
  await expect(page.getByTestId("my-team-insights")).toContainText("5 star");
  await expect(page.getByTestId("team-reviews-row").first()).toBeVisible();
  await page.getByTestId("my-team-open-profile-emp_employee_1").click();
  await expect(page.getByTestId("my-team-profile-drawer")).toBeVisible();
  await expect(page.getByTestId("my-team-drawer-mini-insights")).toBeVisible();
  await expect(page.getByTestId("my-team-drawer-mini-insights")).toContainText("Review coverage:");
  await expect(page.getByTestId("my-team-drawer-open-packet")).toBeVisible();
  await page.getByTestId("my-team-profile-drawer-close").click();
  await expect(page.getByTestId("my-team-profile-drawer")).toHaveCount(0);
  await expect(page.getByTestId("my-team-profile-drawer-empty")).toBeVisible();

  await page.getByTestId("my-team-open-profile-emp_employee_1").click();
  await page.getByTestId("my-team-drawer-open-review").click();
  await expect(page).toHaveURL(/\/performance\/reviews\/[^/]+\/write\/[^/]+$/);
});

test("hr admin home shows a cycle overview summary", async ({ page }) => {
  await loginAsHrAdmin(page);

  await expect(page.getByTestId("home-summary-title")).toHaveText("Cycle overview");
  await expect(page.getByText("Live cycles")).toBeVisible();
  await expect(page.getByText("Cycles in draft")).toBeVisible();
  await expect(page.getByText("Open submissions")).toBeVisible();
});

test("packet route keeps one active nav item and enables focus layout collapse", async ({ page }) => {
  await loginAsManager(page);
  await page.goto("/performance/reviews/cycle_seed_draft_1/packet/emp_employee_1");

  await expect(page.getByTestId("app-shell-sidebar")).toHaveAttribute("data-collapsed", "true");
  await expect(page.locator('a[aria-current="page"]')).toHaveCount(1);

  await page.getByTestId("app-shell-sidebar-toggle").click();
  await expect(page.getByTestId("app-shell-sidebar")).toHaveAttribute("data-collapsed", "false");
  await expect(page.getByTestId("nav-link-packets")).toHaveCount(0);
  await expect(page.getByTestId("nav-link-reviews")).toHaveAttribute("aria-current", "page");
});

test("sidebar toggle keeps header position stable and shows tooltips when collapsed", async ({
  page,
}) => {
  await loginAsManager(page);

  const sidebar = page.getByTestId("app-shell-sidebar");
  const toggle = page.getByTestId("app-shell-sidebar-toggle");
  const header = page.getByTestId("app-shell-header");
  const viewport = page.viewportSize();

  await expect(sidebar).toHaveAttribute("data-collapsed", "true");
  expect(viewport).not.toBeNull();
  const compactSidebarBox = await sidebar.boundingBox();
  expect(compactSidebarBox).not.toBeNull();
  expect(compactSidebarBox?.height ?? 0).toBeLessThan((viewport?.height ?? 0) - 120);
  const collapsedBox = await header.boundingBox();
  expect(collapsedBox).not.toBeNull();
  const collapsedX = collapsedBox?.x ?? 0;

  await toggle.click();
  await expect(sidebar).toHaveAttribute("data-collapsed", "false");
  await page.waitForTimeout(350);
  const expandedBox = await header.boundingBox();
  expect(expandedBox).not.toBeNull();
  const expandedX = expandedBox?.x ?? 0;
  expect(Math.abs(expandedX - collapsedX)).toBeGreaterThanOrEqual(180);
  expect(Math.abs(expandedX - collapsedX)).toBeLessThanOrEqual(196);

  await toggle.click();
  await expect(sidebar).toHaveAttribute("data-collapsed", "true");
  await page.waitForTimeout(350);
  const collapsedAgainBox = await header.boundingBox();
  expect(collapsedAgainBox).not.toBeNull();
  const collapsedAgainX = collapsedAgainBox?.x ?? 0;
  expect(Math.abs(collapsedAgainX - collapsedX)).toBeLessThanOrEqual(4);

  const reviewsNavLink = page.getByTestId("nav-link-reviews");
  await reviewsNavLink.hover();
  await expect(page.getByTestId("app-shell-sidebar-tooltip-reviews")).toBeVisible();
});

async function openMenu(page: import("@playwright/test").Page) {
  const sidebar = page.getByTestId("app-shell-sidebar");
  if ((await sidebar.getAttribute("data-collapsed")) === "true") {
    await page.getByTestId("app-shell-sidebar-toggle").click();
  }
  await expect(page.getByTestId("app-shell-sidebar")).toHaveAttribute("data-collapsed", "false");
}
