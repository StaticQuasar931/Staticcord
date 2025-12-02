const listeners = new Set();
const state = {
  view: 'channel',
  serverId: null,
  channelId: null,
  dmId: null,
  groupId: null
};

export function subscribe(listener) {
  listeners.add(listener);
  listener({ ...state });
  return () => listeners.delete(listener);
}

export function navigateTo(target) {
  Object.assign(state, target);
  listeners.forEach((listener) => listener({ ...state }));
  updateHash();
}

export function getState() {
  return { ...state };
}

function updateHash() {
  const params = new URLSearchParams();
  if (state.serverId) params.set('server', state.serverId);
  if (state.channelId) params.set('channel', state.channelId);
  if (state.dmId) params.set('dm', state.dmId);
  if (state.groupId) params.set('group', state.groupId);
  const hash = params.toString();
  window.history.replaceState(null, '', hash ? `#${hash}` : window.location.pathname);
}

export function restoreFromHash() {
  const hash = window.location.hash.replace(/^#/, '');
  const params = new URLSearchParams(hash);
  const serverId = params.get('server');
  const channelId = params.get('channel');
  const dmId = params.get('dm');
  const groupId = params.get('group');
  Object.assign(state, {
    serverId,
    channelId,
    dmId,
    groupId,
    view: dmId ? 'dm' : groupId ? 'group' : 'channel'
  });
  listeners.forEach((listener) => listener({ ...state }));
}

window.addEventListener('hashchange', restoreFromHash);
