import { createAnimatedDisclosure } from "./disclosure";

export interface CreateElements {
  noteButton: HTMLButtonElement;
  cardButton: HTMLButtonElement;
  noteForm: HTMLFormElement;
  cardForm: HTMLFormElement;
  onOpen?: () => Promise<void> | void;
}

export function setupCreateActions(elements: CreateElements): () => void {
  const setNoteOpen = createAnimatedDisclosure(elements.noteForm, "is-open");
  const setCardOpen = createAnimatedDisclosure(elements.cardForm, "is-open");
  let openRequest = 0;

  function closeNoteForm(): void {
    setNoteOpen(false);
    elements.noteButton.setAttribute("aria-expanded", "false");
  }

  function closeCardForm(): void {
    setCardOpen(false);
    elements.cardButton.setAttribute("aria-expanded", "false");
  }

  async function openCardForm(): Promise<void> {
    const request = ++openRequest;
    const isOpen = elements.cardForm.classList.contains("is-open");
    closeNoteForm();
    if (isOpen) {
      setCardOpen(false);
      elements.cardButton.setAttribute("aria-expanded", "false");
      return;
    }

    await elements.onOpen?.();
    if (request !== openRequest) {
      return;
    }
    setCardOpen(true);
    elements.cardButton.setAttribute("aria-expanded", "true");

    const field = elements.cardForm.querySelector<HTMLElement>(
      "input:not(:disabled), select:not(:disabled), textarea:not(:disabled)",
    );
    field?.focus();
  }

  elements.noteButton.addEventListener("click", () => {
    const request = ++openRequest;
    const isOpen = elements.noteForm.classList.contains("is-open");
    closeCardForm();
    if (isOpen) {
      setNoteOpen(false);
      elements.noteButton.setAttribute("aria-expanded", "false");
      return;
    }

    void Promise.resolve(elements.onOpen?.()).then(() => {
      if (request !== openRequest) {
        return;
      }
      setNoteOpen(true);
      elements.noteButton.setAttribute("aria-expanded", "true");
    });
  });
  elements.cardButton.addEventListener("click", () => {
    void openCardForm().catch(() => undefined);
  });

  return () => {
    ++openRequest;
    closeNoteForm();
    closeCardForm();
  };
}
