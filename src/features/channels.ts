import { listenValue, addData, updateData } from '../data/db.ts';
import { renderChannels } from '../ui/layout.ts';
import { navigateTo, getState } from '../router.ts';
import { showToast } from '../ui/toast.ts';
import { getCurrentUser, onSession } from '../auth/session.ts';

let channels = [];
let dms = [];
let groups = [];
let unsubscribeChannels;
let unsubscribeDms;
let unsubscribeGroups;

export function initChannels() {
  const state = getState();
  if (state.serverId) subscribeToServerChannels(state.serverId);
  subscribeToDms();
  subscribeToGroups();

  onSession(() => {
    subscribeToDms();
    subscribeToGroups();
    const next = getState();
    if (next.serverId) subscribeToServerChannels(next.serverId);
  });

  document.addEventListener('sq:navigate-channel', (event) => {
    const { channelId } = event.detail;
    navigateTo({ ...getState(), view: 'channel', channelId });
  });

  document.addEventListener('sq:navigate-dm', (event) => {
    const { dmId } = event.detail;
    navigateTo({ view: 'dm', dmId });
  });

  document.addEventListener('sq:navigate-group', (event) => {
    const { groupId } = event.detail;
    navigateTo({ view: 'group', groupId });
  });
}

export function subscribeToServerChannels(serverId) {
  if (unsubscribeChannels) unsubscribeChannels();
  unsubscribeChannels = listenValue(`/servers/${serverId}/channels`, (value) => {
    const state = getState();
    if (!value) {
      channels = [];
      renderChannels({ channels: [], dms, groups });
      return;
    }
    channels = Object.entries(value)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    const active = state.channelId || channels[0]?.id;
    renderChannels({
      channels: channels.map((channel) => ({
        id: channel.id,
        name: channel.name,
        unreadCount: channel.unreadCount || 0,
        active: channel.id === active,
        isLocked: channel.optionalPasswordHash
      })),
      dms,
      groups
    });
    if (!state.channelId && channels.length) {
      navigateTo({ ...state, view: 'channel', channelId: channels[0].id, serverId });
    }
  });
}

function subscribeToDms() {
  if (unsubscribeDms) unsubscribeDms();
  const user = getCurrentUser();
  if (!user) return;
  unsubscribeDms = listenValue('/dms', (value) => {
    if (!value) {
      dms = [];
    } else {
      dms = Object.entries(value)
        .filter(([id, data]) => data.memberIds && data.memberIds[user.uid])
        .map(([id, data]) => ({ id, ...data }));
    }
    const state = getState();
    renderChannels({ channels, dms: decorateChats(dms, state.dmId), groups: decorateChats(groups, state.groupId) });
  });
}

function subscribeToGroups() {
  if (unsubscribeGroups) unsubscribeGroups();
  const user = getCurrentUser();
  if (!user) return;
  unsubscribeGroups = listenValue('/groupDms', (value) => {
    if (!value) {
      groups = [];
    } else {
      groups = Object.entries(value)
        .filter(([id, data]) => data.memberIds && data.memberIds[user.uid])
        .map(([id, data]) => ({ id, ...data }));
    }
    const state = getState();
    renderChannels({ channels, dms: decorateChats(dms, state.dmId), groups: decorateChats(groups, state.groupId) });
  });
}

function decorateChats(list, activeId) {
  return list.map((item) => ({
    id: item.id,
    name: item.name || item.displayName || 'Conversation',
    unreadCount: item.unreadCount || 0,
    active: item.id === activeId,
    isLocked: !!item.optionalPasswordHash
  }));
}

export async function createChannel(serverId, payload) {
  const channelId = await addData(`/servers/${serverId}/channels`, {
    name: payload.name,
    type: 'text',
    createdAt: Date.now(),
    position: channels.length + 1,
    permissions: payload.permissions || {}
  });
  showToast('Channel created');
  navigateTo({ view: 'channel', serverId, channelId });
  return channelId;
}

export async function updateChannel(serverId, channelId, data) {
  await updateData(`/servers/${serverId}/channels/${channelId}`, data);
  showToast('Channel updated');
}

export async function createDm(targetUid) {
  const user = getCurrentUser();
  if (!user) throw new Error('Authentication required');
  const existing = dms.find((dm) => Object.keys(dm.memberIds || {}).includes(targetUid));
  if (existing) {
    navigateTo({ view: 'dm', dmId: existing.id });
    return existing.id;
  }
  const dmId = await addData('/dms', {
    memberIds: { [user.uid]: true, [targetUid]: true },
    createdAt: Date.now()
  });
  showToast('Direct message started');
  navigateTo({ view: 'dm', dmId });
  return dmId;
}

export async function createGroupDm(memberIds, name) {
  const user = getCurrentUser();
  if (!user) throw new Error('Authentication required');
  const payload = memberIds.reduce((acc, uid) => ({ ...acc, [uid]: true }), { [user.uid]: true });
  const groupId = await addData('/groupDms', {
    memberIds: payload,
    createdAt: Date.now(),
    name
  });
  showToast('Group chat created');
  navigateTo({ view: 'group', groupId });
  return groupId;
}
