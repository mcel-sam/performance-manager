import { expect, type Locator, type Page } from "@playwright/test";

export async function getSettledByTestId(
  page: Page,
  testId: string,
): Promise<Locator> {
  const locator = page.getByTestId(testId);
  await expect(locator).toHaveCount(1);
  return locator.first();
}
