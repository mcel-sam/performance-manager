import { expect, test } from "@playwright/test";

test("home loads and primary navigation opens reviews", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Reviews, calibration, and improvement plans",
    }),
  ).toBeVisible();
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
