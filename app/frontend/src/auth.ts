import { api, ApiError, type User } from "./api";
import { eyeIcon, eyeOffIcon } from "./icons";
import { errorMessage, type UiActions } from "./ui";

export interface AuthElements {
  registration: HTMLElement;
  login: HTMLElement;
  workspace: HTMLElement;
  userBar: HTMLElement;
  currentUserBar: HTMLElement;
  registerForm: HTMLFormElement;
  loginForm: HTMLFormElement;
  registrationError: HTMLElement;
  loginError: HTMLElement;
  showLoginButton: HTMLButtonElement;
  showRegistrationButton: HTMLButtonElement;
  logoutButton: HTMLButtonElement;
}

export function setupAuth(
  elements: AuthElements,
  actions: UiActions,
  refreshAll: () => Promise<void>,
): void {
  let currentUser: User | null = null;
  let authErrorAnimation = 0;

  function setupPasswordToggle(form: HTMLFormElement): () => void {
    const input = form.querySelector<HTMLInputElement>(
      "input[name='password']",
    );
    const toggle = form.querySelector<HTMLButtonElement>(".password-toggle");
    if (!input || !toggle) {
      throw new Error("нет переключателя видимости пароля");
    }

    const setVisibility = (isVisible: boolean): void => {
      input.type = isVisible ? "text" : "password";
      toggle.replaceChildren(isVisible ? eyeOffIcon() : eyeIcon());
      toggle.setAttribute(
        "aria-label",
        isVisible ? "Скрыть пароль" : "Показать пароль",
      );
      toggle.setAttribute("aria-pressed", String(isVisible));
    };

    toggle.addEventListener("click", () => {
      setVisibility(input.type !== "text");
    });
    setVisibility(false);
    return () => {
      setVisibility(false);
    };
  }

  const resetRegistrationPassword = setupPasswordToggle(elements.registerForm);
  const resetLoginPassword = setupPasswordToggle(elements.loginForm);

  function clearAuthError(element: HTMLElement): void {
    authErrorAnimation += 1;
    element.textContent = "";
    element.classList.remove("is-visible");
    element.setAttribute("aria-hidden", "true");
  }

  function clearAuthErrors(): void {
    clearAuthError(elements.registrationError);
    clearAuthError(elements.loginError);
  }

  function showAuthError(element: HTMLElement, error: unknown): void {
    const message = errorMessage(error).replace(/^Ошибка:\s*/, "");
    const formattedMessage = message
      ? `${message.charAt(0).toLocaleUpperCase("ru-RU")}${message.slice(1)}`
      : message;
    if (
      element.classList.contains("is-visible") &&
      element.textContent === formattedMessage
    ) {
      return;
    }

    const animation = ++authErrorAnimation;
    element.textContent = formattedMessage;
    element.setAttribute("aria-hidden", "false");
    window.requestAnimationFrame(() => {
      if (animation === authErrorAnimation) {
        element.classList.add("is-visible");
      }
    });
  }

  function renderCurrentUser(): void {
    if (currentUser) {
      elements.currentUserBar.textContent = currentUser.username;
      elements.currentUserBar.setAttribute(
        "href",
        `/users/${encodeURIComponent(currentUser.username)}`,
      );
      return;
    }

    elements.currentUserBar.textContent = "";
    elements.currentUserBar.removeAttribute("href");
  }

  async function showWorkspace(user: User): Promise<void> {
    currentUser = null;
    elements.registration.hidden = true;
    elements.login.hidden = true;
    elements.workspace.hidden = true;
    elements.userBar.hidden = true;
    renderCurrentUser();
    try {
      await refreshAll();
    } catch (error) {
      showLogin();
      throw error;
    }
    currentUser = user;
    renderCurrentUser();
    elements.workspace.hidden = false;
    elements.userBar.hidden = false;
    actions.clearStatus();
  }

  function showRegistration(): void {
    currentUser = null;
    elements.registration.hidden = false;
    elements.login.hidden = true;
    elements.workspace.hidden = true;
    elements.userBar.hidden = true;
    renderCurrentUser();
    resetRegistrationPassword();
    clearAuthErrors();
    actions.clearStatus();
  }

  function showLogin(): void {
    currentUser = null;
    elements.registration.hidden = true;
    elements.login.hidden = false;
    elements.workspace.hidden = true;
    elements.userBar.hidden = true;
    renderCurrentUser();
    resetLoginPassword();
    clearAuthErrors();
    actions.clearStatus();
  }

  async function restoreSession(): Promise<void> {
    elements.registration.hidden = true;
    elements.login.hidden = true;
    elements.workspace.hidden = true;
    elements.userBar.hidden = true;

    try {
      await showWorkspace(await api.me());
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        showLogin();
        return;
      }
      showLogin();
      actions.showError(error);
    }
  }

  elements.registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const submit = elements.registerForm.querySelector<HTMLButtonElement>(
      "button[type='submit']",
    );
    if (!submit) {
      return;
    }
    const data = new FormData(elements.registerForm);

    submit.disabled = true;
    actions.clearStatus();
    clearAuthErrors();
    void api
      .register({
        username: actions.field(data, "username"),
        password: actions.field(data, "password"),
      })
      .then(showWorkspace)
      .catch((error: unknown) =>
        showAuthError(elements.registrationError, error),
      )
      .finally(() => (submit.disabled = false));
  });

  elements.loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const submit = elements.loginForm.querySelector<HTMLButtonElement>(
      "button[type='submit']",
    );
    if (!submit) {
      return;
    }
    const data = new FormData(elements.loginForm);

    submit.disabled = true;
    actions.clearStatus();
    void api
      .login({
        username: actions.field(data, "username"),
        password: actions.field(data, "password"),
      })
      .then(showWorkspace)
      .catch((error: unknown) => showAuthError(elements.loginError, error))
      .finally(() => (submit.disabled = false));
  });

  elements.showLoginButton.addEventListener("click", showLogin);
  elements.showRegistrationButton.addEventListener("click", showRegistration);
  actions.onClick(elements.logoutButton, async () => {
    await api.logout();
    showLogin();
  });

  void restoreSession();
}
