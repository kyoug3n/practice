import { api, type Card } from "./api";
import { createAnimatedDisclosure } from "./disclosure";
import type { UiActions } from "./ui";

const CARD_EDIT_ANIMATION_DURATION = 220;

function labeledField(
  labelText: string,
  control: HTMLInputElement | HTMLTextAreaElement,
): HTMLLabelElement {
  const field = document.createElement("label");
  field.className = "card-field";
  const label = document.createElement("span");
  label.textContent = labelText;
  field.append(label, control);

  return field;
}

export interface CardEditView {
  form: HTMLFormElement;
  open: () => void;
}

interface CardEditCallbacks {
  onClosed: () => Promise<void> | void;
  onSaved: () => Promise<void>;
}

function waitForCardEditClose(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, CARD_EDIT_ANIMATION_DURATION);
  });
}

export function createCardEdit(
  card: Card,
  actions: UiActions,
  callbacks: CardEditCallbacks,
): CardEditView {
  const form = document.createElement("form");
  form.className = "card-edit";
  form.dataset.testid = "edit-card-form";
  const setOpen = createAnimatedDisclosure(form, "is-open", false);

  const front = document.createElement("input");
  front.name = "front";
  front.value = card.front;
  front.required = true;
  front.setAttribute("aria-label", "Вопрос карточки");

  const back = document.createElement("textarea");
  back.name = "back";
  back.value = card.back;
  back.required = true;
  back.setAttribute("aria-label", "Ответ карточки");

  const actionsBox = document.createElement("div");
  actionsBox.className = "note-edit-actions";
  const save = document.createElement("button");
  save.type = "submit";
  save.textContent = "Сохранить";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "Отмена";
  actionsBox.append(save, cancel);

  function close(): void {
    setOpen(false);
    void waitForCardEditClose()
      .then(callbacks.onClosed)
      .catch(actions.showError);
  }

  cancel.addEventListener("click", close);
  form.append(
    labeledField("Вопрос", front),
    labeledField("Ответ", back),
    actionsBox,
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    save.disabled = true;
    actions.clearStatus();
    void api
      .updateCard(card.id, {
        note_id: card.note_id,
        front: front.value,
        back: back.value,
      })
      .then(() => {
        setOpen(false);
        return waitForCardEditClose();
      })
      .then(callbacks.onClosed)
      .then(callbacks.onSaved)
      .catch(actions.showError)
      .finally(() => (save.disabled = false));
  });

  return {
    form,
    open: () => {
      setOpen(true);
    },
  };
}
