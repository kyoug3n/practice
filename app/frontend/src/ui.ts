import { ApiError } from "./api";

export interface UiActions {
  field: (form: FormData, name: string) => string;
  showError: (error: unknown) => void;
  clearStatus: () => void;
  onClick: (button: HTMLButtonElement, action: () => Promise<void>) => void;
}

export function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? `Ошибка: ${error.message}`
    : "Что-то пошло не так";
}

export function createUiActions(statusBar: HTMLElement): UiActions {
  function field(form: FormData, name: string): string {
    const value = form.get(name);
    return typeof value === "string" ? value : "";
  }

  function showError(error: unknown): void {
    statusBar.textContent = errorMessage(error);
    statusBar.dataset.state = "error";
  }

  function clearStatus(): void {
    statusBar.textContent = "";
    delete statusBar.dataset.state;
  }

  function onClick(
    button: HTMLButtonElement,
    action: () => Promise<void>,
  ): void {
    button.addEventListener("click", () => {
      button.disabled = true;
      clearStatus();
      void action()
        .catch(showError)
        .finally(() => (button.disabled = false));
    });
  }

  return { field, showError, clearStatus, onClick };
}
