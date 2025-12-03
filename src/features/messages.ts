import { listenList, addData, updateData, removeData } from '../data/db.ts';
import { renderMessages, renderPinnedMessages, showTypingIndicator, clearTypingIndicator, setComposerState, onComposerSubmit, onComposerInput, getComposerValue, setComposerValue, triggerQuasarstorm } from '../ui/layout.ts';
import { subscribe, getState, navigateTo } from '../router.ts';
import { getCurrentUser } from '../auth/session.ts';
import { enforceMessageLimit, sanitizeMarkdown } from '../utils/validate.ts';
import { showToast } from '../ui/toast.ts';
import config from '../config.ts';
import { startTyping, stopTyping, listenTyping } from '../data/typing.ts';
import { formatTimestamp } from '../utils/time.ts';
import { openMenu } from '../ui/menu.ts';
import { detectEmbeds } from './embeds.ts';
import { fetchDisplayNames } from '../data/users.ts';

let unsubscribeMessages;
let unsubscribeTyping;
let unsubscribePins;
let scope = null;
let messages = [];
let pendingAttachment = null;
const pinnedIds = new Set();
const pinRecords = {};
let searchQuery = '';

export function initMessages() {
  onComposerSubmit(handleSend);
  onComposerInput(handleTyping);

  subscribe((state) => {
    scope = resolveScope(state);
    if (!scope) return;
    subscribeToScope(scope);
    handleTypingStop();
  });

  document.addEventListener('sq:emoji-picker', (event) => {
    const { messageId } = event.detail;
    if (!messageId) return;
    const emoji = window.prompt('React with emoji', '😊');
    if (emoji) toggleReaction(messageId, emoji);
  });

  document.addEventListener('sq:toggle-reaction', (event) => {
    const { messageId, emoji } = event.detail;
    toggleReaction(messageId, emoji);
  });

  document.addEventListener('sq:report-message', (event) => {
    const { messageId } = event.detail;
    reportMessage(messageId);
  });

  document.addEventListener('sq:pin-message', (event) => {
    const { messageId, pinned } = event.detail || {};
    togglePin(messageId, pinned);
  });

  document.addEventListener('sq:search', (event) => {
    searchQuery = (event.detail?.query || '').trim();
    scheduleRender();
  });

  document.getElementById('message-list')?.addEventListener('contextmenu', (event) => {
    const messageEl = event.target.closest('.message');
    if (!messageEl) return;
    event.preventDefault();
    const messageId = messageEl.dataset.id;
    openMessageMenu(event.pageX, event.pageY, messageId);
  });
}

function resolveScope(state) {
  if (state.view === 'channel' && state.serverId && state.channelId) {
    return {
      type: 'channel',
      id: state.channelId,
      serverId: state.serverId,
      path: `/serverMessages/${state.serverId}/${state.channelId}`
    };
  }
  if (state.view === 'dm' && state.dmId) {
    return { type: 'dm', id: state.dmId, path: `/dmMessages/${state.dmId}` };
  }
  if (state.view === 'group' && state.groupId) {
    return { type: 'group', id: state.groupId, path: `/groupDmMessages/${state.groupId}` };
  }
  return null;
}

function subscribeToScope(target) {
  if (unsubscribeMessages) unsubscribeMessages();
  if (unsubscribeTyping) unsubscribeTyping();
  if (unsubscribePins) unsubscribePins();
  messages = [];
  renderMessages([]);
  setComposerValue('');
  setComposerState({ disabled: false, placeholder: 'Message' });
  pendingAttachment = null;
  pinnedIds.clear();
  Object.keys(pinRecords).forEach((key) => delete pinRecords[key]);
  renderPinnedMessages([]);

  unsubscribeMessages = listenList(target.path, {
    added: (id, value) => {
      messages.push({ id, ...value });
      scheduleRender();
    },
    changed: (id, value) => {
      const index = messages.findIndex((message) => message.id === id);
      if (index > -1) {
        messages[index] = { ...messages[index], ...value };
        scheduleRender();
      }
    },
    removed: (id) => {
      messages = messages.filter((message) => message.id !== id);
      scheduleRender();
    }
  });

  if (config.FEATURES.typing) {
    unsubscribeTyping = listenTyping(target.type, target.id, handleTypingUsers);
  }

  subscribePins(target);
}

