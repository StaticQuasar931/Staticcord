import { createModal } from '../ui/modal.ts';
import { renderWatermark, setTheme } from '../ui/layout.ts';
import { getCurrentUser, updateDisplayName, updateUsername, updateSettings } from '../auth/session.ts';
import config from '../config.ts';
import { showToast } from '../ui/toast.ts';

let currentTheme = config.THEME.darkDefault ? 'dark' : 'light';

export function initTheme() {
  setTheme(currentTheme);
}

export function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(currentTheme);
  const user = getCurrentUser();
  if (user) {
    updateSettings({ ...user.profile?.settings, theme: currentTheme });
  }
}

export function openServerSettingsPanel(serverId) {
  const modal = createModal({
    title: 'Server settings',
    body: `<p>Manage server <strong>${serverId}</strong> (coming soon)</p>`
  });
  renderWatermark(modal.content);
}

export function openProfileSettings() {
  const user = getCurrentUser();
  const modal = createModal({
    title: 'Profile',
    body: `
      <label for="profile-display">Display name</label>
      <input id="profile-display" value="${user?.displayName || ''}" />
      <label for="profile-username">Username</label>
      <input id="profile-username" value="${user?.profile?.username || ''}" />
      <label><input type="checkbox" id="profile-notifications" ${user?.profile?.settings?.notifications ? 'checked' : ''}/> Enable notifications</label>
      <label><input type="checkbox" id="profile-lock" ${user?.profile?.settings?.lockOnLogout ? 'checked' : ''}/> Lock account on logout</label>
    `,
    actions: [
      { label: 'Cancel', onSelect: () => {} },
      { label: 'Save', onSelect: () => saveProfile(modal.root) }
    ]
  });
  renderWatermark(modal.content);
}

async function saveProfile(root) {
  const displayName = root.querySelector('#profile-display').value;
  const username = root.querySelector('#profile-username').value;
  const notifications = root.querySelector('#profile-notifications').checked;
  const lockOnLogout = root.querySelector('#profile-lock').checked;
  try {
    await updateDisplayName(displayName);
    await updateUsername(username);
    await updateSettings({ theme: currentTheme, notifications, lockOnLogout });
    showToast('Profile saved');
  } catch (error) {
    console.error(error);
    showToast('Unable to save profile');
    return false;
  }
}

export function getTheme() {
  return currentTheme;
}
