export function openMenu(x, y, items) {
  const menu = document.createElement('div');
  menu.className = 'menu';
  menu.dataset.menu = 'open';
  menu.style.top = `${y}px`;
  menu.style.left = `${x}px`;
  items.forEach((item) => {
    const button = document.createElement('button');
    button.textContent = item.label;
    button.disabled = !!item.disabled;
    button.addEventListener('click', () => {
      const result = item.onSelect?.();
      if (result !== false) menu.remove();
    });
    menu.appendChild(button);
  });
  document.body.appendChild(menu);
  const cleanup = () => menu.remove();
  setTimeout(() => {
    window.addEventListener('click', cleanup, { once: true });
  });
  return menu;
}
