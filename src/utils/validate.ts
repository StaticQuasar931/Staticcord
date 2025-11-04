import config from '../config.ts';

const { LIMITS } = config;

export function enforceMessageLimit(text) {
  if (!text) return '';
  return text.slice(0, LIMITS.maxMessageChars);
}

export function isAllowedFile(file) {
  if (!file) return false;
  const typeAllowed = LIMITS.allowedTypes.includes(file.type);
  const sizeAllowed = file.size <= LIMITS.maxUploadMB * 1024 * 1024;
  return typeAllowed && sizeAllowed;
}

export function sanitizeMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n{4,}/g, '\n\n')
    .trim();
}

export function isValidUsername(name) {
  return /^[A-Za-z0-9_\.\-]{3,32}$/.test(name);
}
