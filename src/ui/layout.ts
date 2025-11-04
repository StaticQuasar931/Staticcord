import { registerHotkeys } from '../accessibility/a11y-helpers.ts';
import { openQuickSwitcher } from './tabs.ts';

const serversEl = document.getElementById('servers');
const channelsEl = document.getElementById('channels');
const headerTitle = document.getElementById('channel-title');
const headerActions = document.getElementById('header-actions');
const messageList = document.getElementById('message-list');
const sidebarEl = document.getElementById('sidebar');
const composerInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const emojiButton = document.getElementById('emoji-button');
const uploadButton = document.getElementById('upload-button');
const fileInput = document.getElementById('file-input');

let themeToggleButton = null;
let settingsButton = null;
let openSettingsCallback;
let themeToggleCallback;

export function initLayout(options = {}) {
  const { onThemeToggle, onUploadClick, onOpenSettings } = options;
  registerHotkeys({
    'Ctrl+K': () => openQuickSwitcher(),
    Escape: () => closePopovers()
  });

  themeToggleCallback = onThemeToggle;
  openSettingsCallback = onOpenSettings;

  if (!themeToggleButton) {
    themeToggleButton = document.createElement('button');
    themeToggleButton.className = 'header-action';
    themeToggleButton.setAttribute('aria-label', 'Toggle theme');
    themeToggleButton.addEventListener('click', () => themeToggleCallback?.());
    const appliedTheme = document.documentElement.dataset.theme || 'dark';
    themeToggleButton.textContent = appliedTheme === 'light' ? 'Light theme' : 'Dark theme';
    themeToggleButton.setAttribute('data-theme-state', appliedTheme);
  }

  if (!settingsButton) {
    settingsButton = document.createElement('button');
    settingsButton.className = 'header-action';
    settingsButton.textContent = 'User Settings';
    settingsButton.setAttribute('aria-label', 'Open user settings');
    settingsButton.addEventListener('click', () => openSettingsCallback?.());
  }

  headerActions?.appendChild(settingsButton);
  headerActions?.appendChild(themeToggleButton);

  uploadButton?.addEventListener('click', () => {
    fileInput?.click();
  });
  fileInput?.addEventListener('change', (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    onUploadClick?.(file);
    input.value = '';
  });

  emojiButton?.setAttribute('aria-haspopup', 'dialog');
}

function closePopovers() {
  document.querySelectorAll('[data-menu="open"]').forEach((node) => {
    node.remove();
  });
  document.querySelectorAll('[data-modal="open"]').forEach((node) => {
    node.remove();
  });
}

export function renderServers(servers, activeId) {
  if (!serversEl) return;
  serversEl.innerHTML = '';
  const homeButton = document.createElement('button');
  homeButton.className = 'server-button';
  homeButton.textContent = 'SQ';
  homeButton.title = 'StaticQuasar Home';
  homeButton.dataset.serverId = 'home';
  serversEl.appendChild(homeButton);
  servers.forEach((server, index) => {
    const button = document.createElement('button');
    button.className = 'server-button';
    button.dataset.serverId = server.id;
    button.title = server.name;
    if (server.iconUrl) {
      const img = document.createElement('img');
      img.src = server.iconUrl;
      img.alt = `${server.name} icon`;
      button.appendChild(img);
    } else {
      button.textContent = server.name.slice(0, 2).toUpperCase();
    }
    if (server.unreadCount) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = server.unreadCount > 99 ? '99+' : `${server.unreadCount}`;
      button.appendChild(badge);
    }
    if (server.id === activeId) {
      button.setAttribute('aria-current', 'true');
    }
    button.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('sq:navigate-server', { detail: { serverId: server.id } }));
    });
    button.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        const next = button.nextElementSibling;
        if (next instanceof HTMLElement) next.focus();
      } else if (event.key === 'ArrowUp') {
        const prev = button.previousElementSibling;
        if (prev instanceof HTMLElement) prev.focus();
      }
    });
    serversEl.appendChild(button);
    if (index === 8) {
      button.dataset.hotkey = 'Ctrl+9';
    }
  });
}

