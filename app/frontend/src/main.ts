import "./style.css";
import "./auth.css";
import "./profile.css";
import "./workspace.css";
import "./cards.css";
import "./notes.css";
import "./book-cover.css";
import "./book-picker.css";
import "./note-highlight.css";
import "./create.css";
import { setupAuth } from "./auth";
import { setupCreateActions } from "./create";
import { setupNotes } from "./notes";
import { profileUsername, setupProfile } from "./profile";
import { setupReviews } from "./reviews";
import { createUiActions } from "./ui";

document.querySelector<HTMLElement>("#app")?.classList.add("app-ready");
document.documentElement.classList.add("app-ready");

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

  let closeEditMenus = (): Promise<void> => Promise.resolve();
  const closeCreateForms = setupCreateActions({
    noteButton: needButton("#create-note"),
    cardButton: needButton("#create-card"),
    noteForm,
    cardForm,
    onOpen: () => closeEditMenus(),
  });

  const notes = setupNotes(
    {
      noteForm,
      noteBookPicker: need("#note-book-picker"),
      noteLinksContainer: need("#note-links .note-link-options"),
      tagFilterForm: needForm("#tag-filter-form"),
      toggleTagFilter: needButton("#toggle-tag-filter"),
      clearTagFilter: needButton("#clear-tag-filter"),
      noteList: need("#note-list"),
      notesEmpty: need("#notes-empty"),
      notesPagination: need("#notes-pagination"),
      notesPrevious: needButton("#notes-previous"),
      notesNext: needButton("#notes-next"),
      notesPage: need("#notes-page"),
      cardNoteSelect: needSelect("#card-form select[name='note_id']"),
      onCreated: closeCreateForms,
      closeCreateForms,
    },
    actions,
  );
  closeEditMenus = notes.closeEditMenus;

  const reviews = setupReviews(
    {
      dueToday: need("[data-stat='due_today']"),
      dueWeek: need("[data-stat='due_week']"),
      streak: need("[data-stat='streak']"),
      queueCount: need("#queue-count"),
      queue: need("#queue"),
      toggleCardEdit: needButton("#toggle-card-edit"),
      cardForm,
      onCreated: closeCreateForms,
      onOpenNote: notes.open,
    },
    actions,
  );

  const refreshAll = async (): Promise<void> => {
    await Promise.all([
      reviews.refreshStats(),
      notes.refresh(),
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
      loginError: need("#login-error"),
      showLoginButton: needButton("#show-login"),
      showRegistrationButton: needButton("#show-registration"),
      logoutButton: needButton("#logout"),
    },
    actions,
    refreshAll,
  );
}
