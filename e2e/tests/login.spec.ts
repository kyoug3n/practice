import { expect, test } from "@playwright/test";
import { login, register } from "./auth";

test("зарегистрированный пользователь может войти", async ({ page }) => {
  await page.goto("/");
  const credentials = await register(page);

  await page.context().clearCookies();
  await page.reload();
  await page.click("#show-login");
  await login(page, credentials);
});

test("показывает ошибку при неверном пароле", async ({ page }) => {
  await page.goto("/");
  const credentials = await register(page);

  await page.context().clearCookies();
  await page.reload();
  await page.click("#show-login");
  await page.fill("#login-form input[name='username']", credentials.username);
  await page.fill("#login-form input[name='password']", "wrong-password");
  await page.click("#login-form button[type='submit']");

  await expect(page.locator("#status")).toContainText("неверный логин или пароль");
  await expect(page.locator("#login")).toBeVisible();
});
