import { createAnimatedDisclosure } from "./disclosure";

export interface CreateElements {
  panel: HTMLDialogElement;
  closeButton: HTMLButtonElement;
  noteButton: HTMLButtonElement;
  cardButton: HTMLButtonElement;
  noteForm: HTMLFormElement;
  cardForm: HTMLFormElement;
}

export function setupCreateActions(elements: CreateElements): () => void {
  const setNoteOpen = createAnimatedDisclosure(elements.noteForm, "is-open");
  let closeTimer: number | undefined;

  function finishClose(): void {
    if (closeTimer !== undefined) {
      window.clearTimeout(closeTimer);
      closeTimer = undefined;
    }
    elements.panel.classList.remove("is-open", "is-closing");
    if (elements.panel.open) {
      elements.panel.close();
    }
  }

  function closeNoteForm(): void {
    setNoteOpen(false);
    elements.noteButton.setAttribute("aria-expanded", "false");
  }

  function close(): void {
    if (
      !elements.panel.open ||
      elements.panel.classList.contains("is-closing")
    ) {
      return;
    }
    elements.panel.classList.remove("is-open");
    elements.panel.classList.add("is-closing");

    const onTransitionEnd = (event: TransitionEvent): void => {
      if (event.target !== elements.panel) {
        return;
      }
      elements.panel.removeEventListener("transitionend", onTransitionEnd);
      finishClose();
    };
    elements.panel.addEventListener("transitionend", onTransitionEnd);
    closeTimer = window.setTimeout(finishClose, 220);
  }

  function openCardForm(): void {
    closeNoteForm();
    elements.cardForm.hidden = false;
    if (!elements.panel.open) {
      elements.panel.showModal();
      window.requestAnimationFrame(() => {
        if (elements.panel.open) {
          elements.panel.classList.add("is-open");
        }
      });
    }

    const field = elements.cardForm.querySelector<HTMLElement>(
      "input:not(:disabled), select:not(:disabled), textarea:not(:disabled)",
    );
    field?.focus();
  }

  elements.noteButton.addEventListener("click", () => {
    const isOpen = elements.noteForm.classList.contains("is-open");
    setNoteOpen(!isOpen);
    elements.noteButton.setAttribute("aria-expanded", String(!isOpen));
  });
  elements.cardButton.addEventListener("click", openCardForm);
  elements.closeButton.addEventListener("click", close);
  elements.panel.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  elements.panel.addEventListener("close", () => {
    elements.panel.classList.remove("is-open", "is-closing");
    elements.cardForm.hidden = true;
  });
  elements.panel.addEventListener("click", (event) => {
    if (event.target === elements.panel) {
      close();
    }
  });

  return () => {
    closeNoteForm();
    close();
  };
}
