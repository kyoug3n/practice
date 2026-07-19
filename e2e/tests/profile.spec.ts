import { expect, test } from "@playwright/test";
import { register } from "./auth";

test("показывает публичный профиль пользователя", async ({ page }) => {
  await page.goto("/");
  const credentials = await register(page);

  const profileLink = page.locator("#current-user");
  await expect(profileLink).toHaveAttribute(
    "href",
    `/users/${credentials.username}`,
  );
  await profileLink.click();

  await expect(page.locator("#profile")).toBeVisible();
  await expect(page.locator("#profile-content")).toBeVisible();
  await expect(page.locator("[data-profile='username']")).toHaveText(
    credentials.username,
  );
  await expect(page.locator("[data-profile='cards_count']")).toHaveText("0");
  await expect(page.locator("[data-profile='reviews_count']")).toHaveText("0");
  await expect(page.locator("#profile-error")).toBeHidden();
});

test("сообщает об отсутствующем публичном профиле", async ({ page }) => {
  await page.goto("/users/profile-that-does-not-exist");

  await expect(page.locator("#profile")).toBeVisible();
  await expect(page.locator("#profile-content")).toBeHidden();
  await expect(page.locator("#profile-error")).toHaveText("Профиль не найден.");
});
