import { test, expect } from "@playwright/test";

test.describe("ENV", () => {
  test("should have access to private environment variables on server", async ({
    page,
  }) => {
    await page.goto("/env/server");
    const text = page.getByTestId("env");
    expect(await text.textContent()).toBe("env");
  });

  test("should have access to private environment variables in view on server", async ({
    page,
  }) => {
    await page.goto("/env/in-view");
    const text = page.getByTestId("env");
    expect(await text.textContent()).toBe("env");
  });

  test("should not have access to private environment variables on client", async ({
    page,
  }) => {
    await page.goto("/env/client");
    await page.waitForLoadState("domcontentloaded");

    const get = page.getByTestId("get");

    await get.click();

    const text = page.getByTestId("env");
    expect(await text.textContent()).toBe("");
  });

  test("should have access to public environment variables", async ({
    page,
  }) => {
    await page.goto("/env/public");
    await page.waitForLoadState("domcontentloaded");

    const get = page.getByTestId("get");

    await get.click();

    const text = page.getByTestId("env");
    expect(await text.textContent()).toBe("public_env");
  });

  test("should have access to public and private environment variables in view on server but not on client", async ({
    page,
  }) => {
    await page.goto("/env/view-private-and-public");

    const public_env = page.getByTestId("public_env");
    const private_env = page.getByTestId("private_env");

    expect(await private_env.textContent()).toBe("env");
    expect(await public_env.textContent()).toBe("public_env");

    const hydrate = page.getByTestId("hydrate");

    await hydrate.click();

    expect(await private_env.textContent()).toBe("");
    expect(await public_env.textContent()).toBe("public_env");
  });
});
