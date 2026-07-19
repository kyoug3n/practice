import { api, ApiError } from "./api";
import type { UiActions } from "./ui";

export interface ProfileElements {
  section: HTMLElement;
  content: HTMLElement;
  error: HTMLElement;
  username: HTMLElement;
  createdAt: HTMLElement;
  cardsCount: HTMLElement;
  reviewsCount: HTMLElement;
  practiceDays: HTMLElement;
  currentStreak: HTMLElement;
  longestStreak: HTMLElement;
}

export function profileUsername(pathname: string): string | null {
  const match = /^\/users\/([^/]+)\/?$/.exec(pathname);
  if (!match?.[1]) {
    return null;
  }

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("ru-RU", { dateStyle: "long" }).format(date);
}

export function setupProfile(
  elements: ProfileElements,
  actions: UiActions,
  username: string,
): void {
  elements.section.hidden = false;
  elements.content.hidden = true;
  elements.error.hidden = true;
  actions.clearStatus();

  void api
    .profile(username)
    .then((profile) => {
      elements.username.textContent = profile.username;
      elements.createdAt.textContent = formatDate(profile.created_at);
      elements.cardsCount.textContent = String(profile.cards_count);
      elements.reviewsCount.textContent = String(profile.reviews_count);
      elements.practiceDays.textContent = String(profile.practice_days);
      elements.currentStreak.textContent = String(profile.current_streak);
      elements.longestStreak.textContent = String(profile.longest_streak);
      elements.content.hidden = false;
    })
    .catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 404) {
        elements.error.textContent = "Профиль не найден.";
        elements.error.hidden = false;
        return;
      }

      elements.error.textContent = "Не удалось загрузить профиль.";
      elements.error.hidden = false;
      actions.showError(error);
    });
}
