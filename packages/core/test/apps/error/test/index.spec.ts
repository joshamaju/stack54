import { expect, test } from "@playwright/test";

test("renders a view with conditional markup", async ({ page }) => {
  await page.goto("/invalid-syntax");

  await expect(page.getByTestId("locals")).toHaveText("Syntax");
});

test("reports an exception thrown while rendering a view", async ({ page }) => {
  const response = await page.goto("/render-error");

  expect(response?.status()).toBe(500);
  await expect(page.locator("body")).toContainText("Render error");
});

test("reports an undefined variable while rendering a view", async ({ page }) => {
  const response = await page.goto("/undefined-variable");

  expect(response?.status()).toBe(500);
  await expect(page.locator("body")).toContainText("name is not defined");
});
