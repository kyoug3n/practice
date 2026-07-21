import { expect, test } from "@playwright/test";
import { register } from "./auth";

test("выход завершает сессию пользователя", async ({ page }) => {
  await page.goto("/");
  await register(page);
  await expect(page.locator("#status")).toHaveText("");

  await page.click("#logout");

  await expect(page.locator("#login")).toBeVisible();
  await expect(page.locator("#workspace")).toBeHidden();

  await page.reload();
  await expect(page.locator("#login")).toBeVisible();
  await expect(page.locator("#workspace")).toBeHidden();
});
