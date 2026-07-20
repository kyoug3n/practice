import { test, expect } from "@playwright/test";
import { openCreateForm, register } from "./auth";

test("a created note appears in the list", async ({ page }) => {
  await page.goto("/");
  await register(page);

  const emptyState = page.locator("#notes-empty");
  await expect(emptyState).toBeVisible();
  await expect(emptyState).toHaveText("Заметок нет. Нажмите +, чтобы создать.");

  const title = `E2E note ${Date.now()}`;
  await openCreateForm(page, "note");
  await page.fill("#note-form input[name='title']", title);
  await page.fill("#note-form input[name='tags']", "e2e, demo");
  await page.click("#note-form button[type='submit']");

  await expect(
    page.locator("[data-testid='note']", { hasText: title }),
  ).toBeVisible();
  await expect(
    page.locator("[data-testid='edit-note'] svg"),
  ).toBeVisible();
  await expect(emptyState).toBeHidden();
});

test("the tag filter is hidden behind its toolbar button", async ({ page }) => {
  await page.goto("/");
  await register(page);

  const filter = page.locator("#tag-filter-form");
  const toggle = page.locator("#toggle-tag-filter");
  await expect(filter).toBeHidden();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");

  await toggle.click();
  await expect(filter).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");

  await toggle.click();
  await expect(filter).toBeHidden();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});
