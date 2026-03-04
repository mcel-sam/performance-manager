import { expect, test } from "@playwright/test";

import { ensureDemoSetup, loginAsManager } from "./helpers/demo";

test.beforeAll(async ({ request }) => {
  await ensureDemoSetup(request);
});

test("premium shell header shows org pill and profile menu", async ({ page }) => {
  await loginAsManager(page);

  await expect(page.getByTestId("app-header-org-pill")).toContainText("Ironcrest");
  await page.getByTestId("app-header-profile-button").click();
  await expect(page.getByTestId("app-header-profile-menu")).toBeVisible();
  await expect(page.getByTestId("profile-menu-sign-out")).toBeVisible();
  await expect(page.getByTestId("profile-menu-switch-role")).toBeVisible();
});
