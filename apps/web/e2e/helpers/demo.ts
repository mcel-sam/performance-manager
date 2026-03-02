import { expect, type APIRequestContext, type Page } from "@playwright/test";

export async function ensureDemoSetup(request: APIRequestContext) {
  const response = await request.post("/api/demo/reset", {
    data: { confirmation: "RESET" },
  });

  expect(response.ok()).toBeTruthy();
}

export async function loginAsManager(page: Page) {
  await page.goto("/login");
  await page.getByTestId("login-role-manager").click();
  await expect(page).toHaveURL(/\/$/);
}

export async function loginAsHrAdmin(page: Page) {
  await page.goto("/login");
  await page.getByTestId("login-role-hr-admin").click();
  await expect(page).toHaveURL(/\/$/);
}
