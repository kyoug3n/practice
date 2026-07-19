import "./style.css";
import {
  api,
  ApiError,
  type Card,
  type Grade,
  type Note,
  type User,
} from "./api";
import { parseTags, tagLabel } from "./format";

const GRADES: Grade[] = ["again", "hard", "good", "easy"];

function need(selector: string): HTMLElement {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`нет элемента: ${selector}`);
  }
  return el;
}

function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

const statusBar = need("#status");
const registration = need("#registration");
const login = need("#login");
const workspace = need("#workspace");
const currentUserBar = need("#current-user");
let currentUser: User | null = null;
let activeTag: string | undefined;

function renderCurrentUser(): void {
  currentUserBar.textContent = currentUser
    ? `Вы вошли как ${currentUser.username}`
    : "";
}

function showError(error: unknown): void {
  statusBar.textContent =
    error instanceof ApiError
      ? `Ошибка: ${error.message}`
      : "Что-то пошло не так";
  statusBar.dataset.state = "error";
}

function clearStatus(): void {
  statusBar.textContent = "";
  delete statusBar.dataset.state;
}

// Запустить действие по кнопке: блокируем её на время запроса и показываем ошибки.
function onClick(button: HTMLButtonElement, action: () => Promise<void>): void {
  button.addEventListener("click", () => {
    button.disabled = true;
    clearStatus();
    void action()
      .catch(showError)
      .finally(() => (button.disabled = false));
  });
}

function noteItem(note: Note): HTMLLIElement {
  const item = document.createElement("li");
  item.dataset.testid = "note";
  item.dataset.id = note.id;

  const title = document.createElement("span");
  title.className = "note-title";
  title.textContent = note.title;

  const tags = document.createElement("span");
  tags.className = "note-tags";
  tags.textContent = tagLabel(note.tags);

  const edit = document.createElement("button");
  edit.type = "button";
  edit.textContent = "изменить";
  edit.dataset.testid = "edit-note";
  edit.setAttribute("aria-label", `Изменить заметку: ${note.title}`);
  edit.addEventListener("click", () => {
    item.replaceChildren(noteEditForm(note));
  });

  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "удалить";
  remove.dataset.testid = "delete-note";
  remove.setAttribute("aria-label", `Удалить заметку: ${note.title}`);
  onClick(remove, async () => {
    await api.deleteNote(note.id);
    await refreshNotes();
  });

  item.append(title, tags, edit, remove);
  return item;
}

function noteEditForm(note: Note): HTMLFormElement {
  const form = document.createElement("form");
  form.className = "note-edit";
  form.dataset.testid = "edit-note-form";

  const title = document.createElement("input");
  title.name = "title";
  title.value = note.title;
  title.required = true;
  title.setAttribute("aria-label", "Заголовок заметки");

  const tags = document.createElement("input");
  tags.name = "tags";
  tags.value = note.tags.join(", ");
  tags.setAttribute("aria-label", "Теги через запятую");

  const body = document.createElement("textarea");
  body.name = "body";
  body.value = note.body;
  body.setAttribute("aria-label", "Текст заметки");

  const actions = document.createElement("div");
  actions.className = "note-edit-actions";
  const save = document.createElement("button");
  save.type = "submit";
  save.textContent = "сохранить";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "отмена";
  cancel.addEventListener("click", () => {
    void refreshNotes().catch(showError);
  });
  actions.append(save, cancel);

  form.append(title, tags, body, actions);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    save.disabled = true;
    clearStatus();
    void api
      .updateNote(note.id, {
        title: title.value,
        body: body.value,
        tags: parseTags(tags.value),
        links: note.links,
      })
      .then(() => refreshNotes())
      .catch(showError)
      .finally(() => (save.disabled = false));
  });

  return form;
}

function updateCardNoteOptions(notes: Note[]): void {
  const select = document.querySelector<HTMLSelectElement>(
    "#card-form select[name='note_id']",
  );
  if (!select) {
    throw new Error("нет списка заметок для карточки");
  }
  const options = notes.map((note) => {
    const option = document.createElement("option");
    option.value = note.id;
    option.textContent = note.title;
    return option;
  });
  select.replaceChildren(
    Object.assign(document.createElement("option"), {
      value: "",
      textContent: "Выберите заметку",
    }),
    ...options,
  );
  select.disabled = notes.length === 0;
}

function cardItem(card: Card): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.className = "card";
  wrap.dataset.testid = "queue-card";
  wrap.dataset.id = card.id;

  const front = document.createElement("p");
  front.className = "front";
  front.textContent = card.front;

  const back = document.createElement("p");
  back.className = "back";
  back.textContent = card.back;
  back.hidden = true;

  const reveal = document.createElement("button");
  reveal.type = "button";
  reveal.className = "reveal-answer";
  reveal.textContent = "Показать ответ";
  reveal.dataset.testid = "reveal-answer";
  reveal.addEventListener("click", () => {
    back.hidden = false;
    reveal.hidden = true;
  });

  const buttons = document.createElement("div");
  buttons.className = "grade-buttons";
  for (const grade of GRADES) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = grade;
    button.dataset.testid = `grade-${grade}`;
    button.setAttribute("aria-label", `Оценить: ${grade}`);
    onClick(button, async () => {
      await api.grade(card.id, grade);
      await refreshAll();
    });
    buttons.append(button);
  }

  wrap.append(front, reveal, back, buttons);
  return wrap;
}

