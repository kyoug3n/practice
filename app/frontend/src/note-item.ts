import { api, type Book, type Note } from "./api";
import { pencilIcon, trashIcon } from "./icons";
import { createNoteBody } from "./note-body";
import { createNoteEdit, type NoteEditView } from "./note-edit";
import { truncateNoteTags, truncateNoteTitle } from "./note-text";
import type { UiActions } from "./ui";

const SCROLL_TOP_OFFSET = 24;

export interface NoteEditorState {
  active: NoteEditView | undefined;
  request: number;
}

interface NoteItemOptions {
  note: Note;
  linkableNotes: Note[];
  books: Book[];
  actions: UiActions;
  editorState: NoteEditorState;
  openLinkedNote: (id: string) => void;
  refreshNotes: () => Promise<void>;
  closeCreateForms: () => void;
}

export function createNoteItem({
  note,
  linkableNotes,
  books,
  actions,
  editorState,
  openLinkedNote,
  refreshNotes,
  closeCreateForms,
}: NoteItemOptions): HTMLLIElement {
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
  const { body, toggle: bodyToggle } = createNoteBody(
    note,
    linkableNotes,
    openLinkedNote,
    books,
  );

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
    const request = ++editorState.request;
    const previousEdit = editorState.active;
    editorState.active = undefined;
    void (previousEdit?.close() ?? Promise.resolve())
      .then(() => {
        if (request !== editorState.request) {
          return;
        }

        closeCreateForms();
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
              if (editorState.active === editView) {
                editorState.active = undefined;
              }
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
          books,
        );
        editorState.active = editView;
        item.append(editView.form);
        editView.open();
        const openedEdit = editView;
        const scroll = (): void => {
          if (!openedEdit.form.isConnected) {
            return;
          }
          const { top } = openedEdit.form.getBoundingClientRect();
          if (
            top < 0 ||
            top + openedEdit.form.scrollHeight > window.innerHeight
          ) {
            window.scrollTo({
              top: Math.max(0, window.scrollY + top - SCROLL_TOP_OFFSET),
              behavior: "smooth",
            });
          }
        };
        window.requestAnimationFrame(scroll);
        window.setTimeout(scroll, 240);
      })
      .catch(actions.showError);
  });

  return item;
}