export function renderChannels(state) {
  if (!channelsEl) return;
  const { channels = [], dms = [], groups = [] } = state;
  channelsEl.innerHTML = '';
  const channelList = document.createElement('div');
  channelList.setAttribute('role', 'tree');
  channels.forEach((channel, index) => {
    const item = document.createElement('button');
    item.textContent = `# ${channel.name}`;
    item.dataset.channelId = channel.id;
    item.className = 'channel-item';
    item.setAttribute('role', 'treeitem');
    item.setAttribute('aria-label', `${channel.name} channel`);
    if (channel.unreadCount) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = channel.unreadCount > 99 ? '99+' : `${channel.unreadCount}`;
      item.appendChild(badge);
    }
    if (channel.isLocked) {
      item.prepend(Object.assign(document.createElement('span'), { textContent: '🔒 ' }));
    }
    if (channel.active) {
      item.setAttribute('aria-current', 'true');
    }
    item.dataset.hotkeyIndex = String(index + 1);
    item.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('sq:navigate-channel', { detail: { channelId: channel.id } }));
    });
    channelList.appendChild(item);
  });

  const dmHeader = document.createElement('header');
  dmHeader.textContent = 'Direct Messages';
  channelsEl.appendChild(channelList);
  channelsEl.appendChild(dmHeader);

  const dmList = document.createElement('div');
  dmList.setAttribute('role', 'list');
  dms.forEach((dm, index) => {
    const item = document.createElement('button');
    item.className = 'channel-item';
    item.dataset.dmId = dm.id;
    item.textContent = dm.name;
    if (dm.unreadCount) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = dm.unreadCount > 99 ? '99+' : `${dm.unreadCount}`;
      item.appendChild(badge);
    }
    if (dm.active) {
      item.setAttribute('aria-current', 'true');
    }
    item.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('sq:navigate-dm', { detail: { dmId: dm.id } }));
    });
    item.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        const next = item.nextElementSibling;
        if (next instanceof HTMLElement) next.focus();
      } else if (event.key === 'ArrowUp') {
        const prev = item.previousElementSibling;
        if (prev instanceof HTMLElement) prev.focus();
      }
    });
    item.dataset.hotkeyIndex = String(index + 1 + channels.length);
    dmList.appendChild(item);
  });

  const groupHeader = document.createElement('header');
  groupHeader.textContent = 'Group Chats';
  channelsEl.appendChild(dmList);
  channelsEl.appendChild(groupHeader);

  const groupList = document.createElement('div');
  groups.forEach((group, index) => {
    const item = document.createElement('button');
    item.className = 'channel-item';
    item.dataset.groupId = group.id;
    item.textContent = group.name;
    if (group.unreadCount) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = group.unreadCount > 99 ? '99+' : `${group.unreadCount}`;
      item.appendChild(badge);
    }
    if (group.active) {
      item.setAttribute('aria-current', 'true');
    }
    item.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('sq:navigate-group', { detail: { groupId: group.id } }));
    });
    item.dataset.hotkeyIndex = String(index + 1 + dms.length + channels.length);
    groupList.appendChild(item);
  });
  channelsEl.appendChild(groupList);
}

export function setHeader(title, actions = []) {
  if (headerTitle) headerTitle.textContent = title;
  if (headerActions) {
    headerActions.innerHTML = '';
    actions.forEach((action) => {
      const button = document.createElement('button');
      button.textContent = action.label;
      button.className = 'header-action';
      button.addEventListener('click', action.onSelect);
      button.setAttribute('aria-label', action.aria || action.label);
      headerActions.appendChild(button);
    });
    if (settingsButton) headerActions.appendChild(settingsButton);
    if (themeToggleButton) headerActions.appendChild(themeToggleButton);
  }
}

export function renderMembers(members) {
  if (!sidebarEl) return;
  sidebarEl.innerHTML = '';
  const header = document.createElement('header');
  header.textContent = `Members — ${members.length}`;
  sidebarEl.appendChild(header);
  const list = document.createElement('div');
  members.forEach((member) => {
    const item = document.createElement('div');
    item.className = 'member';
    item.dataset.status = member.presence || 'offline';
    const avatar = document.createElement('img');
    avatar.src = member.avatarUrl || './assets/placeholder.svg';
    avatar.alt = `${member.displayName} avatar`;
    avatar.width = 32;
    avatar.height = 32;
    item.appendChild(avatar);
    const name = document.createElement('span');
    name.textContent = member.displayName || member.username;
    item.appendChild(name);
    list.appendChild(item);
  });
  sidebarEl.appendChild(list);
}