async function refreshStats(): Promise<void> {
  const stats = await api.stats();
  need("[data-stat='due_today']").textContent = `сегодня: ${stats.due_today}`;
  need("[data-stat='due_week']").textContent = `за неделю: ${stats.due_week}`;
  need("[data-stat='streak']").textContent = `серия: ${stats.streak}`;
}

async function refreshNotes(): Promise<void> {
  const notes = await api.listNotes(activeTag);
  const list = need("#note-list");
  list.replaceChildren(...notes.map(noteItem));
  updateCardNoteOptions(notes);
}

async function refreshQueue(): Promise<void> {
  const cards = await api.queue();
  const box = need("#queue");
  if (cards.length === 0) {
    const done = document.createElement("p");
    done.dataset.testid = "queue-empty";
    done.textContent = "На сегодня всё повторено.";
    box.replaceChildren(done);
    return;
  }
  box.replaceChildren(...cards.map(cardItem));
}

async function refreshAll(): Promise<void> {
  await Promise.all([refreshStats(), refreshNotes(), refreshQueue()]);
}

function showWorkspace(user: User): void {
  currentUser = user;
  registration.hidden = true;
  login.hidden = true;
  workspace.hidden = false;
  renderCurrentUser();
  statusBar.textContent = "Загрузка…";
  void refreshAll().then(clearStatus, showError);
}

function showRegistration(): void {
  currentUser = null;
  registration.hidden = false;
  login.hidden = true;
  workspace.hidden = true;
  renderCurrentUser();
  clearStatus();
}

function showLogin(): void {
  currentUser = null;
  registration.hidden = true;
  login.hidden = false;
  workspace.hidden = true;
  renderCurrentUser();
  clearStatus();
}

async function restoreSession(): Promise<void> {
  registration.hidden = true;
  login.hidden = true;
  workspace.hidden = true;
  statusBar.textContent = "Загрузка…";

  try {
    showWorkspace(await api.me());
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      showRegistration();
      return;
    }
    showRegistration();
    showError(error);
  }
}

const registerForm = need("#register-form");
if (!(registerForm instanceof HTMLFormElement)) {
  throw new Error("нет формы регистрации");
}
registerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const submit = registerForm.querySelector<HTMLButtonElement>(
    "button[type='submit']",
  );
  if (!submit) {
    return;
  }
  const data = new FormData(registerForm);

  submit.disabled = true;
  clearStatus();
  void api
    .register({
      username: field(data, "username"),
      password: field(data, "password"),
    })
    .then(showWorkspace)
    .catch(showError)
    .finally(() => (submit.disabled = false));
});

const loginForm = need("#login-form");
if (!(loginForm instanceof HTMLFormElement)) {
  throw new Error("нет формы входа");
}
loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const submit = loginForm.querySelector<HTMLButtonElement>(
    "button[type='submit']",
  );
  if (!submit) {
    return;
  }
  const data = new FormData(loginForm);

  submit.disabled = true;
  clearStatus();
  void api
    .login({
      username: field(data, "username"),
      password: field(data, "password"),
    })
    .then(showWorkspace)
    .catch(showError)
    .finally(() => (submit.disabled = false));
});

const showLoginButton = need("#show-login");
showLoginButton.addEventListener("click", showLogin);

const showRegistrationButton = need("#show-registration");
showRegistrationButton.addEventListener("click", showRegistration);

const logoutButton = need("#logout");
onClick(logoutButton as HTMLButtonElement, async () => {
  await api.logout();
  showLogin();
});

void restoreSession();

const form = need("#note-form");
if (!(form instanceof HTMLFormElement)) {
  throw new Error("нет формы #note-form");
}
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const submit = form.querySelector<HTMLButtonElement>("button[type='submit']");
  if (!submit) {
    return;
  }
  const data = new FormData(form);
  const input = {
    title: field(data, "title"),
    body: field(data, "body"),
    tags: parseTags(field(data, "tags")),
  };

  submit.disabled = true;
  clearStatus();
  void api
    .createNote(input)
    .then(() => {
      form.reset();
      return refreshNotes();
    })
    .catch(showError)
    .finally(() => (submit.disabled = false));
});

const cardForm = need("#card-form");
if (!(cardForm instanceof HTMLFormElement)) {
  throw new Error("нет формы #card-form");
}
cardForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const submit = cardForm.querySelector<HTMLButtonElement>(
    "button[type='submit']",
  );
  if (!submit) {
    return;
  }
  const data = new FormData(cardForm);
  const input = {
    note_id: field(data, "note_id"),
    front: field(data, "front"),
    back: field(data, "back"),
  };

  submit.disabled = true;
  clearStatus();
  void api
    .createCard(input)
    .then(() => {
      cardForm.reset();
      return Promise.all([refreshStats(), refreshQueue()]);
    })
    .catch(showError)
    .finally(() => (submit.disabled = false));
});

const tagFilterForm = need("#tag-filter-form");
if (!(tagFilterForm instanceof HTMLFormElement)) {
  throw new Error("нет формы фильтра тегов");
}
tagFilterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(tagFilterForm);
  const tag = field(data, "tag").trim();
  activeTag = tag === "" ? undefined : tag;
  clearStatus();
  void refreshNotes().catch(showError);
});

const clearTagFilter = need("#clear-tag-filter");
onClick(clearTagFilter as HTMLButtonElement, async () => {
  const input = tagFilterForm.elements.namedItem("tag");
  if (input instanceof HTMLInputElement) {
    input.value = "";
  }
  activeTag = undefined;
  await refreshNotes();
});
