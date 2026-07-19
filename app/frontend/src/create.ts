export interface CreateMenuElements {
  menu: HTMLDetailsElement;
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

export function setupCreateMenu(elements: CreateMenuElements): () => void {
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

  function close(): void {
    elements.menu.open = false;
    for (const target of targets) {
      target.form.hidden = true;
    }
    if (elements.panel.open) {
      elements.panel.close();
    }
  }

  function open(target: CreateTarget): void {
    elements.panelTitle.textContent = target.title;
    elements.menu.open = false;
    for (const item of targets) {
      item.form.hidden = item !== target;
    }
    if (!elements.panel.open) {
      elements.panel.showModal();
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
  elements.panel.addEventListener("close", () => {
    elements.menu.open = false;
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
