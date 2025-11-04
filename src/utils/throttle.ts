export function throttle(fn, limit) {
  let inThrottle = false;
  let lastArgs = null;
  return function throttled(...args) {
    lastArgs = args;
    if (!inThrottle) {
      fn.apply(this, lastArgs);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          fn.apply(this, lastArgs);
          lastArgs = null;
        }
      }, limit);
    }
  };
}
