import { expect, test } from "@playwright/test";
import { login, newCredentials, openCreateForm, register } from "./auth";

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

test("не показывает workspace прошлого пользователя до обновления данных", async ({
  page,
}) => {
  await page.goto("/");
  await register(page);

  const privateTitle = `Private note ${Date.now()}`;
  await openCreateForm(page, "note");
  await page.fill("#note-form input[name='title']", privateTitle);
  await page.click("#note-form button[type='submit']");
  await expect(
    page.locator("[data-testid='note']", { hasText: privateTitle }),
  ).toBeVisible();

  await page.click("#logout");
  await expect(page.locator("#login")).toBeVisible();

  let releaseNotes!: () => void;
  const notesBlocked = new Promise<void>((resolve) => {
    releaseNotes = resolve;
  });
  await page.route("**/notes", async (route) => {
    if (route.request().method() === "GET") {
      await notesBlocked;
    }
    await route.continue();
  });

  const credentials = newCredentials();
  await page.click("#show-registration");
  await page.fill(
    "#register-form input[name='username']",
    credentials.username,
  );
  await page.fill(
    "#register-form input[name='password']",
    credentials.password,
  );
  const notesRequest = page.waitForRequest(
    (request) =>
      request.method() === "GET" &&
      new URL(request.url()).pathname === "/notes",
  );
  await page.click("#register-form button[type='submit']");
  await notesRequest;

  await expect(page.locator("#workspace")).toBeHidden();
  releaseNotes();
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(
    page.locator("[data-testid='note']", { hasText: privateTitle }),
  ).toHaveCount(0);
  await page.unroute("**/notes");
});
