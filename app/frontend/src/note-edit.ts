import { api, type Book, type Note } from "./api";
import { createBookPicker } from "./book-picker";
import { createAnimatedDisclosure } from "./disclosure";
import { parseTags } from "./format";
import { populateLinkOptions, selectedLinkIds } from "./note-options";
import type { UiActions } from "./ui";

const EDIT_ANIMATION_DURATION = 220;

function labeledField(
  labelText: string,
  control: HTMLInputElement | HTMLTextAreaElement,
): HTMLLabelElement {
  const field = document.createElement("label");
  field.className = "note-field";
  const label = document.createElement("span");
  label.textContent = labelText;
  field.append(label, control);

  return field;
}

export interface NoteEditView {
  form: HTMLFormElement;
  open: () => void;
  close: () => Promise<void>;
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
  linkedNotes: Note[],
  books: Book[],
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

  const bookPickerContainer = document.createElement("div");
  const bookPicker = createBookPicker(
    bookPickerContainer,
    actions,
    books,
    note.book_id,
  );

  const body = document.createElement("textarea");
  body.name = "body";
  body.value = note.body;
  body.setAttribute("aria-label", "Текст заметки");

  const linksFieldset = document.createElement("fieldset");
  linksFieldset.className = "note-links-fieldset";
  linksFieldset.setAttribute("aria-label", "Связанные заметки");
  const linksLegend = document.createElement("legend");
  linksLegend.textContent = "Связанные заметки";
  const linksContainer = document.createElement("div");
  linksContainer.className = "note-link-options";
  const linksControl = document.createElement("div");
  linksControl.className = "note-links-control";
  linksControl.append(linksContainer);
  populateLinkOptions(
    linksContainer,
    linkedNotes.filter((linkedNote) => linkedNote.id !== note.id),
    note.links,
  );
  linksFieldset.append(linksLegend, linksControl);

  const actionsBox = document.createElement("div");
  actionsBox.className = "note-edit-actions";
  const save = document.createElement("button");
  save.type = "submit";
  save.textContent = "Сохранить";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "Отмена";
  let closePromise: Promise<void> | undefined;
  function close(): Promise<void> {
    if (closePromise !== undefined) {
      return closePromise;
    }

    callbacks.onCloseStart(form);
    setOpen(false);
    closePromise = waitForEditClose()
      .then(callbacks.onClosed)
      .catch(actions.showError);

    return closePromise;
  }
  cancel.addEventListener("click", () => {
    void close();
  });
  actionsBox.append(save, cancel);

  form.append(
    labeledField("Заголовок", title),
    labeledField("Теги", tags),
    bookPickerContainer,
    labeledField("Содержание", body),
    linksFieldset,
    actionsBox,
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    save.disabled = true;
    actions.clearStatus();
    void api
      .updateNote(note.id, {
        title: title.value,
        body: body.value,
        tags: parseTags(tags.value),
        links: selectedLinkIds(linksContainer),
        ...(bookPicker.selectedId() === undefined
          ? {}
          : { book_id: bookPicker.selectedId() }),
      })
      .then(() => {
        return close();
      })
      .then(callbacks.onSaved)
      .catch(actions.showError)
      .finally(() => (save.disabled = false));
  });

  return {
    form,
    open: () => {
      setOpen(true);
    },
    close,
  };
}
