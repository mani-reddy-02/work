/**
 * Automatically scrolls window, document body, documentElement,
 * and any scrollable container (such as <main className="overflow-y-auto">)
 * to the top (0, 0).
 */
export function scrollToTop(behavior: ScrollBehavior = 'instant'): void {
  // 1. Native window scroll
  try {
    window.scrollTo({ top: 0, left: 0, behavior });
  } catch {
    window.scrollTo(0, 0);
  }

  // 2. Document root elements
  if (typeof document !== 'undefined') {
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }

    // 3. Scrollable layout containers (<main>, overflow containers)
    const containers = document.querySelectorAll<HTMLElement>('main, [data-scroll-container], .overflow-y-auto');
    containers.forEach((container) => {
      try {
        container.scrollTo({ top: 0, left: 0, behavior });
      } catch {
        container.scrollTop = 0;
      }
    });

    // 4. Next-frame re-check to guarantee scroll after lazy component mount or dynamic layout shift
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        try {
          window.scrollTo({ top: 0, left: 0, behavior });
        } catch {
          window.scrollTo(0, 0);
        }
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
        const secondPass = document.querySelectorAll<HTMLElement>('main, [data-scroll-container], .overflow-y-auto');
        secondPass.forEach((container) => {
          try {
            container.scrollTo({ top: 0, left: 0, behavior });
          } catch {
            container.scrollTop = 0;
          }
        });
      });
    }
  }
}
