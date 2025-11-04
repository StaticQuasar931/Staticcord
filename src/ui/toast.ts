const container = document.querySelector('.toast-container');

export function showToast(message, options = {}) {
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'alert');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('visible');
  });
  const timeout = options.duration ?? 4000;
  if (timeout) {
    setTimeout(() => {
      toast.remove();
    }, timeout);
  }
  return toast;
}

export function dismissToast(toast) {
  toast?.remove();
}
