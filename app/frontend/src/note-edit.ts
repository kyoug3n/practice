import { api, type Note } from "./api";
import { createAnimatedDisclosure } from "./disclosure";
import { parseTags } from "./format";
import type { UiActions } from "./ui";

const EDIT_ANIMATION_DURATION = 220;

export interface NoteEditView {
  form: HTMLFormElement;
  open: () => void;
}

interface NoteEditCallbacks {
  onCloseStart: (form: HTMLFormElement) => void;
  onClosed: () => Promise<void> | void;
  onSaved: () => Promise<void>;
}

function waitForEditClose(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, EDIT_ANIMATION_DURATION);
  });
}

export function createNoteEdit(
  note: Note,
  actions: UiActions,
  callbacks: NoteEditCallbacks,
): NoteEditView {
  const form = document.createElement("form");
  form.className = "note-edit";
  form.dataset.testid = "edit-note-form";
  const setOpen = createAnimatedDisclosure(form, "is-open", false);

  const title = document.createElement("input");
  title.name = "title";
  title.value = note.title;
  title.required = true;
  title.setAttribute("aria-label", "Заголовок заметки");

  const tags = document.createElement("input");
  tags.name = "tags";
  tags.value = note.tags.join(", ");
  tags.setAttribute("aria-label", "Теги через запятую");

  const body = document.createElement("textarea");
  body.name = "body";
  body.value = note.body;
  body.setAttribute("aria-label", "Текст заметки");

  const actionsBox = document.createElement("div");
  actionsBox.className = "note-edit-actions";
  const save = document.createElement("button");
  save.type = "submit";
  save.textContent = "Сохранить";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "Отмена";
  function close(): void {
    callbacks.onCloseStart(form);
    setOpen(false);
    void waitForEditClose().then(callbacks.onClosed).catch(actions.showError);
  }
  cancel.addEventListener("click", close);
  actionsBox.append(save, cancel);

  form.append(title, tags, body, actionsBox);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    save.disabled = true;
    actions.clearStatus();
    void api
      .updateNote(note.id, {
        title: title.value,
        body: body.value,
        tags: parseTags(tags.value),
        links: note.links,
      })
      .then(() => {
        callbacks.onCloseStart(form);
        setOpen(false);
        return waitForEditClose();
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
