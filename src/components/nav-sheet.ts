const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

let teardown: AbortController | undefined;

function isCurrentPath(pathname: string, href: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  if (href === "/") {
    return path === "/";
  }

  return path === href || path.startsWith(`${href}/`);
}

function markCurrent(): void {
  const path = location.pathname;
  const links = document.querySelectorAll<HTMLAnchorElement>(
    ".site-nav a[href], .nav-sheet nav a[href]",
  );
  for (const link of links) {
    const href = new URL(link.getAttribute("href") ?? "/", location.origin)
      .pathname;
    if (isCurrentPath(path, href)) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  }
}

function isOpen(sheet: HTMLElement): boolean {
  return sheet.dataset.open === "true";
}

function init(): void {
  teardown?.abort();
  teardown = new AbortController();
  const { signal } = teardown;

  const sheet = document.getElementById("nav-sheet");
  const openBtn = document.getElementById("nav-open");
  const closeBtn = document.getElementById("nav-close");
  if (
    !(sheet instanceof HTMLElement) ||
    !(openBtn instanceof HTMLButtonElement) ||
    !(closeBtn instanceof HTMLButtonElement)
  ) {
    return;
  }

  sheet.inert = true;
  let restore: HTMLElement = openBtn;
  markCurrent();

  const setOpen = (open: boolean, restoreFocus = true): void => {
    sheet.dataset.open = open ? "true" : "false";
    sheet.inert = !open;
    openBtn.setAttribute("aria-expanded", open ? "true" : "false");
    document.documentElement.toggleAttribute("data-nav-open", open);

    if (open) {
      const active = document.activeElement;
      restore = active instanceof HTMLElement ? active : openBtn;
      const first = sheet.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
      return;
    }

    if (restoreFocus) {
      restore.focus();
    }
  };

  openBtn.addEventListener(
    "click",
    () => {
      setOpen(!isOpen(sheet));
    },
    { signal },
  );
  closeBtn.addEventListener(
    "click",
    () => {
      setOpen(false);
    },
    { signal },
  );

  document.addEventListener(
    "keydown",
    (event: KeyboardEvent) => {
      if (!isOpen(sheet)) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const nodes = [...sheet.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (nodes.length === 0) {
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    { signal },
  );

  document.addEventListener(
    "astro:before-swap",
    () => {
      if (isOpen(sheet)) {
        setOpen(false, false);
      }
    },
    { signal },
  );
}

init();
document.addEventListener("astro:page-load", init);
