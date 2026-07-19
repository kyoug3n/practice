import { expect, type Page } from "@playwright/test";

export async function register(page: Page): Promise<void> {
  const username = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await page.fill("#register-form input[name='username']", username);
  await page.fill(
    "#register-form input[name='password']",
    "correct-horse-battery-staple",
  );
  await page.click("#register-form button[type='submit']");

  await expect(page.locator("#workspace")).toBeVisible();
}
