import { createAnimatedDisclosure } from "./disclosure";

const SCROLL_TOP_OFFSET = 24;

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

  function scrollToFormStart(form: HTMLElement): void {
    const scroll = (): void => {
      if (!form.isConnected || form.hidden) {
        return;
      }
      const { top } = form.getBoundingClientRect();
      if (top >= 0 && top + form.scrollHeight <= window.innerHeight) {
        return;
      }
      window.scrollTo({
        top: Math.max(0, window.scrollY + top - SCROLL_TOP_OFFSET),
        behavior: "smooth",
      });
    };
    window.requestAnimationFrame(scroll);
    window.setTimeout(scroll, 240);
  }

  function closeNoteForm(): void {
    setNoteOpen(false);
    elements.noteButton.setAttribute("aria-expanded", "false");
  }

  function closeCardForm(): void {
    setCardOpen(false);
    elements.cardButton.setAttribute("aria-expanded", "false");
  }

  elements.noteForm
    .querySelector<HTMLButtonElement>("[data-create-cancel]")
    ?.addEventListener("click", closeNoteForm);
  elements.cardForm
    .querySelector<HTMLButtonElement>("[data-create-cancel]")
    ?.addEventListener("click", closeCardForm);

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
    scrollToFormStart(elements.cardForm);
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
      scrollToFormStart(elements.noteForm);
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
