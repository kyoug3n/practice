import { expect, test } from "@playwright/test";
import { login, register } from "./auth";

test("зарегистрированный пользователь может войти", async ({ page }) => {
  await page.goto("/");
  const credentials = await register(page);

  await page.context().clearCookies();
  await page.reload();
  await login(page, credentials);
});

test("показывает ошибку при неверном пароле", async ({ page }) => {
  await page.goto("/");
  const credentials = await register(page);

  await page.context().clearCookies();
  await page.reload();
  await page.fill("#login-form input[name='username']", credentials.username);
  await page.fill("#login-form input[name='password']", "wrong-password");
  await page.click("#login-form button[type='submit']");

  await expect(page.locator("#login-error")).toContainText(
    "Неверный логин или пароль",
  );
  await expect(page.locator("#login")).toBeVisible();
});

test("переключает видимость пароля", async ({ page }) => {
  await page.goto("/");

  const loginPassword = page.locator("#login-form input[name='password']");
  const loginToggle = page.locator("#login-form .password-toggle");
  await loginToggle.click();
  await expect(loginPassword).toHaveAttribute("type", "text");
  await expect(loginToggle).toHaveAttribute("aria-label", "Скрыть пароль");
  await loginToggle.click();
  await expect(loginPassword).toHaveAttribute("type", "password");

  await page.click("#show-registration");
  const registrationPassword = page.locator(
    "#register-form input[name='password']",
  );
  const registrationToggle = page.locator("#register-form .password-toggle");
  await registrationToggle.click();
  await expect(registrationPassword).toHaveAttribute("type", "text");
});
