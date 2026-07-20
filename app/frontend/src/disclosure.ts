export function createAnimatedDisclosure(
  panel: HTMLElement,
  openClass: string,
  hideOnClose = true,
): (open: boolean) => void {
  let isOpen = false;
  let closeTimer: number | undefined;
  let resizeEndTimer: number | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let observedHeights = new WeakMap<Element, number>();

  function updateHeight(): void {
    panel.style.setProperty("--disclosure-height", `${panel.scrollHeight}px`);
  }

  function observeContent(): void {
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    resizeObserver ??= new ResizeObserver((entries) => {
      const contentChanged = entries.some((entry) => {
        const previousHeight = observedHeights.get(entry.target);
        observedHeights.set(entry.target, entry.contentRect.height);
        return (
          previousHeight !== undefined &&
          previousHeight !== entry.contentRect.height
        );
      });
      if (isOpen && contentChanged) {
        panel.classList.add("is-resizing");
        updateHeight();
        if (resizeEndTimer !== undefined) {
          window.clearTimeout(resizeEndTimer);
        }
        resizeEndTimer = window.setTimeout(() => {
          panel.classList.remove("is-resizing");
          resizeEndTimer = undefined;
        }, 240);
      }
    });
    resizeObserver.disconnect();
    observedHeights = new WeakMap<Element, number>();
    panel.querySelectorAll<HTMLElement>("*").forEach((element) => {
      resizeObserver?.observe(element);
    });
  }

  return (open) => {
    isOpen = open;
    if (closeTimer !== undefined) {
      window.clearTimeout(closeTimer);
      closeTimer = undefined;
    }

    if (open) {
      panel.hidden = false;
      observeContent();
      updateHeight();
      window.requestAnimationFrame(() => {
        if (isOpen) {
          panel.classList.add(openClass);
        }
      });
      return;
    }

    panel.classList.remove(openClass);
    closeTimer = window.setTimeout(() => {
      if (!isOpen && hideOnClose) {
        panel.hidden = true;
        resizeObserver?.disconnect();
      }
    }, 220);
  };
}
