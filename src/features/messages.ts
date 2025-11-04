import { listenList, addData, updateData, removeData } from '../data/db.ts';
import { renderMessages, showTypingIndicator, clearTypingIndicator, setComposerState, onComposerSubmit, onComposerInput, getComposerValue, setComposerValue } from '../ui/layout.ts';
import { subscribe, getState, navigateTo } from '../router.ts';
import { getCurrentUser } from '../auth/session.ts';
import { enforceMessageLimit, sanitizeMarkdown } from '../utils/validate.ts';
import { showToast } from '../ui/toast.ts';
import config from '../config.ts';
import { startTyping, stopTyping, listenTyping } from '../data/typing.ts';
import { formatTimestamp } from '../utils/time.ts';
import { openMenu } from '../ui/menu.ts';
import { detectEmbeds } from './embeds.ts';

let unsubscribeMessages;
let unsubscribeTyping;
let scope = null;
let messages = [];
let pendingAttachment = null;

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
    return { type: 'channel', id: state.channelId, serverId: state.serverId, path: `/channelsMessages/${state.serverId}/${state.channelId}` };
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
  messages = [];
  renderMessages([]);
  setComposerValue('');
  setComposerState({ disabled: false, placeholder: 'Message' });
  pendingAttachment = null;

  unsubscribeMessages = listenList(target.path, {
    added: (id, value) => {
      messages.push({ id, ...value });
      render();
    },
    changed: (id, value) => {
      const index = messages.findIndex((message) => message.id === id);
      if (index > -1) {
        messages[index] = { ...messages[index], ...value };
        render();
      }
    },
    removed: (id) => {
      messages = messages.filter((message) => message.id !== id);
      render();
    }
  });

  if (config.FEATURES.typing) {
    unsubscribeTyping = listenTyping(target.type, target.id, handleTypingUsers);
  }
}

function render() {
  const user = getCurrentUser();
  const rendered = messages
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    .slice(-200)
    .map((message) => {
      const embeds = detectEmbeds(message.content || '').concat(message.embeds || []);
      return {
        id: message.id,
        authorId: message.authorId,
        authorName: message.authorName || message.authorDisplayName || 'Member',
        authorAvatar: message.authorAvatar,
        timestamp: formatTimestamp(message.createdAt),
        contentHtml: message.softDeleted ? '<em>This message was removed</em>' : sanitizeMarkdown(message.content || ''),
        edited: !!message.editedAt,
        softDeleted: !!message.softDeleted,
        reactions: message.reactions ? Object.entries(message.reactions).map(([emoji, users]) => ({ emoji, count: Object.keys(users || {}).length })) : [],
        attachments: message.attachments,
        embeds
      };
    });
  renderMessages(rendered);
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

function handleTypingUsers(uids) {
  const user = getCurrentUser();
  const others = uids.filter((uid) => uid !== user?.uid);
  if (others.length) {
    showTypingIndicator(`${others.length === 1 ? 'Someone' : `${others.length} people`} are typing…`);
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
