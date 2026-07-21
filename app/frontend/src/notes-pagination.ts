export const NOTES_PER_PAGE = 3;

export interface NotesPaginationElements {
  container: HTMLElement;
  previous: HTMLButtonElement;
  next: HTMLButtonElement;
  page: HTMLElement;
}

export function setupNotesPagination(
  elements: NotesPaginationElements,
  onPageChange: (page: number) => void,
): {
  reset: () => void;
  update: (total: number) => number;
  goTo: (page: number) => void;
} {
  let currentPage = 0;
  let totalPages = 0;

  function sync(): void {
    const lastPage = Math.max(totalPages - 1, 0);
    currentPage = Math.min(currentPage, lastPage);
    elements.container.hidden = totalPages <= 1;
    elements.page.textContent = `${totalPages === 0 ? 0 : currentPage + 1} из ${Math.max(totalPages, 1)}`;
    elements.previous.disabled = currentPage === 0;
    elements.next.disabled = totalPages === 0 || currentPage === lastPage;
  }

  function goTo(page: number): void {
    const lastPage = Math.max(totalPages - 1, 0);
    const nextPage = Math.min(Math.max(page, 0), lastPage);
    if (nextPage === currentPage) {
      return;
    }
    currentPage = nextPage;
    sync();
    onPageChange(currentPage);
  }

  elements.previous.addEventListener("click", () => {
    goTo(currentPage - 1);
  });
  elements.next.addEventListener("click", () => {
    goTo(currentPage + 1);
  });

  return {
    reset: () => {
      currentPage = 0;
    },
    update: (total) => {
      totalPages = Math.ceil(total / NOTES_PER_PAGE);
      sync();
      return currentPage;
    },
    goTo,
  };
}
