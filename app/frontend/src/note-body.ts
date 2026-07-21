import type { Book, Note } from "./api";
import { bookCoverUrl } from "./book-cover";
import { createAnimatedDisclosure } from "./disclosure";
import { chevronIcon } from "./icons";

export interface NoteBodyElements {
  body: HTMLDivElement;
  toggle: HTMLButtonElement;
}

function appendRelatedNotes(
  body: HTMLDivElement,
  labelText: string,
  notes: Note[],
  onLinkedNote?: (id: string) => void,
): void {
  if (notes.length === 0) {
    return;
  }

  const related = document.createElement("div");
  related.className = "note-related";
  const label = document.createElement("span");
  label.className = "note-related-label";
  label.textContent = labelText;
  const list = document.createElement("div");
  list.className = "note-related-list";
  for (const linkedNote of notes) {
    const title = document.createElement("button");
    title.type = "button";
    title.className = "note-related-item";
    title.textContent = linkedNote.title;
    title.addEventListener("click", () => onLinkedNote?.(linkedNote.id));
    list.append(title);
  }
  related.append(label, list);
  body.append(related);
}

function appendBookSource(body: HTMLDivElement, book: Book | undefined): void {
  if (book === undefined) {
    return;
  }

  const source = document.createElement("div");
  source.className = "note-book-source";
  source.setAttribute("aria-label", `Источник: ${book.title}`);

  const cover = document.createElement("div");
  cover.className = "note-book-cover";
  const fallback = document.createElement("span");
  fallback.className = "note-book-cover-fallback";
  fallback.textContent = "Нет обложки";
  fallback.hidden = book.cover_id !== null;

  if (book.cover_id !== null) {
    const image = document.createElement("img");
    image.alt = `Обложка книги: ${book.title}`;
    image.loading = "lazy";
    image.decoding = "async";
    image.src = bookCoverUrl(book.cover_id);
    image.addEventListener("error", () => {
      image.hidden = true;
      fallback.hidden = false;
    });
    cover.append(image);
  }
  cover.append(fallback);

  const metadata = document.createElement("div");
  metadata.className = "note-book-metadata";
  const title = document.createElement("strong");
  title.className = "note-book-title";
  title.textContent = book.title;
  metadata.append(title);
  if (book.author !== "") {
    const author = document.createElement("span");
    author.className = "note-book-author";
    author.textContent = book.author;
    metadata.append(author);
  }

  source.append(cover, metadata);
  body.append(source);
}

export function createNoteBody(
  note: Note,
  linkedNotes: Note[] = [],
  onLinkedNote?: (id: string) => void,
  books: Book[] = [],
): NoteBodyElements {
  const body = document.createElement("div");
  body.className = "note-body";
  body.dataset.testid = "note-body";
  body.id = `note-body-${note.id}`;
  body.setAttribute("aria-hidden", "true");

  appendBookSource(
    body,
    note.book_id === undefined || note.book_id === null
      ? undefined
      : books.find((book) => book.id === note.book_id),
  );

  const text = document.createElement("p");
  text.className = "note-body-text";
  text.textContent = note.body || "Содержимое отсутствует.";
  body.append(text);

  const relatedNotes = note.links
    .map((id) => linkedNotes.find((linkedNote) => linkedNote.id === id))
    .filter((linkedNote): linkedNote is Note => linkedNote !== undefined);
  appendRelatedNotes(body, "Связанные заметки:", relatedNotes, onLinkedNote);
  appendRelatedNotes(
    body,
    "Ссылаются на эту заметку:",
    linkedNotes.filter(
      (sourceNote) =>
        sourceNote.id !== note.id && sourceNote.links.includes(note.id),
    ),
    onLinkedNote,
  );

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "note-body-toggle";
  toggle.dataset.testid = "toggle-note-body";
  toggle.append(chevronIcon());
  toggle.setAttribute("aria-controls", body.id);
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Показать содержание");

  const setOpen = createAnimatedDisclosure(body, "is-expanded", false);
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    setOpen(open);
    body.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute(
      "aria-label",
      open ? "Скрыть содержание" : "Показать содержание",
    );
  });

  return { body, toggle };
}
