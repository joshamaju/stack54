import test, { expect } from "@playwright/test";

test("should stream async content", async ({ page }) => {
  await page.goto("/stream/await", { waitUntil: "commit" });

  const locator = page.getByTestId("native-await");

  await expect(locator).toContainText("Loading Native");

  await page.waitForLoadState("domcontentloaded");

  await expect(locator).toContainText("Native: Success");
});

test("should stream async content - direct Await component", async ({
  page,
}) => {
  await page.goto("/stream/direct", { waitUntil: "commit" });

  const locator = page.getByTestId("await-component");

  await expect(locator).toContainText("Loading Component");

  await page.waitForLoadState("domcontentloaded");

  await expect(locator).toContainText("Component: Success");
});
