import { test, expect } from "@playwright/test";

test("should attach user server to vite dev server", async ({ page }) => {
  const response = await page.goto("/");
  console.log(response?.status, response?.statusText);
  const text = page.getByTestId("home");
  expect(await text.textContent()).toBe("Hello world");
});
