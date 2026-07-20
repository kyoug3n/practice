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
): { reset: () => void; update: (total: number) => number } {
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

  elements.previous.addEventListener("click", () => {
    if (currentPage === 0) {
      return;
    }
    currentPage -= 1;
    sync();
    onPageChange(currentPage);
  });
  elements.next.addEventListener("click", () => {
    if (currentPage >= totalPages - 1) {
      return;
    }
    currentPage += 1;
    sync();
    onPageChange(currentPage);
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
  };
}
