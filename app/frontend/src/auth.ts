import { api, ApiError, type User } from "./api";
import { errorMessage, type UiActions } from "./ui";

export interface AuthElements {
  registration: HTMLElement;
  login: HTMLElement;
  workspace: HTMLElement;
  userBar: HTMLElement;
  currentUserBar: HTMLElement;
  registerForm: HTMLFormElement;
  loginForm: HTMLFormElement;
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
  let loginErrorAnimation = 0;

  function clearLoginError(): void {
    loginErrorAnimation += 1;
    elements.loginError.textContent = "";
    elements.loginError.classList.remove("is-visible");
    elements.loginError.setAttribute("aria-hidden", "true");
  }

  function showLoginError(error: unknown): void {
    const message = errorMessage(error).replace(/^Ошибка:\s*/, "");
    const formattedMessage = message
      ? `${message.charAt(0).toLocaleUpperCase("ru-RU")}${message.slice(1)}`
      : message;
    if (
      elements.loginError.classList.contains("is-visible") &&
      elements.loginError.textContent === formattedMessage
    ) {
      return;
    }

    const animation = ++loginErrorAnimation;
    elements.loginError.textContent = formattedMessage;
    elements.loginError.setAttribute("aria-hidden", "false");
    window.requestAnimationFrame(() => {
      if (animation === loginErrorAnimation) {
        elements.loginError.classList.add("is-visible");
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

  function showWorkspace(user: User): void {
    currentUser = user;
    elements.registration.hidden = true;
    elements.login.hidden = true;
    elements.workspace.hidden = false;
    elements.userBar.hidden = false;
    renderCurrentUser();
    void refreshAll().then(actions.clearStatus, actions.showError);
  }

  function showRegistration(): void {
    currentUser = null;
    elements.registration.hidden = false;
    elements.login.hidden = true;
    elements.workspace.hidden = true;
    elements.userBar.hidden = true;
    renderCurrentUser();
    clearLoginError();
    actions.clearStatus();
  }

  function showLogin(): void {
    currentUser = null;
    elements.registration.hidden = true;
    elements.login.hidden = false;
    elements.workspace.hidden = true;
    elements.userBar.hidden = true;
    renderCurrentUser();
    clearLoginError();
    actions.clearStatus();
  }

  async function restoreSession(): Promise<void> {
    elements.registration.hidden = true;
    elements.login.hidden = true;
    elements.workspace.hidden = true;
    elements.userBar.hidden = true;

    try {
      showWorkspace(await api.me());
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
    clearLoginError();
    void api
      .register({
        username: actions.field(data, "username"),
        password: actions.field(data, "password"),
      })
      .then(showWorkspace)
      .catch(actions.showError)
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
      .catch(showLoginError)
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