function subscribePins(target) {
  const path = resolvePinsPath(target);
  if (!path) {
    renderPinnedMessages([]);
    return;
  }
  unsubscribePins = listenList(path, {
    added: (id, value) => {
      pinnedIds.add(id);
      pinRecords[id] = value || {};
      scheduleRender();
    },
    changed: (id, value) => {
      pinnedIds.add(id);
      pinRecords[id] = value || {};
      syncPinnedMeta();
    },
    removed: (id) => {
      pinnedIds.delete(id);
      delete pinRecords[id];
      syncPinnedMeta();
      scheduleRender();
    }
  });
}

function scheduleRender() {
  render().catch((error) => console.error('render error', error));
}

async function render() {
  messages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const filtered = messages
    .slice(-200)
    .filter((message) => {
      if (!searchQuery) return true;
      return (message.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    });

  const allReactionUids = new Set();
  filtered.forEach((message) => {
    Object.values(message.reactions || {}).forEach((users) => {
      Object.keys(users || {}).forEach((uid) => allReactionUids.add(uid));
    });
  });
  const reactionLookup = allReactionUids.size ? await fetchDisplayNames(Array.from(allReactionUids)) : {};

  const rendered = filtered.map((message) => {
    const embeds = detectEmbeds(message.content || '').concat(message.embeds || []);
    const contentHtml = message.softDeleted
      ? '<em>This message was removed</em>'
      : sanitizeMarkdown(message.content || '', { highlight: searchQuery });
    return {
      id: message.id,
      authorId: message.authorId,
      authorName: message.authorName || message.authorDisplayName || 'Member',
      authorAvatar: message.authorAvatar,
      timestamp: formatTimestamp(message.createdAt),
      contentHtml,
      edited: !!message.editedAt,
      softDeleted: !!message.softDeleted,
      pinned: pinnedIds.has(message.id),
      reactions: message.reactions
        ? Object.entries(message.reactions).map(([emoji, users]) => {
            const names = Object.keys(users || {}).map((uid) => reactionLookup[uid] || 'Member');
            return { emoji, count: names.length, tooltip: names.join('\n') || null };
          })
        : [],
      attachments: message.attachments,
      embeds
    };
  });
  renderMessages(rendered);
  syncPinnedMeta();
}

async function handleSend(text) {
  const user = getCurrentUser();
  if (!user || !scope) {
    showToast('No channel selected');
    return;
  }
  const content = enforceMessageLimit(text).trim();
  if (!content && !pendingAttachment) return;
  const message = {
    authorId: user.uid,
    authorName: user.displayName || user.email,
    authorAvatar: user.photoURL || '',
    content,
    createdAt: Date.now(),
    editedAt: null,
    embeds: detectEmbeds(content),
    attachments: pendingAttachment ? [pendingAttachment] : [],
    softDeleted: null
  };
  try {
    await addData(scope.path, message);
    setComposerValue('');
    pendingAttachment = null;
    handleTypingStop();
    if (content.includes(':quasarstorm:')) {
      triggerQuasarstorm();
    }
  } catch (error) {
    console.error(error);
    showToast('Failed to send message');
  }
}

  function handleTyping(value) {
  const user = getCurrentUser();
  if (!scope || !config.FEATURES.typing || !user) return;
  if (value && value.trim().length > 0) {
    startTyping(scope.type, scope.id, user.uid);
  } else {
    stopTyping();
  }
}

function handleTypingStop() {
  stopTyping();
}

async function handleTypingUsers(uids) {
  const user = getCurrentUser();
  const others = uids.filter((uid) => uid !== user?.uid);
  if (others.length) {
    const lookup = await fetchDisplayNames([others[0]]);
    const display = lookup[others[0]] || 'Static';
    const base = display.split(' ')[0] || 'Static';
    const message = others.length === 1 ? `${base} is typing...` : `${base} and ${others.length - 1} others are typing...`;
    showTypingIndicator(message);
  } else {
    clearTypingIndicator();
  }
}

export function attachUpload(attachment) {
  pendingAttachment = attachment;
  const placeholder = `${getComposerValue()} [image attached]`;
  setComposerValue(placeholder.trim());
}

export async function editMessage(messageId, content) {
  const message = messages.find((item) => item.id === messageId);
  if (!message) return;
  const user = getCurrentUser();
  if (!user || message.authorId !== user.uid) {
    showToast('You cannot edit this message');
    return;
  }
  await updateData(`${scope.path}/${messageId}`, {
    content: enforceMessageLimit(content),
    editedAt: Date.now()
  });
  showToast('Message updated');
}

export async function softDelete(messageId, reason = 'removed') {
  const user = getCurrentUser();
  if (!user) return;
  await updateData(`${scope.path}/${messageId}/softDeleted`, {
    by: user.uid,
    at: Date.now(),
    reason
  });
  showToast('Message removed for everyone');
}

export async function toggleReaction(messageId, emoji) {
  const user = getCurrentUser();
  if (!user || !config.FEATURES.reactions) return;
  const message = messages.find((item) => item.id === messageId);
  if (!message) return;
  const path = `${scope.path}/${messageId}/reactions/${emoji}/${user.uid}`;
  const hasReacted = message.reactions && message.reactions[emoji] && message.reactions[emoji][user.uid];
  if (hasReacted) {
    await removeData(path);
  } else {
    await updateData(path, true);
  }
}

function openMessageMenu(x, y, messageId) {
  const user = getCurrentUser();
  const message = messages.find((item) => item.id === messageId);
  if (!message) return;
  const items = [
    { label: 'Reply', onSelect: () => navigateTo({ ...getState(), replyTo: messageId }) },
    { label: 'Copy link', onSelect: () => navigator.clipboard.writeText(window.location.href + `&message=${messageId}`) }
  ];
  if (user && message.authorId === user.uid) {
    items.push({ label: 'Edit', onSelect: () => promptEdit(message) });
  }
  items.push({ label: pinnedIds.has(messageId) ? 'Unpin' : 'Pin', onSelect: () => togglePin(messageId, pinnedIds.has(messageId)) });
  items.push({ label: 'Soft delete', onSelect: () => softDelete(messageId) });
  items.push({ label: 'Report', onSelect: () => reportMessage(messageId) });
  openMenu(x, y, items);
}

function promptEdit(message) {
  const result = window.prompt('Edit message', message.content);
  if (result !== null) {
    editMessage(message.id, result);
  }
}

async function reportMessage(messageId) {
  const { openReportModal } = await import('./reports.ts');
  openReportModal({ scope, messageId });
}

export function getMessages() {
  return messages;
}

function resolvePinsPath(target) {
  if (!target) return null;
  if (target.type === 'channel') return `/channelPins/${target.serverId}/${target.id}`;
  if (target.type === 'dm') return `/dmPins/${target.id}`;
  if (target.type === 'group') return `/groupPins/${target.id}`;
  return null;
}

function syncPinnedMeta() {
  const entries = Array.from(pinnedIds)
    .map((id) => {
      const message = messages.find((item) => item.id === id);
      if (!message) return null;
      const record = pinRecords[id] || {};
      const snippet = (message.content || '').replace(/\s+/g, ' ').slice(0, 60) || '[attachment]';
      return {
        id,
        author: message.authorName || 'Member',
        snippet,
        pinnedAt: formatTimestamp(record.pinnedAt || Date.now())
      };
    })
    .filter(Boolean);
  renderPinnedMessages(entries);
}

async function togglePin(messageId, currentlyPinned) {
  const user = getCurrentUser();
  if (!user || !scope) return;
  const path = resolvePinsPath(scope);
  if (!path) return;
  try {
    if (currentlyPinned) {
      await removeData(`${path}/${messageId}`);
      showToast('Message unpinned');
    } else {
      await updateData(`${path}/${messageId}`, {
        pinnedBy: user.uid,
        pinnedAt: Date.now()
      });
      showToast('Message pinned');
    }
  } catch (error) {
    console.error(error);
    showToast('Unable to update pin');
  }
}
