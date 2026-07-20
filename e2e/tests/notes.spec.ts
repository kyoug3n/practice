import { test, expect } from "@playwright/test";
import { openCreateForm, register } from "./auth";

test("a created note appears in the list", async ({ page }) => {
  await page.goto("/");
  await register(page);

  const emptyState = page.locator("#notes-empty");
  await expect(emptyState).toBeVisible();
  await expect(emptyState).toHaveText("Заметок нет. Нажмите +, чтобы создать.");

  const title = `E2E note ${Date.now()}`;
  const body = "Содержимое заметки для раскрывающегося блока.";
  await openCreateForm(page, "note");
  await page.fill("#note-form input[name='title']", title);
  await page.fill("#note-form input[name='tags']", "e2e, demo");
  await page.fill("#note-form textarea[name='body']", body);
  await page.click("#note-form button[type='submit']");

  const note = page.locator("[data-testid='note']", { hasText: title });
  await expect(note).toBeVisible();
  await expect(note.locator("[data-testid='edit-note'] svg")).toBeVisible();
  const bodyToggle = note.locator("[data-testid='toggle-note-body']");
  await expect(bodyToggle).toHaveAttribute("aria-label", "Показать содержание");
  await expect(bodyToggle).toHaveAttribute("aria-expanded", "false");
  await expect(note.locator("[data-testid='note-body']")).toBeHidden();
  await bodyToggle.click();
  await expect(note.locator("[data-testid='note-body']")).toHaveText(body);
  await expect(bodyToggle).toHaveAttribute("aria-label", "Скрыть содержание");
  await expect(bodyToggle).toHaveAttribute("aria-expanded", "true");
  await expect(emptyState).toBeHidden();
});

test("notes truncate long text and use three-note pages", async ({ page }) => {
  await page.goto("/");
  await register(page);

  const longTitle = "A note title that is longer than thirty five characters";
  await openCreateForm(page, "note");
  await page.fill("#note-form input[name='title']", longTitle);
  await page.fill(
    "#note-form input[name='tags']",
    "alpha, beta, gamma, delta, epsilon",
  );
  await page.click("#note-form button[type='submit']");

  const firstNote = page.locator("[data-testid='note']").first();
  await expect(firstNote.locator(".note-title")).toHaveText(
    `${longTitle.slice(0, 32)}...`,
  );
  await expect(firstNote.locator(".note-tags")).toHaveText(
    "[alpha, beta, gamma, delta]...",
  );
  const toggleOffset = await firstNote.evaluate((item) => {
    const actions = item.querySelector<HTMLElement>(".note-actions");
    const toggle = item.querySelector<HTMLElement>(".note-body-toggle");
    return actions && toggle
      ? toggle.getBoundingClientRect().left -
          actions.getBoundingClientRect().left
      : null;
  });
  expect(toggleOffset).toBe(0);

  for (const title of ["Page note 2", "Page note 3", "Page note 4"]) {
    await expect(page.locator("#create-panel")).toHaveJSProperty("open", false);
    await openCreateForm(page, "note");
    await page.fill("#note-form input[name='title']", title);
    await page.click("#note-form button[type='submit']");
  }

  await expect(page.locator("#notes-pagination")).toBeVisible();
  await expect(page.locator("#notes-page")).toHaveText("1 из 2");
  await expect(page.locator("[data-testid='note']")).toHaveCount(3);

  const noteList = page.locator("#note-list");
  await page.click("#notes-next");
  await expect(page.locator("#notes-page")).toHaveText("2 из 2");
  await expect(page.locator("[data-testid='note']")).toHaveCount(1);
  const heights = await noteList.evaluate(async (element) => {
    const samples: number[] = [];
    for (let index = 0; index < 8; index += 1) {
      samples.push(element.getBoundingClientRect().height);
      await new Promise((resolve) => window.setTimeout(resolve, 30));
    }
    return samples;
  });
  expect(heights[0]).toBeGreaterThan(heights[heights.length - 1]);
  expect(
    new Set(heights.map((height) => Math.round(height))).size,
  ).toBeGreaterThan(2);

  await page.click("#notes-previous");
  await expect(page.locator("#notes-page")).toHaveText("1 из 2");
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
