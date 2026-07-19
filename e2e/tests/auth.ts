import { expect, type Page } from "@playwright/test";

export const TEST_PASSWORD = "correct-horse-battery-staple";

export interface Credentials {
  username: string;
  password: string;
}

export function newCredentials(): Credentials {
  return {
    username: `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    password: TEST_PASSWORD,
  };
}

export async function register(
  page: Page,
  credentials = newCredentials(),
): Promise<Credentials> {
  await page.fill("#register-form input[name='username']", credentials.username);
  await page.fill(
    "#register-form input[name='password']",
    credentials.password,
  );
  await page.click("#register-form button[type='submit']");

  await expect(page.locator("#workspace")).toBeVisible();
  return credentials;
}

export async function login(page: Page, credentials: Credentials): Promise<void> {
  await page.fill("#login-form input[name='username']", credentials.username);
  await page.fill("#login-form input[name='password']", credentials.password);
  await page.click("#login-form button[type='submit']");

  await expect(page.locator("#workspace")).toBeVisible();
}

export async function openCreateMenu(
  page: Page,
  type: "note" | "card",
): Promise<void> {
  await page.locator("#create-menu summary").click();
  await page.click(`#create-${type}`);
  await expect(page.locator(`#${type}-form`)).toBeVisible();
}
