import { createModal } from '../ui/modal.ts';
import { renderWatermark, setTheme, setDensity } from '../ui/layout.ts';
import { getCurrentUser, updateDisplayName, updateUsername, updateSettings } from '../auth/session.ts';
import { logout } from '../auth/auth.ts';
import config from '../config.ts';
import { showToast } from '../ui/toast.ts';

let currentTheme = config.THEME.darkDefault ? 'dark' : 'light';

export function initTheme() {
  applyTheme(currentTheme);
}

export function toggleTheme() {
  const order = ['dark', 'static', 'light', 'contrast'];
  const currentIndex = order.indexOf(currentTheme);
  const nextTheme = order[(currentIndex + 1) % order.length];
  applyTheme(nextTheme);
  if (nextTheme === 'contrast') {
    document.body.dataset.highContrast = 'true';
    setDensity('compact');
  }
  void persistSettings({ theme: nextTheme }).catch((error) => {
    console.error(error);
  });
}

export function openServerSettingsPanel(serverId) {
  const modal = createModal({
    title: 'Server settings',
    body: `<p>Manage server <strong>${serverId}</strong>. Channel configuration, invites, and moderation controls will appear here when you have the required permissions.</p>`
  });
  renderWatermark(modal.content);
}

export function openProfileSettings() {
  openSettingsPanel('profile');
}

