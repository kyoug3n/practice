import { createAnimatedDisclosure } from "./disclosure";

export interface CreateElements {
  noteButton: HTMLButtonElement;
  cardButton: HTMLButtonElement;
  noteForm: HTMLFormElement;
  cardForm: HTMLFormElement;
}

export function setupCreateActions(elements: CreateElements): () => void {
  const setNoteOpen = createAnimatedDisclosure(elements.noteForm, "is-open");
  const setCardOpen = createAnimatedDisclosure(elements.cardForm, "is-open");

  function closeNoteForm(): void {
    setNoteOpen(false);
    elements.noteButton.setAttribute("aria-expanded", "false");
  }

  function closeCardForm(): void {
    setCardOpen(false);
    elements.cardButton.setAttribute("aria-expanded", "false");
  }

  function openCardForm(): void {
    const isOpen = elements.cardForm.classList.contains("is-open");
    closeNoteForm();
    setCardOpen(!isOpen);
    elements.cardButton.setAttribute("aria-expanded", String(!isOpen));

    if (!isOpen) {
      const field = elements.cardForm.querySelector<HTMLElement>(
        "input:not(:disabled), select:not(:disabled), textarea:not(:disabled)",
      );
      field?.focus();
    }
  }

  elements.noteButton.addEventListener("click", () => {
    const isOpen = elements.noteForm.classList.contains("is-open");
    closeCardForm();
    setNoteOpen(!isOpen);
    elements.noteButton.setAttribute("aria-expanded", String(!isOpen));
  });
  elements.cardButton.addEventListener("click", openCardForm);

  return () => {
    closeNoteForm();
    closeCardForm();
  };
}
