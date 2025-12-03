import { addData, updateData, listenValue, setData } from '../data/db.ts';
import { renderServers, setHeader, renderMembers } from '../ui/layout.ts';
import { navigateTo, getState } from '../router.ts';
import { showToast } from '../ui/toast.ts';
import { registerHotkeyTargets } from '../ui/tabs.ts';
import { getCurrentUser } from '../auth/session.ts';

let servers = [];
let unsubscribe;
let memberUnsubscribe;

export function initServers() {
  if (unsubscribe) unsubscribe();
  unsubscribe = listenValue('/servers', (value) => {
    const user = getCurrentUser();
    if (!value || !user) {
      servers = [];
      renderServers([], null);
      return;
    }
    servers = Object.entries(value)
      .filter(([id, data]) => data.members && data.members[user.uid])
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    const activeServer = getState().serverId || servers[0]?.id || null;
    renderServers(servers.map((server) => ({
      id: server.id,
      name: server.name,
      iconUrl: server.iconUrl,
      unreadCount: server.unreadCount || 0
    })), activeServer);
    registerHotkeyTargets(servers.slice(0, 9).map((server) => ({
      label: `Server • ${server.name}`,
      onSelect: () => navigateTo({ view: 'channel', serverId: server.id })
    })));
    if (!getState().serverId && servers.length) {
      navigateTo({ view: 'channel', serverId: servers[0].id });
    }
  });

  document.addEventListener('sq:navigate-server', (event) => {
    const { serverId } = event.detail;
    navigateTo({ view: 'channel', serverId, channelId: null });
  });
}

export function getServers() {
  return servers;
}

export function watchMembers(serverId) {
  if (memberUnsubscribe) {
    memberUnsubscribe();
    memberUnsubscribe = null;
  }
  if (!serverId) {
    renderMembers([]);
    return;
  }
  memberUnsubscribe = listenValue(`/servers/${serverId}/members`, (value) => {
    if (!value) {
      renderMembers([]);
      return;
    }
    const members = Object.entries(value).map(([uid, member]) => ({
      uid,
      displayName: member.displayName || member.username || 'Member',
      username: member.username,
      avatarUrl: member.avatarUrl,
      presence: member.presence || 'offline'
    }));
    renderMembers(members);
  });
}

export async function createServer({ name, iconUrl }) {
  const user = getCurrentUser();
  if (!user) throw new Error('Authentication required');
  const serverId = await addData('/servers', {
    name,
    iconUrl: iconUrl || '',
    ownerId: user.uid,
    createdAt: Date.now()
  });
  await setData(`/servers/${serverId}/members/${user.uid}`, {
    joinedAt: Date.now(),
    roles: { owner: true },
    perms: {
      manageServer: true,
      manageChannels: true,
      manageMembers: true,
      manageMessages: true,
      manageRoles: true,
      viewAudit: true
    }
  });
  await setData(`/servers/${serverId}/roles/owner`, {
    name: 'Owner',
    perms: {
      manageChannels: true,
      kick: true,
      ban: true,
      viewAudit: true
    }
  });
  showToast('Server created');
  navigateTo({ view: 'channel', serverId });
}

export async function updateServer(serverId, data) {
  await updateData(`/servers/${serverId}`, data);
  showToast('Server updated');
}

export function getServer(serverId) {
  return servers.find((server) => server.id === serverId) || null;
}

export function configureHeaderForServer(serverId) {
  const server = getServer(serverId);
  if (!server) return;
  setHeader(server.name, [
    { label: 'Invite', onSelect: () => openInviteModal(serverId) },
    { label: 'Settings', onSelect: () => openServerSettings(serverId) }
  ]);
}

async function openInviteModal(serverId) {
  const { createModal } = await requireModal();
  const inviteId = Math.random().toString(36).slice(2, 10);
  const url = `${window.location.origin}/#server=${serverId}&invite=${inviteId}`;
  createModal({
    title: 'Invite friends',
    body: `<p>Share this invite URL:</p><code>${url}</code>`
  });
}

async function openServerSettings(serverId) {
  const { openServerSettingsPanel } = await requireSettings();
  openServerSettingsPanel(serverId);
}

function requireModal() {
  return import('../ui/modal.ts');
}

function requireSettings() {
  return import('./settings.ts');
}
