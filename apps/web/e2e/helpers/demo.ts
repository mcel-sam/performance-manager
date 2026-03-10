import { expect, type APIRequestContext, type Page } from "@playwright/test";

const playwrightBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export async function ensureDemoSetup(request: APIRequestContext) {
  if (process.env.PLAYWRIGHT_SKIP_DEMO_RESET === "true") {
    return;
  }

  const response = await request.post(new URL("/api/demo/reset", playwrightBaseUrl).toString(), {
    data: { confirmation: "RESET" },
  });

  if (!response.ok()) {
    throw new Error(
      `Demo reset failed with ${response.status()}: ${await response.text()}`,
    );
  }
}

export async function loginAsManager(page: Page) {
  await page.goto("/login");
  await page.getByTestId("login-role-manager").click();
  await expect(page).toHaveURL(/\/$/);
}

export async function loginAsEmployee(page: Page) {
  await page.goto("/login");
  await page.getByTestId("login-role-employee").click();
  await expect(page).toHaveURL(/\/$/);
}

export async function loginAsHrAdmin(page: Page) {
  await page.goto("/login");
  await page.getByTestId("login-role-hr-admin").click();
  await expect(page).toHaveURL(/\/$/);
}

export async function loginAsCalibrator(page: Page) {
  await page.goto("/login");
  await page.getByTestId("login-role-calibrator").click();
  await expect(page).toHaveURL(/\/$/);
}
