import { refreshCart, setupCart } from "./cart";
import { refreshCatalog, setSearchQuery, setupCatalog } from "./products";
import { refreshProfile, setupProfile } from "./profile";
import { restoreSession } from "./session";

function setupSearch(): void {
  const search = document.querySelector<HTMLElement>(".search");
  const toggle = document.querySelector<HTMLButtonElement>(".search-icon");
  const input = document.querySelector<HTMLInputElement>(".search-input");
  if (!search || !toggle || !input) return;

  let open = false;

  const show = (): void => {
    open = true;
    search.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    input.focus();
  };

  const hide = (): void => {
    if (input.value) {
      input.value = "";
      setSearchQuery("");
    }
    open = false;
    search.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    input.blur();
  };

  toggle.addEventListener("click", () => (open ? hide() : show()));

  input.addEventListener("input", () => {
    setSearchQuery(input.value);
    if (input.value && !open) show();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    hide();
    toggle.focus();
  });
}

type PageName = "home" | "cart" | "profile";
const REVEAL_STEP_MS = 90;

function setupTabs(): void {
  const navItems = document.querySelectorAll<HTMLButtonElement>(".nav-item");
  const pages = document.querySelectorAll<HTMLElement>(".page");
  if (navItems.length === 0 || navItems.length !== pages.length) return;

  document.documentElement.style.setProperty("--reveal-step", `${REVEAL_STEP_MS}ms`);

  function selectTab(name: PageName): void {
    for (const item of navItems) {
      item.setAttribute("aria-selected", String(item.dataset.tab === name));
    }
  }

  function showPage(target: HTMLElement): void {
    for (const page of pages) {
      const isTarget = page === target;
      page.setAttribute("aria-hidden", String(!isTarget));
      page.removeAttribute("data-reveal");
    }

    target.setAttribute("aria-hidden", "false");

    target.querySelectorAll<HTMLElement>(":scope > *").forEach((element, index) => {
      element.style.setProperty("--reveal-index", String(index));
    });
  }

  function playRevealAnimation(): void {
    const active = document.querySelector<HTMLElement>('.page[aria-hidden="false"]');
    if (!active) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => active.setAttribute("data-reveal", "on"));
    });
  }

  function activate(name: PageName): void {
    const target = document.querySelector<HTMLElement>(`.page[data-page="${name}"]`);
    if (!target) return;

    selectTab(name);
    showPage(target);
    playRevealAnimation();

    if (name === "profile") void refreshProfile();
    else if (name === "cart") void refreshCart();
    else if (name === "home") void refreshCatalog();
  }

  for (const item of navItems) {
    item.addEventListener("click", () => {
      const name = item.dataset.tab as PageName | undefined;
      if (name) activate(name);
    });
  }

  activate("home");
}

function start(): void {
  setupSearch();
  setupCatalog();
  setupCart();
  setupTabs();
  setupProfile();

  void restoreSession();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}
