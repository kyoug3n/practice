export function animateListHeight(list: HTMLElement, render: () => void): void {
  const previousHeight = list.offsetHeight;
  list.style.height = `${previousHeight}px`;
  list.classList.add("is-paging");

  window.requestAnimationFrame(() => {
    render();
    list.style.height = "auto";
    const nextHeight = list.scrollHeight;
    list.style.height = `${previousHeight}px`;
    void list.offsetHeight;

    window.requestAnimationFrame(() => {
      list.style.height = `${nextHeight}px`;
      window.setTimeout(() => {
        list.style.height = "";
        list.classList.remove("is-paging");
      }, 220);
    });
  });
}

export function highlightNote(target: HTMLElement): void {
  target.classList.remove("is-linked-target");
  void target.offsetWidth;
  target.classList.add("is-linked-target");
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => {
    target.classList.remove("is-linked-target");
  }, 1100);
}