export function renderMessages(rendered) {
  if (!messageList) return;
  const scrolledToBottom = messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight < 48;
  messageList.innerHTML = '';
  rendered.forEach((message) => {
    const row = document.createElement('div');
    row.className = 'message';
    row.dataset.id = message.id;
    row.setAttribute('role', 'listitem');
    if (message.softDeleted) {
      row.classList.add('soft-deleted');
      row.setAttribute('aria-label', 'Message removed');
    }

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    const avatarImg = document.createElement('img');
    avatarImg.src = message.authorAvatar || './assets/placeholder.svg';
    avatarImg.alt = `${message.authorName} avatar`;
    avatar.appendChild(avatarImg);

    const body = document.createElement('div');
    const meta = document.createElement('div');
    meta.className = 'meta';
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = message.authorName;
    meta.appendChild(name);
    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.textContent = message.timestamp;
    meta.appendChild(timestamp);
    if (message.edited) {
      const edited = document.createElement('span');
      edited.className = 'timestamp';
      edited.textContent = '(edited)';
      meta.appendChild(edited);
    }

    const content = document.createElement('div');
    content.className = 'content';
    content.innerHTML = message.contentHtml;

    body.appendChild(meta);
    body.appendChild(content);

    if (message.embeds?.length) {
      message.embeds.forEach((embed) => {
        const preview = document.createElement('a');
        preview.href = embed.url;
        preview.target = '_blank';
        preview.rel = 'noopener noreferrer';
        preview.textContent = embed.title || embed.url;
        preview.className = 'embed-preview';
        body.appendChild(preview);
      });
    }

    if (message.attachments?.length) {
      message.attachments.forEach((attachment) => {
        const img = document.createElement('img');
        img.src = attachment.url;
        img.alt = attachment.alt || 'uploaded image';
        img.loading = 'lazy';
        img.width = 320;
        img.style.borderRadius = '12px';
        body.appendChild(img);
      });
    }

    if (message.reactions && message.reactions.length) {
      const bar = document.createElement('div');
      bar.className = 'reaction-bar';
      message.reactions.forEach((reaction) => {
        const pill = document.createElement('button');
        pill.className = 'reaction-pill';
        pill.textContent = `${reaction.emoji} ${reaction.count}`;
        pill.addEventListener('click', () => {
          document.dispatchEvent(new CustomEvent('sq:toggle-reaction', { detail: { messageId: message.id, emoji: reaction.emoji } }));
        });
        bar.appendChild(pill);
      });
      body.appendChild(bar);
    }

    const actions = document.createElement('div');
    actions.className = 'actions';
    const reply = document.createElement('button');
    reply.textContent = 'Reply';
    reply.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('sq:reply', { detail: { messageId: message.id } }));
    });
    actions.appendChild(reply);

    const react = document.createElement('button');
    react.textContent = 'React';
    react.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('sq:emoji-picker', { detail: { messageId: message.id } }));
    });
    actions.appendChild(react);

    const report = document.createElement('button');
    report.textContent = 'Report';
    report.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('sq:report-message', { detail: { messageId: message.id } }));
    });
    actions.appendChild(report);

    body.appendChild(actions);

    row.appendChild(avatar);
    row.appendChild(body);
    messageList.appendChild(row);
  });

  if (scrolledToBottom) {
    messageList.scrollTop = messageList.scrollHeight;
  }
}

export function showTypingIndicator(text) {
  if (!messageList) return;
  let indicator = messageList.querySelector('.typing-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    messageList.appendChild(indicator);
  }
  indicator.textContent = text;
}

export function clearTypingIndicator() {
  const indicator = messageList?.querySelector('.typing-indicator');
  if (indicator) indicator.remove();
}

export function setComposerState({ disabled, placeholder }) {
  if (composerInput) composerInput.disabled = !!disabled;
  if (sendButton) sendButton.disabled = !!disabled;
  if (placeholder && composerInput) composerInput.placeholder = placeholder;
}

export function getComposerValue() {
  return composerInput?.value || '';
}

export function setComposerValue(value) {
  if (composerInput) composerInput.value = value;
}

export function onComposerSubmit(handler) {
  if (!sendButton || !composerInput) return;
  sendButton.addEventListener('click', () => {
    handler(getComposerValue());
  });
  composerInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handler(getComposerValue());
    }
  });
}

export function onComposerInput(handler) {
  composerInput?.addEventListener('input', (event) => handler(event.target.value));
}

export function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', theme === 'light' ? '#ffffff' : '#2b2d31');
  if (themeToggleButton) {
    themeToggleButton.textContent = theme === 'light' ? 'Light theme' : 'Dark theme';
    themeToggleButton.setAttribute('data-theme-state', theme);
  }
}

export function showSplash() {
  const splash = document.getElementById('splash');
  if (splash) splash.hidden = false;
}

export function hideSplash() {
  const splash = document.getElementById('splash');
  if (splash) splash.hidden = true;
}

export function renderWatermark(container) {
  const mark = document.createElement('div');
  mark.className = 'watermark';
  mark.textContent = 'StaticQuasar931';
  container.appendChild(mark);
}
