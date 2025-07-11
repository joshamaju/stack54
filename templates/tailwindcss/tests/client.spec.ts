import { expect, test } from "@playwright/test";

test("should render index page", async ({ page }) => {
  await page.goto("/");
  expect(await page.title()).toBe("stack54");
});
