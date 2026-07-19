import { api, ApiError, type User } from "./api";
import type { UiActions } from "./ui";

export interface AuthElements {
  registration: HTMLElement;
  login: HTMLElement;
  workspace: HTMLElement;
  currentUserBar: HTMLElement;
  registerForm: HTMLFormElement;
  loginForm: HTMLFormElement;
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

  function renderCurrentUser(): void {
    elements.currentUserBar.textContent = currentUser
      ? `Вы вошли как ${currentUser.username}`
      : "";
  }

  function showWorkspace(user: User): void {
    currentUser = user;
    elements.registration.hidden = true;
    elements.login.hidden = true;
    elements.workspace.hidden = false;
    renderCurrentUser();
    void refreshAll().then(actions.clearStatus, actions.showError);
  }

  function showRegistration(): void {
    currentUser = null;
    elements.registration.hidden = false;
    elements.login.hidden = true;
    elements.workspace.hidden = true;
    renderCurrentUser();
    actions.clearStatus();
  }

  function showLogin(): void {
    currentUser = null;
    elements.registration.hidden = true;
    elements.login.hidden = false;
    elements.workspace.hidden = true;
    renderCurrentUser();
    actions.clearStatus();
  }

  async function restoreSession(): Promise<void> {
    elements.registration.hidden = true;
    elements.login.hidden = true;
    elements.workspace.hidden = true;

    try {
      showWorkspace(await api.me());
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        showRegistration();
        return;
      }
      showRegistration();
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
      .catch(actions.showError)
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
