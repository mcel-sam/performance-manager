import { expect, type APIRequestContext, type Page } from "@playwright/test";

export async function ensureDemoSetup(request: APIRequestContext) {
  const response = await request.post("/api/demo/setup", {
    data: { step: "all" },
  });

  expect(response.ok()).toBeTruthy();
}

export async function loginAsManager(page: Page) {
  await page.goto("/demo/login");
  await page.getByLabel("Email").fill("manager@example.com");
  await page.getByLabel("Password").fill("demo-manager");
  await page.getByTestId("demo-login-submit").click();
  await expect(page).toHaveURL(/\/$/);
}
