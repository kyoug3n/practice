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
