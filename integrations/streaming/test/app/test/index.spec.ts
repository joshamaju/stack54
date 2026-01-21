import { test, expect } from "@playwright/test";

test("should stream async content", async ({ page }) => {
  await page.goto("/await", { waitUntil: "commit" });

  const locator = page.getByTestId("native-await");

  await expect(locator).toContainText("Loading Native");

  await page.waitForLoadState("domcontentloaded");

  await expect(locator).toContainText("Native: Success");
});

test("should stream async content with no pending/fallback state", async ({
  page,
}) => {
  await page.goto("/await/then", { waitUntil: "commit" });

  const locator = page.getByTestId("native-await");

  await expect(locator).toContainText("");

  await page.waitForLoadState("domcontentloaded");

  await expect(locator).toContainText("Native: Success");
});

test("should stream error async content with no fallback state", async ({
  page,
}) => {
  await page.goto("/await/catch", { waitUntil: "commit" });

  const locator = page.getByTestId("native-await");

  await expect(locator).toContainText("");

  await page.waitForLoadState("domcontentloaded");

  await expect(locator).toContainText("Error: Success");
});

test("should only stream resolved content if async content resolves quickly", async ({
  page,
}) => {
  await page.goto("/await/fast", { waitUntil: "commit" });

  const locator = page.getByTestId("native-await");

  await expect(locator).toContainText("Native: Success");

  await page.waitForLoadState("domcontentloaded");

  await expect(locator).toContainText("Native: Success");
});

test("should auto inject svelte script instance if non present", async ({
  page,
}) => {
  await page.goto("/no-script", { waitUntil: "commit" });

  const locator = page.getByTestId("native-await");

  await expect(locator).toContainText("Loading Native");

  await page.waitForLoadState("domcontentloaded");

  await expect(locator).toContainText("Native: Success");
});

test("should stream async content - direct Await component", async ({
  page,
}) => {
  await page.goto("/direct", { waitUntil: "commit" });

  const locator = page.getByTestId("await-component");

  await expect(locator).toContainText("Loading Component");

  await page.waitForLoadState("domcontentloaded");

  await expect(locator).toContainText("Component: Success");
});
