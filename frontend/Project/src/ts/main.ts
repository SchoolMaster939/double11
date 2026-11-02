function setupSearch(): void {
  const search = document.querySelector<HTMLElement>('.search');
  const toggle = document.querySelector<HTMLButtonElement>('.search-icon');
  const input = document.querySelector<HTMLInputElement>('.search-input');
  if (!search || !toggle || !input) return;

  let open = false;

  const show = (): void => {
    open = true;
    search.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    input.focus();
  };

  const hide = (): void => {
    open = false;
    search.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    input.blur();
  };

  toggle.addEventListener('click', () => (open ? hide() : show()));

  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    hide();
    toggle.focus();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupSearch);
} else {
  setupSearch();
}
