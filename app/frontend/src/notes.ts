import { api, type Book, type Note } from "./api";
import { createBookPicker, type BookPickerView } from "./book-picker";
import { createAnimatedDisclosure } from "./disclosure";
import { createNoteItem, type NoteEditorState } from "./note-item";
import { animateListHeight, highlightNote } from "./notes-animation";
import { populateLinkOptions, populateNoteOptions } from "./note-options";
import { readNoteForm } from "./note-form";
import { NOTES_PER_PAGE, setupNotesPagination } from "./notes-pagination";
import type { UiActions } from "./ui";

export interface NotesElements {
  noteForm: HTMLFormElement;
  noteBookPicker: HTMLElement;
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
  closeCreateForms: () => void;
}

export function setupNotes(elements: NotesElements, actions: UiActions) {
  let activeTag: string | undefined;
  let notes: Note[] = [];
  let linkableNotes: Note[] = [];
  let books: Book[] = [];
  const editorState: NoteEditorState = { active: undefined, request: 0 };
  const noteBookPicker: BookPickerView = createBookPicker(
    elements.noteBookPicker,
    actions,
  );

  function clearActiveTag(): void {
    const input = elements.tagFilterForm.elements.namedItem("tag");
    if (input instanceof HTMLInputElement) {
      input.value = "";
    }
    activeTag = undefined;
    pagination.reset();
  }
  async function navigateToLinkedNote(id: string): Promise<void> {
    let index = notes.findIndex((note) => note.id === id);
    if (index < 0 && activeTag !== undefined) {
      clearActiveTag();
      await refreshNotes();
      index = notes.findIndex((note) => note.id === id);
    }
    if (index < 0) {
      return;
    }
    pagination.goTo(Math.floor(index / NOTES_PER_PAGE));
    window.setTimeout(() => {
      const target = Array.from(elements.noteList.children).find(
        (element): element is HTMLElement =>
          element instanceof HTMLElement && element.dataset.id === id,
      );
      if (!target) return;
      highlightNote(target);
    }, 240);
  }
  function openLinkedNote(id: string): void {
    void navigateToLinkedNote(id).catch(actions.showError);
  }
  function noteItem(note: Note): HTMLLIElement {
    return createNoteItem({
      note,
      linkableNotes,
      books,
      actions,
      editorState,
      openLinkedNote,
      refreshNotes,
      closeCreateForms: elements.closeCreateForms,
    });
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
    const [allNotes, savedBooks] = await Promise.all([
      api.listNotes(),
      api.listBooks(),
    ]);
    books = savedBooks;
    noteBookPicker.setBooks(books);
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
    const input = readNoteForm(
      elements.noteForm,
      elements.noteLinksContainer,
      actions,
      noteBookPicker.selectedId(),
    );

    submit.disabled = true;
    actions.clearStatus();
    void api
      .createNote(input)
      .then(() => {
        elements.noteForm.reset();
        noteBookPicker.clear();
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
    clearActiveTag();
    await refreshNotes();
  });
  function closeEditMenus(): Promise<void> {
    ++editorState.request;
    const editView = editorState.active;
    editorState.active = undefined;
    return editView?.close() ?? Promise.resolve();
  }

  return {
    refresh: refreshNotes,
    open: openLinkedNote,
    closeEditMenus,
  };
}
