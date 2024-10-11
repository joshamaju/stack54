import { test, expect } from "@playwright/test";

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

test("should load client assets", async ({ page }) => {
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

test("should support inline script tags", async ({ page }) => {
  await page.goto("/script/inline");
  const inc = page.getByTestId("inc");
  const dec = page.getByTestId("dec");
  const text = page.getByTestId("text");
  await inc.click();
  expect(await text.textContent()).toBe("1");
  await dec.click();
  expect(await text.textContent()).toBe("0");
});

test("should include all component assets", async ({ page }) => {
  await page.goto("/leaf");

  const inc = page.getByTestId("inc");
  const dec = page.getByTestId("dec");
  const text = page.getByTestId("text");

  await inc.click();
  expect(await text.textContent()).toBe("1");

  await dec.click();
  expect(await text.textContent()).toBe("0");

  const color = await inc.evaluate(
    (node) => window.getComputedStyle(node).backgroundColor
  );

  expect(color).toBe("rgb(255, 0, 0)");
});

test("should render template from path name", async ({ page }) => {
  await page.goto("/factory");
  const text = page.getByTestId("locals");
  expect(await text.textContent()).toBe("John");
});

test("should render template from bare component import", async ({ page }) => {
  await page.goto("/factory/direct");
  const text = page.getByTestId("locals");
  expect(await text.textContent()).toBe("John");
});

test.describe("Scoped CSS", () => {
  test("should include inline svelte component style", async ({ page }) => {
    await page.goto("/css/inline");
    const text = page.locator("p");
    const color = await text.evaluate(
      (node) => window.getComputedStyle(node).color
    );
    expect(color).toBe("rgb(255, 0, 0)");
  });

  test("should include nested scoped component style", async ({ page }) => {
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
