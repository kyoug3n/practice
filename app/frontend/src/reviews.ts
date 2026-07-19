import { api, type Card, type Grade } from "./api";
import type { UiActions } from "./ui";

const GRADES: Grade[] = ["again", "hard", "good", "easy"];

export interface ReviewsElements {
  dueToday: HTMLElement;
  dueWeek: HTMLElement;
  streak: HTMLElement;
  queue: HTMLElement;
  cardForm: HTMLFormElement;
}

export function setupReviews(
  elements: ReviewsElements,
  actions: UiActions,
): {
  refreshStats: () => Promise<void>;
  refreshQueue: () => Promise<void>;
  setupCardForm(refreshAll: () => Promise<void>): void;
} {
  let refreshAll = (): Promise<void> => Promise.resolve();

  function cardItem(card: Card): HTMLDivElement {
    const wrap = document.createElement("div");
    wrap.className = "card";
    wrap.dataset.testid = "queue-card";
    wrap.dataset.id = card.id;

    const front = document.createElement("p");
    front.className = "front";
    front.textContent = card.front;

    const back = document.createElement("p");
    back.className = "back";
    back.textContent = card.back;
    back.hidden = true;

    const reveal = document.createElement("button");
    reveal.type = "button";
    reveal.className = "reveal-answer";
    reveal.textContent = "Показать ответ";
    reveal.dataset.testid = "reveal-answer";
    reveal.addEventListener("click", () => {
      back.hidden = false;
      reveal.hidden = true;
    });

    const buttons = document.createElement("div");
    buttons.className = "grade-buttons";
    for (const grade of GRADES) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = grade;
      button.dataset.testid = `grade-${grade}`;
      button.setAttribute("aria-label", `Оценить: ${grade}`);
      actions.onClick(button, async () => {
        await api.grade(card.id, grade);
        await refreshAll();
      });
      buttons.append(button);
    }

    wrap.append(front, reveal, back, buttons);
    return wrap;
  }

  async function refreshStats(): Promise<void> {
    const stats = await api.stats();
    elements.dueToday.textContent = `сегодня: ${stats.due_today}`;
    elements.dueWeek.textContent = `за неделю: ${stats.due_week}`;
    elements.streak.textContent = `серия: ${stats.streak}`;
  }

  async function refreshQueue(): Promise<void> {
    const cards = await api.queue();
    if (cards.length === 0) {
      const done = document.createElement("p");
      done.dataset.testid = "queue-empty";
      done.textContent = "На сегодня всё повторено.";
      elements.queue.replaceChildren(done);
      return;
    }
    elements.queue.replaceChildren(...cards.map(cardItem));
  }

  function setupCardForm(refresh: () => Promise<void>): void {
    refreshAll = refresh;
    elements.cardForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const submit = elements.cardForm.querySelector<HTMLButtonElement>(
        "button[type='submit']",
      );
      if (!submit) {
        return;
      }
      const data = new FormData(elements.cardForm);
      const input = {
        note_id: actions.field(data, "note_id"),
        front: actions.field(data, "front"),
        back: actions.field(data, "back"),
      };

      submit.disabled = true;
      actions.clearStatus();
      void api
        .createCard(input)
        .then(() => {
          elements.cardForm.reset();
          return Promise.all([refreshStats(), refreshQueue()]);
        })
        .catch(actions.showError)
        .finally(() => (submit.disabled = false));
    });
  }

  return { refreshStats, refreshQueue, setupCardForm };
}
