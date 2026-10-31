import { expect, test } from "@playwright/test";

test.describe("Svelte 5 islands", () => {
  test("hydrates an island without slotted children", async ({ page }) => {
    await page.goto("/island/no-slot");

    await expect(page.getByTestId("no-slot")).toHaveText("no slot");
    await page.getByTestId("inc").click();
    await expect(page.getByTestId("text")).toHaveText("1");
    await page.getByTestId("dec").click();
    await expect(page.getByTestId("text")).toHaveText("0");
  });

  test("waits for an idle directive before hydrating", async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).requestIdleCallback = (callback: () => void) => {
        (window as any).__stack54IdleCallback = callback;
        return 1;
      };
    });

    await page.goto("/island/idle");
    await page.waitForFunction(() => Boolean((window as any).__stack54IdleCallback));

    await page.getByTestId("inc").click();
    await expect(page.getByTestId("text")).toHaveText("0");

    await page.evaluate(() => (window as any).__stack54IdleCallback());
    await page.getByTestId("inc").click();
    await expect(page.getByTestId("text")).toHaveText("1");
  });

  test("hydrates nested islands after their parent", async ({ page }) => {
    await page.goto("/island/nested");

    await expect(page.getByTestId("nested-parent")).toHaveText("parent");
    await expect(page.getByTestId("nested-child")).toHaveText("child");
    await page.getByTestId("inc").click();
    await expect(page.getByTestId("text")).toHaveText("1");
  });

  test("unmounts an island when its custom element is removed", async ({ page }) => {
    await page.goto("/island/no-slot");
    await expect(page.getByTestId("no-slot")).toHaveText("no slot");

    await page.locator("stack54-island").evaluate((island) => island.remove());
    await expect(page.locator("html")).toHaveAttribute(
      "data-island-cleanup",
      "done",
    );
  });

  test("recovers from changed server markup during hydration", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.route("**/island/no-slot", async (route) => {
      const response = await route.fetch();
      const html = await response.text();
      await route.fulfill({
        response,
        body: html.replace(
          '<p data-testid="no-slot"></p>',
          '<p data-testid="no-slot">changed before hydration</p>',
        ),
      });
    });

    await page.goto("/island/no-slot");
    await expect(page.getByTestId("no-slot")).toHaveText("no slot");
    await page.getByTestId("inc").click();
    await expect(page.getByTestId("text")).toHaveText("1");
    expect(pageErrors).toEqual([]);
  });

  test("merges user head content with island head content", async ({ page }) => {
    await page.goto("/island/head");

    await expect(page).toHaveTitle("Merged heads");
    await page.getByTestId("inc").click();
    await expect(page.getByTestId("text")).toHaveText("1");
    await page.getByTestId("dec").click();
    await expect(page.getByTestId("text")).toHaveText("0");
  });
});
