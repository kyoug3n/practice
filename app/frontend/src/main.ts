import "./style.css";
import "./profile.css";
import "./workspace.css";
import "./create.css";
import { setupAuth } from "./auth";
import { setupCreateActions } from "./create";
import { setupNotes } from "./notes";
import { profileUsername, setupProfile } from "./profile";
import { setupReviews } from "./reviews";
import { createUiActions } from "./ui";

function need(selector: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    throw new Error(`нет элемента: ${selector}`);
  }
  return element;
}

function needForm(selector: string): HTMLFormElement {
  const form = need(selector);
  if (!(form instanceof HTMLFormElement)) {
    throw new Error(`нет формы: ${selector}`);
  }
  return form;
}

function needButton(selector: string): HTMLButtonElement {
  const button = need(selector);
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`нет кнопки: ${selector}`);
  }
  return button;
}

function needDialog(selector: string): HTMLDialogElement {
  const dialog = need(selector);
  if (!(dialog instanceof HTMLDialogElement)) {
    throw new Error(`нет диалога: ${selector}`);
  }
  return dialog;
}

function needSelect(selector: string): HTMLSelectElement {
  const select = need(selector);
  if (!(select instanceof HTMLSelectElement)) {
    throw new Error(`нет списка: ${selector}`);
  }
  return select;
}

const statusBar = need("#status");
const actions = createUiActions(statusBar);

const publicUsername = profileUsername(window.location.pathname);

if (publicUsername !== null) {
  need("#registration").hidden = true;
  need("#login").hidden = true;
  need("#workspace").hidden = true;

  setupProfile(
    {
      section: need("#profile"),
      content: need("#profile-content"),
      error: need("#profile-error"),
      username: need("[data-profile='username']"),
      createdAt: need("[data-profile='created_at']"),
      cardsCount: need("[data-profile='cards_count']"),
      reviewsCount: need("[data-profile='reviews_count']"),
      practiceDays: need("[data-profile='practice_days']"),
      currentStreak: need("[data-profile='current_streak']"),
      longestStreak: need("[data-profile='longest_streak']"),
    },
    actions,
    publicUsername,
  );
} else {
  const noteForm = needForm("#note-form");
  const cardForm = needForm("#card-form");

  const closeCreateDialog = setupCreateActions({
    panel: needDialog("#create-panel"),
    panelTitle: need("#create-panel-title"),
    closeButton: needButton("#create-close"),
    noteButton: needButton("#create-note"),
    cardButton: needButton("#create-card"),
    noteForm,
    cardForm,
  });

  const notes = setupNotes(
    {
      noteForm,
      tagFilterForm: needForm("#tag-filter-form"),
      clearTagFilter: needButton("#clear-tag-filter"),
      noteList: need("#note-list"),
      cardNoteSelect: needSelect("#card-form select[name='note_id']"),
      onCreated: closeCreateDialog,
    },
    actions,
  );

  const reviews = setupReviews(
    {
      dueToday: need("[data-stat='due_today']"),
      dueWeek: need("[data-stat='due_week']"),
      streak: need("[data-stat='streak']"),
      queue: need("#queue"),
      cardForm,
      onCreated: closeCreateDialog,
    },
    actions,
  );

  const refreshAll = async (): Promise<void> => {
    await Promise.all([
      reviews.refreshStats(),
      notes(),
      reviews.refreshQueue(),
    ]);
  };

  reviews.setupCardForm(refreshAll);

  setupAuth(
    {
      registration: need("#registration"),
      login: need("#login"),
      workspace: need("#workspace"),
      userBar: need("#app-userbar"),
      currentUserBar: need("#current-user"),
      registerForm: needForm("#register-form"),
      loginForm: needForm("#login-form"),
      showLoginButton: needButton("#show-login"),
      showRegistrationButton: needButton("#show-registration"),
      logoutButton: needButton("#logout"),
    },
    actions,
    refreshAll,
  );
}
