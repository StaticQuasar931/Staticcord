let quickSwitcher;
let currentIndex = 0;
let items = [];

export function registerHotkeyTargets(list) {
  items = list;
}

export function openQuickSwitcher() {
  if (quickSwitcher) return;
  quickSwitcher = document.createElement('div');
  quickSwitcher.className = 'quick-switcher';
  quickSwitcher.dataset.modal = 'open';
  quickSwitcher.addEventListener('click', (event) => {
    if (event.target === quickSwitcher) closeQuickSwitcher();
  });

  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Jump to server, channel, or DM';
  const list = document.createElement('ul');

  function render(filter) {
    list.innerHTML = '';
    const filtered = items.filter((item) =>
      item.label.toLowerCase().includes(filter.toLowerCase())
    );
    filtered.forEach((item, index) => {
      const li = document.createElement('li');
      li.textContent = item.label;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', index === currentIndex ? 'true' : 'false');
      li.addEventListener('mouseenter', () => {
        currentIndex = index;
        render(filter);
      });
      li.addEventListener('click', () => {
        item.onSelect();
        closeQuickSwitcher();
      });
      list.appendChild(li);
    });
  }

  input.addEventListener('input', () => {
    currentIndex = 0;
    render(input.value);
  });

  input.addEventListener('keydown', (event) => {
    const filtered = items.filter((item) =>
      item.label.toLowerCase().includes(input.value.toLowerCase())
    );
    if (event.key === 'ArrowDown') {
      currentIndex = (currentIndex + 1) % filtered.length;
      render(input.value);
      event.preventDefault();
    } else if (event.key === 'ArrowUp') {
      currentIndex = (currentIndex - 1 + filtered.length) % filtered.length;
      render(input.value);
      event.preventDefault();
    } else if (event.key === 'Enter') {
      filtered[currentIndex]?.onSelect();
      closeQuickSwitcher();
    } else if (event.key === 'Escape') {
      closeQuickSwitcher();
    }
  });

  panel.appendChild(input);
  panel.appendChild(list);
  quickSwitcher.appendChild(panel);
  document.body.appendChild(quickSwitcher);
  render('');
  input.focus();
}

export function closeQuickSwitcher() {
  if (!quickSwitcher) return;
  quickSwitcher.remove();
  quickSwitcher = null;
  currentIndex = 0;
}

export function activateHotkey(index) {
  const item = items[index];
  if (item) {
    item.onSelect();
  }
}
