import type { Note } from "./api";

export function populateNoteOptions(
  select: HTMLSelectElement,
  notes: Note[],
  placeholder?: string,
): void {
  const options = notes.map((note) => {
    const option = document.createElement("option");
    option.value = note.id;
    option.textContent = note.title;
    return option;
  });
  if (placeholder !== undefined) {
    options.unshift(
      Object.assign(document.createElement("option"), {
        value: "",
        textContent: placeholder,
      }),
    );
  }
  if (notes.length === 0) {
    const empty = document.createElement("option");
    empty.textContent = "Нет доступных заметок";
    empty.disabled = true;
    options.push(empty);
  }
  select.replaceChildren(...options);
  select.disabled = notes.length === 0;
}

export function populateLinkOptions(
  container: HTMLElement,
  notes: Note[],
  selected: string[] = [],
): void {
  if (notes.length === 0) {
    const empty = document.createElement("p");
    empty.className = "note-links-empty";
    empty.textContent = "Нет других заметок";
    container.replaceChildren(empty);
    return;
  }

  const selectedIds = new Set(selected);
  const options = notes.map((note) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "note-link-option";
    option.dataset.noteLink = note.id;
    const isSelected = selectedIds.has(note.id);
    option.dataset.selected = String(isSelected);
    option.setAttribute("aria-pressed", String(isSelected));
    option.setAttribute("aria-label", `Связать с заметкой: ${note.title}`);
    option.textContent = note.title;
    option.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const next = option.dataset.selected !== "true";
      option.dataset.selected = String(next);
      option.setAttribute("aria-pressed", String(next));
    });
    return option;
  });
  container.replaceChildren(...options);
}

export function selectedLinkIds(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll<HTMLButtonElement>(
      "button[data-note-link][data-selected='true']",
    ),
    (button) => button.dataset.noteLink ?? "",
  ).filter((id) => id !== "");
}
