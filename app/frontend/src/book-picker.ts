import { api, ApiError, type Book, type BookSearchResult } from "./api";
import type { UiActions } from "./ui";

export interface BookPickerView {
  setBooks: (books: Book[]) => void;
  selectedId: () => string | undefined;
  clear: () => void;
}

function bookLabel(book: { title: string; author: string }): string {
  return book.author === "" ? book.title : `${book.title} — ${book.author}`;
}

export function createBookPicker(
  container: HTMLElement,
  actions: UiActions,
  initialBooks: Book[] = [],
  initialBookId?: string | null,
): BookPickerView {
  container.classList.add("book-picker");
  const label = document.createElement("label");
  label.className = "book-picker-label";
  label.textContent = "Книга (необязательно)";

  const searchBox = document.createElement("div");
  searchBox.className = "book-picker-search";
  const query = document.createElement("input");
  query.type = "search";
  query.placeholder = "Найти книгу";
  query.setAttribute("aria-label", "Поиск книги");
  const search = document.createElement("button");
  search.type = "button";
  search.textContent = "Найти";
  searchBox.append(query, search);

  const results = document.createElement("div");
  results.className = "book-picker-results";
  results.hidden = true;
  results.setAttribute("role", "listbox");

  const selected = document.createElement("div");
  selected.className = "book-picker-selected";
  selected.hidden = true;
  const selectedText = document.createElement("span");
  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "book-picker-clear";
  clear.textContent = "×";
  clear.setAttribute("aria-label", "Сбросить выбранную книгу");
  clear.title = "Сбросить выбранную книгу";
  selected.append(selectedText, clear);

  container.replaceChildren(label, searchBox, results, selected);

  let books = initialBooks;
  let selectedBook: Book | undefined;

  function renderSelected(): void {
    selected.hidden = selectedBook === undefined;
    if (selectedBook !== undefined) {
      selectedText.textContent = `Выбрано: ${bookLabel(selectedBook)}`;
    }
  }

  function selectBook(book: Book): void {
    selectedBook = book;
    renderSelected();
    results.hidden = true;
  }

  function existingBook(result: BookSearchResult): Book | undefined {
    return books.find(
      (book) =>
        book.open_library_key !== null &&
        book.open_library_key === result.open_library_key,
    );
  }

  function renderResults(items: BookSearchResult[]): void {
    results.replaceChildren();
    if (items.length === 0) {
      const empty = document.createElement("p");
      empty.className = "book-picker-empty";
      empty.textContent = "Книги не найдены";
      results.append(empty);
      results.hidden = false;
      return;
    }

    for (const item of items) {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "book-picker-result";
      option.setAttribute("role", "option");
      option.textContent = bookLabel(item);
      option.addEventListener("click", () => {
        const saved = existingBook(item);
        if (saved !== undefined) {
          selectBook(saved);
          return;
        }

        option.disabled = true;
        actions.clearStatus();
        void api
          .createBook({
            title: item.title,
            author: item.author,
            open_library_key: item.open_library_key,
            cover_id: item.cover_id,
          })
          .then((book) => {
            books = [...books, book];
            selectBook(book);
          })
          .catch(actions.showError)
          .finally(() => (option.disabled = false));
      });
      results.append(option);
    }
    results.hidden = false;
  }

  async function findBooks(): Promise<void> {
    const text = query.value.trim();
    if (text.length < 2) {
      actions.showError(
        new ApiError("Введите минимум 2 символа для поиска", 422),
      );
      return;
    }

    actions.clearStatus();
    search.disabled = true;
    try {
      renderResults(await api.searchBooks(text));
    } finally {
      search.disabled = false;
    }
  }

  function setBooks(nextBooks: Book[]): void {
    books = nextBooks;
    if (selectedBook !== undefined) {
      const updated = books.find((book) => book.id === selectedBook?.id);
      selectedBook = updated ?? selectedBook;
      renderSelected();
    }
  }

  search.addEventListener("click", () => {
    void findBooks().catch(actions.showError);
  });
  query.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void findBooks().catch(actions.showError);
    }
  });
  clear.addEventListener("click", () => {
    selectedBook = undefined;
    renderSelected();
  });

  setBooks(initialBooks);
  if (initialBookId !== undefined && initialBookId !== null) {
    const initialBook = books.find((book) => book.id === initialBookId);
    if (initialBook !== undefined) {
      selectBook(initialBook);
    }
  }

  return {
    setBooks,
    selectedId: () => selectedBook?.id,
    clear: () => {
      selectedBook = undefined;
      renderSelected();
      results.hidden = true;
    },
  };
}