export function openSettingsPanel(defaultSection = 'profile') {
  const user = getCurrentUser();
  const preferences = {
    theme: user?.profile?.settings?.theme ?? currentTheme,
    notifications: user?.profile?.settings?.notifications ?? true,
    lockOnLogout: user?.profile?.settings?.lockOnLogout ?? false,
    desktop: user?.profile?.settings?.desktop ?? false,
    muteMentions: user?.profile?.settings?.muteMentions ?? false,
    pushMentionsOnly: user?.profile?.settings?.pushMentionsOnly ?? false,
    allowFriendRequests: user?.profile?.settings?.allowFriendRequests ?? true,
    density: user?.profile?.settings?.density ?? 'cozy',
    highContrast: user?.profile?.settings?.highContrast ?? false
  };
  applyTheme(preferences.theme);
  setDensity(preferences.density);
  document.body.dataset.highContrast = String(!!preferences.highContrast);

  const modal = createModal({
    title: 'User settings',
    body: `
      <div class="settings-panel">
        <nav class="settings-nav" role="tablist" aria-label="Settings categories">
          <button role="tab" data-section="profile">Profile</button>
          <button role="tab" data-section="appearance">Appearance</button>
          <button role="tab" data-section="notifications">Notifications</button>
          <button role="tab" data-section="security">Security</button>
          <button role="tab" data-section="about">About</button>
        </nav>
        <section class="settings-sections">
          <form class="settings-section" data-section="profile" aria-label="Profile settings">
            <h3>Profile</h3>
            <p>Update how other people see you across StaticQuasar Chat.</p>
            <label class="settings-field">
              <span>Display name</span>
              <input id="settings-display" type="text" maxlength="64" value="${user?.displayName ?? ''}" />
            </label>
            <label class="settings-field">
              <span>Username</span>
              <input id="settings-username" type="text" maxlength="32" value="${user?.profile?.username ?? ''}" />
            </label>
            <div class="settings-row">
              <button type="button" id="settings-avatar">Upload avatar</button>
              <button type="submit" class="primary">Save profile</button>
            </div>
          </form>

          <form class="settings-section" data-section="appearance" aria-label="Appearance settings">
            <h3>Appearance</h3>
            <p>Pick a theme and layout that matches how you like to read chats.</p>
            <fieldset class="settings-fieldset">
              <legend>Theme preference</legend>
              <label><input type="radio" name="settings-theme" value="dark" ${preferences.theme === 'dark' ? 'checked' : ''}/> Discord Dark</label>
              <label><input type="radio" name="settings-theme" value="static" ${preferences.theme === 'static' ? 'checked' : ''}/> Static Mode (purple glow)</label>
              <label><input type="radio" name="settings-theme" value="light" ${preferences.theme === 'light' ? 'checked' : ''}/> Clean Light</label>
              <label><input type="radio" name="settings-theme" value="contrast" ${preferences.theme === 'contrast' ? 'checked' : ''}/> High Contrast</label>
            </fieldset>
            <label class="settings-field checkbox">
              <input id="settings-high-contrast" type="checkbox" ${preferences.highContrast ? 'checked' : ''} />
              <span>Boost contrast for text and UI accents</span>
            </label>
            <fieldset class="settings-fieldset">
              <legend>Message density</legend>
              <label><input type="radio" name="settings-density" value="cozy" ${preferences.density === 'cozy' ? 'checked' : ''}/> Cozy</label>
              <label><input type="radio" name="settings-density" value="compact" ${preferences.density === 'compact' ? 'checked' : ''}/> Compact</label>
            </fieldset>
            <div class="settings-row">
              <button type="button" id="settings-preview-dark">Preview dark</button>
              <button type="button" id="settings-preview-light">Preview light</button>
              <button type="button" id="settings-preview-static">Preview static</button>
              <button type="submit" class="primary">Apply appearance</button>
            </div>
          </form>

          <form class="settings-section" data-section="notifications" aria-label="Notification settings">
            <h3>Notifications</h3>
            <p>Control which alerts reach you in-app and on desktop.</p>
            <label class="settings-field checkbox">
              <input id="settings-notifications" type="checkbox" ${preferences.notifications ? 'checked' : ''}/>
              <span>Enable in-app toasts</span>
            </label>
            <label class="settings-field checkbox">
              <input id="settings-desktop" type="checkbox" ${preferences.desktop ? 'checked' : ''}/>
              <span>Desktop push (requires enabling FCM)</span>
            </label>
            <label class="settings-field checkbox">
              <input id="settings-mentions" type="checkbox" ${preferences.muteMentions ? 'checked' : ''}/>
              <span>Mute @mention sounds</span>
            </label>
            <label class="settings-field checkbox">
              <input id="settings-push-mentions" type="checkbox" ${preferences.pushMentionsOnly ? 'checked' : ''}/>
              <span>Push notifications for mentions only</span>
            </label>
            <label class="settings-field checkbox">
              <input id="settings-friends" type="checkbox" ${preferences.allowFriendRequests ? 'checked' : ''}/>
              <span>Allow new friend requests</span>
            </label>
            <div class="settings-row">
              <button type="submit" class="primary">Save notification preferences</button>
            </div>
          </form>

          <form class="settings-section" data-section="security" aria-label="Security settings">
            <h3>Security</h3>
            <p>Keep your account and sessions safe.</p>
            <label class="settings-field checkbox">
              <input id="settings-lock" type="checkbox" ${preferences.lockOnLogout ? 'checked' : ''}/>
              <span>Require password on logout</span>
            </label>
            <div class="settings-row">
              <button type="button" id="settings-reset-password">Reset password</button>
              <button type="button" id="settings-logout" class="danger">Log out</button>
            </div>
          </form>

          <section class="settings-section" data-section="about" aria-label="About StaticQuasar Chat">
            <h3>About StaticQuasar Chat</h3>
            <p>Made by StaticQuasar931. A lightweight Discord-style client backed by Firebase Realtime Database.</p>
            <ul class="settings-list">
              <li>Hotkeys: Ctrl+K for quick switcher, Ctrl+1–9 to jump chats, Ctrl+Shift+Arrows for servers.</li>
              <li>Supports servers, channels, DMs, group chats, reactions, reports, and soft deletes.</li>
              <li>Theme toggle and accessibility features keep things comfortable and inclusive.</li>
            </ul>
            <div id="settings-watermark"></div>
          </section>
        </section>
      </div>
    `,
    actions: [
      { label: 'Close', onSelect: () => {} }
    ]
  });

  setupSettingsInteractions(modal.content, preferences, defaultSection);
}

