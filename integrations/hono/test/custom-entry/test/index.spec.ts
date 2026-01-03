import { test, expect } from "@playwright/test";

test("should attach user server to vite dev server", async ({ page }) => {
  await page.goto("/");
  const text = page.getByTestId("home");
  expect(await text.textContent()).toBe("Hello world");
});
