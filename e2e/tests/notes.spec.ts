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

test("keeps note editing and creation menus mutually exclusive", async ({
  page,
}) => {
  await page.goto("/");
  await register(page);

  for (const title of ["Edit menu one", "Edit menu two"]) {
    await openCreateForm(page, "note");
    await page.fill("#note-form input[name='title']", title);
    await page.click("#note-form button[type='submit']");
    await expect(page.locator("#note-form")).toBeHidden();
  }

  const notes = page.locator("[data-testid='note']");
  const first = notes.nth(0);
  const second = notes.nth(1);
  await first.locator("[data-testid='edit-note']").click();
  await expect(first.locator("[data-testid='edit-note-form']")).toBeVisible();

  await second.locator("[data-testid='edit-note']").click();
  await expect(second.locator("[data-testid='edit-note-form']")).toBeVisible();
  await expect(first.locator("[data-testid='edit-note-form']")).toBeHidden();

  await openCreateForm(page, "note");
  await expect(page.locator("#note-form")).toBeVisible();
  await expect(second.locator("[data-testid='edit-note-form']")).toBeHidden();

  await first.locator("[data-testid='edit-note']").click();
  await expect(first.locator("[data-testid='edit-note-form']")).toBeVisible();
  await expect(page.locator("#note-form")).toBeHidden();
});

test("cancels note and card creation forms", async ({ page }) => {
  await page.goto("/");
  await register(page);

  await openCreateForm(page, "note");
  await page.click("#note-form [data-create-cancel]");
  await expect(page.locator("#note-form")).toBeHidden();

  await openCreateForm(page, "card");
  await page.click("#card-form [data-create-cancel]");
  await expect(page.locator("#card-form")).toBeHidden();
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
    await expect(page.locator("#card-form")).toBeHidden();
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

test("переходит к связанной заметке за пределами фильтра", async ({ page }) => {
  await page.goto("/");
  await register(page);

  const noteByTitle = (title: string) =>
    page.locator("[data-testid='note']").filter({
      has: page.locator(".note-title", { hasText: title }),
    });

  const targetTitle = `Filtered target ${Date.now()}`;
  await openCreateForm(page, "note");
  await page.fill("#note-form input[name='title']", targetTitle);
  await page.fill("#note-form input[name='tags']", "target");
  await page.click("#note-form button[type='submit']");
  const target = noteByTitle(targetTitle);
  await expect(target).toBeVisible();
  const targetId = await target.getAttribute("data-id");
  expect(targetId).not.toBeNull();

  const sourceTitle = `Filtered source ${Date.now()}`;
  await openCreateForm(page, "note");
  await page.fill("#note-form input[name='title']", sourceTitle);
  await page.fill("#note-form input[name='tags']", "source");
  await page.locator(`#note-links button[data-note-link='${targetId}']`).click();
  await page.click("#note-form button[type='submit']");
  await expect(page.locator("#note-form")).toBeHidden();

  await page.click("#toggle-tag-filter");
  await page.fill("#tag-filter-form input[name='tag']", "source");
  await page.click("#tag-filter-form button[type='submit']");
  await expect(noteByTitle(sourceTitle)).toBeVisible();
  await expect(page.locator("[data-testid='note']")).toHaveCount(1);

  const source = noteByTitle(sourceTitle);
  await source.locator("[data-testid='toggle-note-body']").click();
  await source.locator(".note-related-item").click();

  await expect(page.locator("#tag-filter-form input[name='tag']")).toHaveValue("");
  await expect(noteByTitle(targetTitle)).toBeVisible();
});
