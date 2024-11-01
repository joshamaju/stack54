import { test, expect } from "@playwright/test";

test.describe("Island", () => {
  test("should hydrate island with no slot", async ({ page }) => {
    await page.goto("/island/no-slot");

    const text = page.getByTestId("no-slot");

    await expect(text).toHaveText("no slot");

    const inc = page.getByTestId("inc");
    const dec = page.getByTestId("dec");
    const display = page.getByTestId("text");

    await inc.click();
    expect(await display.textContent()).toBe("1");

    await dec.click();
    expect(await display.textContent()).toBe("0");
  });

  test("should hydrate island with slots", async ({ page }) => {
    await page.goto("/island/with-slot");

    const named = page.getByTestId("named-slot");
    const default_ = page.getByTestId("default-slot");

    await expect(default_).toHaveText("default");
    await expect(named).toHaveText("named");

    const inc = page.getByTestId("inc");
    const dec = page.getByTestId("dec");
    const text = page.getByTestId("text");

    await inc.click();
    expect(await text.textContent()).toBe("1");

    await dec.click();
    expect(await text.textContent()).toBe("0");
  });

  test("should merge user defined svelte:head with island generated svelte:head", async ({
    page,
  }) => {
    await page.goto("/island/head");

    expect(await page.title()).toBe("Merged heads");

    const inc = page.getByTestId("inc");
    const dec = page.getByTestId("dec");
    const text = page.getByTestId("text");

    await inc.click();
    expect(await text.textContent()).toBe("1");

    await dec.click();
    expect(await text.textContent()).toBe("0");
  });
});
