import { api, type Note } from "./api";
import { createAnimatedDisclosure } from "./disclosure";
import { parseTags } from "./format";
import { pencilIcon, trashIcon } from "./icons";
import { animateListHeight } from "./notes-animation";
import { createNoteBody } from "./note-body";
import { createNoteEdit, type NoteEditView } from "./note-edit";
import {
  populateLinkOptions,
  populateNoteOptions,
  selectedLinkIds,
} from "./note-options";
import { truncateNoteTags, truncateNoteTitle } from "./note-text";
import { NOTES_PER_PAGE, setupNotesPagination } from "./notes-pagination";
import type { UiActions } from "./ui";

export interface NotesElements {
  noteForm: HTMLFormElement;
  noteLinksContainer: HTMLElement;
  tagFilterForm: HTMLFormElement;
  toggleTagFilter: HTMLButtonElement;
  clearTagFilter: HTMLButtonElement;
  noteList: HTMLElement;
  notesEmpty: HTMLElement;
  notesPagination: HTMLElement;
  notesPrevious: HTMLButtonElement;
  notesNext: HTMLButtonElement;
  notesPage: HTMLElement;
  cardNoteSelect: HTMLSelectElement;
  onCreated: () => void;
}

export function setupNotes(
  elements: NotesElements,
  actions: UiActions,
): () => Promise<void> {
  let activeTag: string | undefined;
  let notes: Note[] = [];
  let linkableNotes: Note[] = [];

  function noteItem(note: Note): HTMLLIElement {
    const item = document.createElement("li");
    item.dataset.testid = "note";
    item.dataset.id = note.id;

    const title = document.createElement("span");
    title.className = "note-title";
    title.textContent = truncateNoteTitle(note.title);
    title.title = note.title;

    const tags = document.createElement("span");
    tags.className = "note-tags";
    tags.textContent = truncateNoteTags(note.tags);
    tags.title = note.tags.join(", ");

    const { body, toggle: bodyToggle } = createNoteBody(note, linkableNotes);

    const edit = document.createElement("button");
    edit.type = "button";
    edit.append(pencilIcon());
    edit.dataset.testid = "edit-note";
    edit.setAttribute("aria-label", `Изменить заметку: ${note.title}`);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.append(trashIcon());
    remove.dataset.testid = "delete-note";
    remove.setAttribute("aria-label", `Удалить заметку: ${note.title}`);
    actions.onClick(remove, async () => {
      await api.deleteNote(note.id);
      await refreshNotes();
    });

    const actionsBox = document.createElement("div");
    actionsBox.className = "note-actions";
    actionsBox.append(bodyToggle, edit, remove);

    const view = document.createElement("div");
    view.className = "note-view";
    view.append(title, tags, actionsBox, body);
    item.append(view);

    let editView: NoteEditView;
    edit.addEventListener("click", () => {
      view.classList.add("is-editing");
      editView = createNoteEdit(
        note,
        actions,
        {
          onCloseStart: (form) => {
            const closeHeight = Math.min(
              view.offsetHeight,
              form.getBoundingClientRect().height,
            );
            form.style.setProperty(
              "--note-edit-close-height",
              `${closeHeight}px`,
            );
            form.classList.add("is-closing");
          },
          onClosed: () => {
            editView.form.classList.remove("is-closing");
            editView.form.remove();
            return new Promise((resolve) => {
              window.requestAnimationFrame(() => {
                view.classList.remove("is-editing");
                window.setTimeout(resolve, 180);
              });
            });
          },
          onSaved: refreshNotes,
        },
        linkableNotes,
      );
      item.append(editView.form);
      editView.open();
    });
    return item;
  }

  function renderPage(
    page: number,
    animate = false,
    forceAnimation = false,
  ): void {
    const start = page * NOTES_PER_PAGE;
    const visibleNotes = notes.slice(start, start + NOTES_PER_PAGE);
    const list = elements.noteList;
    if (
      !animate ||
      (!forceAnimation && list.childElementCount === visibleNotes.length)
    ) {
      list.replaceChildren(...visibleNotes.map(noteItem));
      return;
    }

    animateListHeight(list, () => {
      list.replaceChildren(...visibleNotes.map(noteItem));
    });
  }

  const pagination = setupNotesPagination(
    {
      container: elements.notesPagination,
      previous: elements.notesPrevious,
      next: elements.notesNext,
      page: elements.notesPage,
    },
    (page) => {
      renderPage(page, true);
    },
  );
  const setFilterOpen = createAnimatedDisclosure(
    elements.tagFilterForm,
    "is-open",
  );

  async function refreshNotes(animate = false): Promise<void> {
    const allNotes = await api.listNotes();
    notes = activeTag === undefined ? allNotes : await api.listNotes(activeTag);
    linkableNotes = allNotes;
    const page = pagination.update(notes.length);
    renderPage(page, animate, animate);
    elements.noteList.hidden = notes.length === 0;
    elements.notesEmpty.hidden = notes.length > 0;
    populateNoteOptions(
      elements.cardNoteSelect,
      linkableNotes,
      "Выберите заметку",
    );
    populateLinkOptions(elements.noteLinksContainer, linkableNotes);
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
      links: selectedLinkIds(elements.noteLinksContainer),
    };

    submit.disabled = true;
    actions.clearStatus();
    void api
      .createNote(input)
      .then(() => {
        elements.noteForm.reset();
        pagination.reset();
        return refreshNotes();
      })
      .then(elements.onCreated)
      .catch(actions.showError)
      .finally(() => (submit.disabled = false));
  });

  elements.tagFilterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(elements.tagFilterForm);
    const tag = actions.field(data, "tag").trim();
    activeTag = tag === "" ? undefined : tag;
    pagination.reset();
    actions.clearStatus();
    void refreshNotes().catch(actions.showError);
  });

  elements.toggleTagFilter.addEventListener("click", () => {
    const isOpen = !elements.tagFilterForm.hidden;
    setFilterOpen(!isOpen);
    elements.toggleTagFilter.setAttribute("aria-expanded", String(!isOpen));
  });

  actions.onClick(elements.clearTagFilter, async () => {
    const input = elements.tagFilterForm.elements.namedItem("tag");
    if (input instanceof HTMLInputElement) {
      input.value = "";
    }
    activeTag = undefined;
    pagination.reset();
    await refreshNotes();
  });

  return refreshNotes;
}
