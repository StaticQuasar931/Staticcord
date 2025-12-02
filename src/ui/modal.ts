import { focusTrap } from '../accessibility/a11y-helpers.ts';

export function createModal({ title, body, actions = [], onClose }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.dataset.modal = 'open';
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  const header = document.createElement('header');
  header.textContent = title;
  const content = document.createElement('div');
  content.innerHTML = body;
  const footer = document.createElement('div');
  footer.style.display = 'flex';
  footer.style.justifyContent = 'flex-end';
  footer.style.gap = '8px';

  actions.forEach((action) => {
    const button = document.createElement('button');
    button.textContent = action.label;
    button.addEventListener('click', () => {
      const result = action.onSelect?.();
      if (result !== false) close();
    });
    footer.appendChild(button);
  });

  modal.appendChild(header);
  modal.appendChild(content);
  modal.appendChild(footer);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  const release = focusTrap(modal);

  function close() {
    release?.();
    backdrop.remove();
    onClose?.();
  }

  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) close();
  });
  window.addEventListener('keydown', function esc(event) {
    if (event.key === 'Escape') {
      close();
      window.removeEventListener('keydown', esc);
    }
  });

  modal.focus();
  return { close, root: backdrop, content };
}
