import { api, type Card, type Grade } from "./api";
import { createCardEdit, type CardEditView } from "./card-edit";
import { pencilIcon, trashIcon } from "./icons";
import type { UiActions } from "./ui";

const GRADES: Grade[] = ["again", "hard", "good", "easy"];

export interface ReviewsElements {
  dueToday: HTMLElement;
  dueWeek: HTMLElement;
  streak: HTMLElement;
  queueCount: HTMLElement;
  queue: HTMLElement;
  toggleCardEdit: HTMLButtonElement;
  cardForm: HTMLFormElement;
  onCreated: () => void;
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
  let cardEditMode = false;

  function cardItem(card: Card): HTMLDivElement {
    const wrap = document.createElement("div");
    wrap.className = "card";
    wrap.classList.toggle("is-card-edit-mode", cardEditMode);
    wrap.dataset.testid = "queue-card";
    wrap.dataset.id = card.id;

    const view = document.createElement("div");
    view.className = "card-view";

    const front = document.createElement("p");
    front.className = "front";
    front.textContent = card.front;

    const review = document.createElement("div");
    review.className = "card-review";
    const syncReviewHeight = (): void => {
      review.style.setProperty(
        "--card-review-height",
        `${review.scrollHeight}px`,
      );
    };

    const back = document.createElement("p");
    back.className = "back";
    back.textContent = card.back;
    back.hidden = true;
    back.setAttribute("aria-hidden", "true");

    const reveal = document.createElement("button");
    reveal.type = "button";
    reveal.className = "reveal-answer";
    reveal.textContent = "Показать ответ";
    reveal.dataset.testid = "reveal-answer";
    reveal.addEventListener("click", () => {
      back.hidden = false;
      back.setAttribute("aria-hidden", "false");
      reveal.hidden = true;
      window.requestAnimationFrame(syncReviewHeight);
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
    review.append(reveal, back, buttons);

    const management = document.createElement("div");
    management.className = "card-management";
    management.dataset.testid = "card-management";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.append(pencilIcon());
    edit.dataset.testid = "edit-card";
    edit.setAttribute("aria-label", `Изменить карточку: ${card.front}`);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.append(trashIcon());
    remove.dataset.testid = "delete-card";
    remove.setAttribute("aria-label", `Удалить карточку: ${card.front}`);
    actions.onClick(remove, async () => {
      await api.deleteCard(card.id);
      await refreshAll();
    });
    management.append(edit, remove);

    view.append(front, review, management);
    wrap.append(view);

    let editView: CardEditView;
    edit.addEventListener("click", () => {
      view.classList.add("is-editing");
      editView = createCardEdit(card, actions, {
        onClosed: () => {
          editView.form.remove();
          view.classList.remove("is-editing");
        },
        onSaved: refreshAll,
      });
      wrap.append(editView.form);
      editView.open();
    });

    window.requestAnimationFrame(() => {
      syncReviewHeight();
    });
    return wrap;
  }

  function setCardEditMode(enabled: boolean): void {
    cardEditMode = enabled;
    elements.toggleCardEdit.setAttribute("aria-expanded", String(enabled));
    elements.toggleCardEdit.setAttribute("aria-pressed", String(enabled));
    elements.queue.querySelectorAll<HTMLElement>(".card").forEach((card) => {
      card.classList.toggle("is-card-edit-mode", enabled);
      if (!enabled) {
        return;
      }
      const back = card.querySelector<HTMLElement>(".back");
      const reveal = card.querySelector<HTMLButtonElement>(".reveal-answer");
      back?.setAttribute("aria-hidden", "true");
      if (back) {
        back.hidden = true;
      }
      if (reveal) {
        reveal.hidden = false;
      }
    });
  }

  async function refreshStats(): Promise<void> {
    const stats = await api.stats();
    elements.dueToday.textContent = `сегодня: ${stats.due_today}`;
    elements.dueWeek.textContent = `за неделю: ${stats.due_week}`;
    elements.streak.textContent = `серия: ${stats.streak}`;
  }

  async function refreshQueue(): Promise<void> {
    const cards = await api.queue();
    elements.queueCount.textContent = String(cards.length);
    if (cards.length === 0) {
      const done = document.createElement("p");
      done.dataset.testid = "queue-empty";
      done.textContent = "На сегодня всё повторено.";
      elements.queue.replaceChildren(done);
      return;
    }
    elements.queue.replaceChildren(cardItem(cards[0]));
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
        .then(elements.onCreated)
        .catch(actions.showError)
        .finally(() => (submit.disabled = false));
    });
  }

  elements.toggleCardEdit.addEventListener("click", () => {
    setCardEditMode(!cardEditMode);
  });

  return { refreshStats, refreshQueue, setupCardForm };
}
