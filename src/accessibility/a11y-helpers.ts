export function focusTrap(container) {
  const focusable = container.querySelectorAll(
    'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable.length) return () => {};
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function handleKey(event) {
    if (event.key !== 'Tab') return;
    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  container.addEventListener('keydown', handleKey);
  return () => container.removeEventListener('keydown', handleKey);
}

export function announceLive(region, message) {
  const node = region instanceof Element ? region : document.querySelector(region);
  if (!node) return;
  node.textContent = '';
  requestAnimationFrame(() => {
    node.textContent = message;
  });
}

export function applyReducedMotionPreference() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.body.dataset.reducedMotion = reduced ? 'true' : 'false';
}

export function registerHotkeys(map) {
  window.addEventListener('keydown', (event) => {
    const key = [];
    if (event.ctrlKey) key.push('Ctrl');
    if (event.shiftKey) key.push('Shift');
    if (event.altKey) key.push('Alt');
    const finalKey = event.key.length === 1 ? event.key.toUpperCase() : event.key;
    key.push(finalKey);
    const joined = key.join('+');
    if (map[joined]) {
      const shouldPrevent = map[joined](event) !== false;
      if (shouldPrevent) {
        event.preventDefault();
      }
    }
  });
}
