import type { Note } from "./api";
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

export function createNoteBody(
  note: Note,
  linkedNotes: Note[] = [],
  onLinkedNote?: (id: string) => void,
): NoteBodyElements {
  const body = document.createElement("div");
  body.className = "note-body";
  body.dataset.testid = "note-body";
  body.id = `note-body-${note.id}`;
  body.setAttribute("aria-hidden", "true");

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
