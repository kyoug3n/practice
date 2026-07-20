import type { Note } from "./api";
import { createAnimatedDisclosure } from "./disclosure";
import { chevronIcon } from "./icons";

export interface NoteBodyElements {
  body: HTMLParagraphElement;
  toggle: HTMLButtonElement;
}

export function createNoteBody(note: Note): NoteBodyElements {
  const body = document.createElement("p");
  body.className = "note-body";
  body.dataset.testid = "note-body";
  body.id = `note-body-${note.id}`;
  body.setAttribute("aria-hidden", "true");
  body.textContent = note.body || "Содержимое отсутствует.";

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
