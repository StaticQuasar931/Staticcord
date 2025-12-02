import config from '../config.ts';
import { replaceEmojiShortcodes } from '../features/emoji.ts';

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

export function sanitizeMarkdown(text, options = {}) {
  if (!text) return '';
  const highlightTerm = options.highlight?.trim();
  const escapeHtml = (value) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  let sanitized = escapeHtml(text).replace(/\r\n/g, '\n');
  sanitized = sanitized.replace(/\n{4,}/g, '\n\n');

  sanitized = sanitized.replace(/^&gt;\s?(.*)$/gm, '<blockquote>$1</blockquote>');
  sanitized = sanitized.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  sanitized = sanitized.replace(/__(.+?)__/g, '<strong>$1</strong>');
  sanitized = sanitized.replace(/_(.+?)_/g, '<em>$1</em>');
  sanitized = sanitized.replace(/\*(.+?)\*/g, '<em>$1</em>');
  sanitized = sanitized.replace(/~~(.+?)~~/g, '<del>$1</del>');
  sanitized = sanitized.replace(/(^|\s)@([A-Za-z0-9_.-]+)/g, '$1<span class="mention">@$2</span>');

  sanitized = replaceEmojiShortcodes(sanitized);

  if (highlightTerm) {
    const safeTerm = highlightTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(safeTerm, 'gi');
    sanitized = sanitized
      .split(/(<[^>]+>)/g)
      .map((chunk) => {
        if (chunk.startsWith('<')) return chunk;
        return chunk.replace(regex, (match) => `<mark>${match}</mark>`);
      })
      .join('');
  }

  return sanitized.replace(/\n/g, '<br />').trim();
}

export function isValidUsername(name) {
  return /^[A-Za-z0-9_\.\-]{3,32}$/.test(name);
}
