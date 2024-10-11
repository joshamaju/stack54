import { test, expect } from "@playwright/test";

test.describe("Head", () => {
  test("should insert svelte head contents", async ({ page }) => {
    await page.goto("/head/svelte");
    const title = page.locator("head > title");
    expect(await title.textContent()).toBe("Has head");
  });

  test("should insert slotted svelte head", async ({ page }) => {
    await page.goto("/head/slotted");
    const title = page.locator("head > title");
    expect(await title.textContent()).toBe("Slotted title");
  });

  test("should not have head content", async ({ page }) => {
    await page.goto("/head/missing");
    const title = await page.$("head > title");
    expect(title).toBeNull();
  });
});
