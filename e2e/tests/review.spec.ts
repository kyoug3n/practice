import { test, expect } from "@playwright/test";
import { openCreateForm, register } from "./auth";

test("grading a due card removes it from the queue", async ({ page }) => {
  await page.goto("/");
  await register(page);

  const title = `E2E review ${Date.now()}`;
  await openCreateForm(page, "note");
  await page.fill("#note-form input[name='title']", title);
  await page.click("#note-form button[type='submit']");
  await expect(page.locator("[data-testid='note']", { hasText: title })).toBeVisible();

  await openCreateForm(page, "card");
  await page.selectOption("#card-form select[name='note_id']", { label: title });
  await page.fill("#card-form input[name='front']", "E2E question");
  await page.fill("#card-form textarea[name='back']", "E2E answer");
  await page.click("#card-form button[type='submit']");

  const cards = page.locator("[data-testid='queue-card']");
  await expect(cards.first()).toBeVisible();
  await expect(page.locator("#queue-progress")).toHaveText(
    "В очереди карточек: 1",
  );

  const firstId = await cards.first().getAttribute("data-id");
  const before = await cards.count();

  await page.locator("[data-testid='queue-card']").first()
    .locator("[data-testid='grade-good']")
    .click();

  // The graded card is rescheduled into the future, so it leaves today's queue.
  await expect(
    page.locator(`[data-testid='queue-card'][data-id='${firstId}']`),
  ).toHaveCount(0);
  await expect(page.locator("#queue-progress")).toHaveText(
    "В очереди карточек: 0",
  );

  const after = await page.locator("[data-testid='queue-card']").count();
  expect(after).toBeLessThan(before);
});
