import { api, type Note } from "./api";
import { parseTags, tagLabel } from "./format";
import type { UiActions } from "./ui";

export interface NotesElements {
  noteForm: HTMLFormElement;
  tagFilterForm: HTMLFormElement;
  clearTagFilter: HTMLButtonElement;
  noteList: HTMLElement;
  cardNoteSelect: HTMLSelectElement;
}

export function setupNotes(
  elements: NotesElements,
  actions: UiActions,
): () => Promise<void> {
  let activeTag: string | undefined;

  function updateCardNoteOptions(notes: Note[]): void {
    const options = notes.map((note) => {
      const option = document.createElement("option");
      option.value = note.id;
      option.textContent = note.title;
      return option;
    });
    elements.cardNoteSelect.replaceChildren(
      Object.assign(document.createElement("option"), {
        value: "",
        textContent: "Выберите заметку",
      }),
      ...options,
    );
    elements.cardNoteSelect.disabled = notes.length === 0;
  }

  function noteEditForm(note: Note): HTMLFormElement {
    const form = document.createElement("form");
    form.className = "note-edit";
    form.dataset.testid = "edit-note-form";

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
    save.textContent = "сохранить";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = "отмена";
    cancel.addEventListener("click", () => {
      void refreshNotes().catch(actions.showError);
    });
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
        .then(refreshNotes)
        .catch(actions.showError)
        .finally(() => (save.disabled = false));
    });

    return form;
  }

  function noteItem(note: Note): HTMLLIElement {
    const item = document.createElement("li");
    item.dataset.testid = "note";
    item.dataset.id = note.id;

    const title = document.createElement("span");
    title.className = "note-title";
    title.textContent = note.title;

    const tags = document.createElement("span");
    tags.className = "note-tags";
    tags.textContent = tagLabel(note.tags);

    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "изменить";
    edit.dataset.testid = "edit-note";
    edit.setAttribute("aria-label", `Изменить заметку: ${note.title}`);
    edit.addEventListener("click", () => {
      item.replaceChildren(noteEditForm(note));
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "удалить";
    remove.dataset.testid = "delete-note";
    remove.setAttribute("aria-label", `Удалить заметку: ${note.title}`);
    actions.onClick(remove, async () => {
      await api.deleteNote(note.id);
      await refreshNotes();
    });

    item.append(title, tags, edit, remove);
    return item;
  }

  async function refreshNotes(): Promise<void> {
    const notes = await api.listNotes(activeTag);
    elements.noteList.replaceChildren(...notes.map(noteItem));
    updateCardNoteOptions(notes);
  }

  elements.noteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const submit = elements.noteForm.querySelector<HTMLButtonElement>(
      "button[type='submit']",
    );
    if (!submit) {
      return;
    }
    const data = new FormData(elements.noteForm);
    const input = {
      title: actions.field(data, "title"),
      body: actions.field(data, "body"),
      tags: parseTags(actions.field(data, "tags")),
    };

    submit.disabled = true;
    actions.clearStatus();
    void api
      .createNote(input)
      .then(() => {
        elements.noteForm.reset();
        return refreshNotes();
      })
      .catch(actions.showError)
      .finally(() => (submit.disabled = false));
  });

  elements.tagFilterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(elements.tagFilterForm);
    const tag = actions.field(data, "tag").trim();
    activeTag = tag === "" ? undefined : tag;
    actions.clearStatus();
    void refreshNotes().catch(actions.showError);
  });

  actions.onClick(elements.clearTagFilter, async () => {
    const input = elements.tagFilterForm.elements.namedItem("tag");
    if (input instanceof HTMLInputElement) {
      input.value = "";
    }
    activeTag = undefined;
    await refreshNotes();
  });

  return refreshNotes;
}