function setupSettingsInteractions(container, preferences, defaultSection) {
  const tabs = Array.from(container.querySelectorAll('.settings-nav button'));
  const sections = Array.from(container.querySelectorAll('.settings-section'));

  function activate(sectionId) {
    tabs.forEach((tab) => {
      const isActive = tab.dataset.section === sectionId;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
    });
    sections.forEach((section) => {
      section.toggleAttribute('hidden', section.dataset.section !== sectionId);
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activate(tab.dataset.section || defaultSection));
    tab.addEventListener('keydown', (event) => {
      const index = tabs.indexOf(tab);
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        const next = tabs[(index + 1) % tabs.length];
        next.focus();
        activate(next.dataset.section || defaultSection);
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const prev = tabs[(index - 1 + tabs.length) % tabs.length];
        prev.focus();
        activate(prev.dataset.section || defaultSection);
      }
    });
  });

  activate(defaultSection);

  const watermarkHost = container.querySelector('#settings-watermark');
  if (watermarkHost) {
    renderWatermark(watermarkHost);
  }

  const profileForm = container.querySelector('[data-section="profile"]');
  profileForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const displayName = profileForm.querySelector('#settings-display').value.trim();
    const username = profileForm.querySelector('#settings-username').value.trim();
    try {
      await updateDisplayName(displayName);
      await updateUsername(username);
      showToast('Profile updated');
    } catch (error) {
      console.error(error);
      showToast('Could not update profile');
    }
  });

  const avatarButton = container.querySelector('#settings-avatar');
  avatarButton?.addEventListener('click', () => {
    showToast('Avatar uploads are coming soon. Use the profile image uploader in chats for now.');
  });

  const appearanceForm = container.querySelector('[data-section="appearance"]');
  appearanceForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const choice = appearanceForm.querySelector('input[name="settings-theme"]:checked');
    const densityChoice = appearanceForm.querySelector('input[name="settings-density"]:checked');
    const highContrastToggle = appearanceForm.querySelector('#settings-high-contrast');
    if (!choice) return;
    preferences.theme = choice.value;
    preferences.density = densityChoice?.value || 'cozy';
    preferences.highContrast = !!highContrastToggle?.checked;
    applyTheme(choice.value);
    setDensity(preferences.density);
    document.body.dataset.highContrast = String(preferences.highContrast);
    try {
      await persistSettings({ ...preferences });
      showToast(`Appearance updated (${choice.value}, ${preferences.density})`);
    } catch (error) {
      console.error(error);
      showToast('Unable to update theme');
    }
  });

  appearanceForm?.querySelector('#settings-preview-dark')?.addEventListener('click', () => {
    applyTheme('dark');
    const radio = appearanceForm.querySelector('input[value="dark"]');
    if (radio) radio.checked = true;
  });
  appearanceForm?.querySelector('#settings-preview-light')?.addEventListener('click', () => {
    applyTheme('light');
    const radio = appearanceForm.querySelector('input[value="light"]');
    if (radio) radio.checked = true;
  });
  appearanceForm?.querySelector('#settings-preview-static')?.addEventListener('click', () => {
    applyTheme('static');
    const radio = appearanceForm.querySelector('input[value="static"]');
    if (radio) radio.checked = true;
  });

  appearanceForm?.querySelector('#settings-high-contrast')?.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const checked = target.checked;
    preferences.highContrast = checked;
    document.body.dataset.highContrast = String(checked);
  });

  appearanceForm?.querySelectorAll('input[name="settings-density"]').forEach((input) => {
    input.addEventListener('change', () => {
      if (!(input instanceof HTMLInputElement)) return;
      preferences.density = input.value;
      setDensity(preferences.density);
    });
  });

  const notificationForm = container.querySelector('[data-section="notifications"]');
  notificationForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const notifications = notificationForm.querySelector('#settings-notifications').checked;
    const desktop = notificationForm.querySelector('#settings-desktop').checked;
    const muteMentions = notificationForm.querySelector('#settings-mentions').checked;
    const pushMentionsOnly = notificationForm.querySelector('#settings-push-mentions').checked;
    const allowFriendRequests = notificationForm.querySelector('#settings-friends').checked;
    preferences.notifications = notifications;
    preferences.desktop = desktop;
    preferences.muteMentions = muteMentions;
    preferences.pushMentionsOnly = pushMentionsOnly;
    preferences.allowFriendRequests = allowFriendRequests;
    try {
      await persistSettings({ ...preferences });
      showToast('Notification preferences saved');
    } catch (error) {
      console.error(error);
      showToast('Could not update notifications');
    }
  });

  const securityForm = container.querySelector('[data-section="security"]');
  const lockToggle = securityForm?.querySelector('#settings-lock');
  lockToggle?.addEventListener('change', async () => {
    preferences.lockOnLogout = !!lockToggle.checked;
    await persistSettings({ ...preferences });
    showToast(lockToggle.checked ? 'Logout lock enabled' : 'Logout lock disabled');
  });

  securityForm?.querySelector('#settings-reset-password')?.addEventListener('click', () => {
    showToast('Use the “Forgot password” link on the sign-in dialog to reset.');
  });

  securityForm?.querySelector('#settings-logout')?.addEventListener('click', async () => {
    await logout();
    showToast('Signed out');
  });
}

function applyTheme(theme) {
  currentTheme = theme;
  setTheme(theme);
}

async function persistSettings(values) {
  const user = getCurrentUser();
  if (!user) return;
  const existing = user.profile?.settings ?? {};
  await updateSettings({ ...existing, ...values });
}

export function getTheme() {
  return currentTheme;
}
