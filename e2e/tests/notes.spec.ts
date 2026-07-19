import { test, expect } from "@playwright/test";
import { openCreateForm, register } from "./auth";

test("a created note appears in the list", async ({ page }) => {
  await page.goto("/");
  await register(page);

  const title = `E2E note ${Date.now()}`;
  await openCreateForm(page, "note");
  await page.fill("#note-form input[name='title']", title);
  await page.fill("#note-form input[name='tags']", "e2e, demo");
  await page.click("#note-form button[type='submit']");

  await expect(
    page.locator("[data-testid='note']", { hasText: title }),
  ).toBeVisible();
});
