export interface CreateElements {
  panel: HTMLDialogElement;
  panelTitle: HTMLElement;
  closeButton: HTMLButtonElement;
  noteButton: HTMLButtonElement;
  cardButton: HTMLButtonElement;
  noteForm: HTMLFormElement;
  cardForm: HTMLFormElement;
}

interface CreateTarget {
  button: HTMLButtonElement;
  form: HTMLFormElement;
  title: string;
}

export function setupCreateActions(elements: CreateElements): () => void {
  const targets: CreateTarget[] = [
    {
      button: elements.noteButton,
      form: elements.noteForm,
      title: "Новая заметка",
    },
    {
      button: elements.cardButton,
      form: elements.cardForm,
      title: "Новая карточка",
    },
  ];
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

  function open(target: CreateTarget): void {
    elements.panelTitle.textContent = target.title;
    for (const item of targets) {
      item.form.hidden = item !== target;
    }
    if (!elements.panel.open) {
      elements.panel.showModal();
      window.requestAnimationFrame(() => {
        if (elements.panel.open) {
          elements.panel.classList.add("is-open");
        }
      });
    }

    const field = target.form.querySelector<HTMLElement>(
      "input:not(:disabled), select:not(:disabled), textarea:not(:disabled)",
    );
    field?.focus();
  }

  for (const target of targets) {
    target.button.addEventListener("click", () => {
      open(target);
    });
  }
  elements.closeButton.addEventListener("click", close);
  elements.panel.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  elements.panel.addEventListener("close", () => {
    elements.panel.classList.remove("is-open", "is-closing");
    for (const target of targets) {
      target.form.hidden = true;
    }
  });
  elements.panel.addEventListener("click", (event) => {
    if (event.target === elements.panel) {
      close();
    }
  });

  return close;
}
