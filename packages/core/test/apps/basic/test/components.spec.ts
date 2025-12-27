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

test.describe("ClientOnly", () => {
  test("should only render on the client", async ({ page }) => {
    await page.addInitScript(() => {
      let resolve = (...args: any[]) => { };
      // @ts-expect-error
      window.HYDRATED = new Promise((r) => (resolve = r));
      window.addEventListener("client-only:hydrated", () => resolve());
    });

    await page.goto("/components/client-only");

    const clientOnly = page.getByTestId("client-only");

    await expect(clientOnly).not.toBeAttached();

    // @ts-expect-error
    page.evaluate(() => window.HYDRATE());

    // @ts-expect-error
    await page.waitForFunction(() => window.HYDRATED);

    await expect(clientOnly).toBeAttached();
  });
});
