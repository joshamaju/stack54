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
      let resolve = (...args: any[]) => {};

      // @ts-expect-error
      window.HYDRATED = new Promise((r) => (resolve = r));

      const node = document.querySelector('[data-testid="client-only"]');

      window.addEventListener("stack54:idle", () => resolve(node == null));
    });

    await page.goto("/components/client-only");

    // @ts-expect-error
    const result = await page.waitForFunction(() => window.HYDRATED);

    const notAttached = JSON.parse(await result.jsonValue());

    expect(notAttached).toBeTruthy();

    const inc = page.getByTestId("inc");
    const dec = page.getByTestId("dec");
    const text = page.getByTestId("text");

    await inc.click();
    expect(await text.textContent()).toBe("1");

    await dec.click();
    expect(await text.textContent()).toBe("0");
  });
});
