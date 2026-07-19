import { expect, test } from "@playwright/test";
import { register } from "./auth";

test("восстанавливает пользователя после перезагрузки", async ({ page }) => {
  await page.goto("/");
  const credentials = await register(page);

  await page.reload();

  await expect(page.locator("#workspace")).toBeVisible();
  await expect(page.locator("#current-user")).toContainText(
    credentials.username,
  );
});
