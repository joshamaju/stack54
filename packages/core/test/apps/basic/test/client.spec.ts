import { test, expect } from "@playwright/test";

test.describe("Views", () => {
  test("should have access to locals", async ({ page }) => {
    await page.goto("/locals");
    const text = page.getByTestId("locals");
    expect(await text.textContent()).toBe("John");
  });

  test("should not have access to locals", async ({ page }) => {
    await page.goto("/without-locals");
    const text = page.getByTestId("locals");
    expect(await text.textContent()).toBe("undefined");
  });

  test("loads client assets", async ({ page }) => {
    await page.goto("/client-assets");
    await page.waitForLoadState("domcontentloaded");
    const inc = page.getByTestId("inc");
    const dec = page.getByTestId("dec");
    const text = page.getByTestId("text");
    await inc.click();
    expect(await text.textContent()).toBe("1");
    await dec.click();
    expect(await text.textContent()).toBe("0");
  });

  test("supports inline script tags", async ({ page }) => {
    await page.goto("/script/inline");
    const inc = page.getByTestId("inc");
    const dec = page.getByTestId("dec");
    const text = page.getByTestId("text");
    await inc.click();
    expect(await text.textContent()).toBe("1");
    await dec.click();
    expect(await text.textContent()).toBe("0");
  });
});

test.describe("CSS", () => {
  test("supports inline svelte component style", async ({ page }) => {
    await page.goto("/css/inline");
    const text = page.locator("p");
    const color = await text.evaluate(
      (node) => window.getComputedStyle(node).color
    );
    expect(color).toBe("rgb(255, 0, 0)");
  });

  test("supports nested scoped svelte style", async ({ page }) => {
    await page.goto("/css/nested");

    const text = page.getByTestId("main");
    const inner_text = page.getByTestId("inner");

    const color = await text.evaluate(
      (node) => window.getComputedStyle(node).color
    );

    const inner_color = await inner_text.evaluate(
      (node) => window.getComputedStyle(node).color
    );

    expect(color).toBe("rgb(255, 0, 0)");
    expect(inner_color).toBe("rgb(0, 0, 255)");
  });
});

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
