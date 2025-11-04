import { initFirebase, loginWithGoogle as loginGoogleProvider, loginWithEmail as loginEmailProvider, registerWithEmail as registerEmailProvider } from './auth/auth.ts';
import { initSession, onSession } from './auth/session.ts';
import { initLayout, setHeader, getComposerValue } from './ui/layout.ts';
import { initServers, configureHeaderForServer, watchMembers } from './features/servers.ts';
import { initChannels, subscribeToServerChannels } from './features/channels.ts';
import { initMessages } from './features/messages.ts';
import { initEmojiPicker } from './features/emoji.ts';
import { initTheme, toggleTheme, openProfileSettings } from './features/settings.ts';
import { enqueueUpload, isUploading } from './features/uploads.ts';
import { initNotifications } from './features/notifications.ts';
import { restoreFromHash, subscribe, getState } from './router.ts';
import { showToast } from './ui/toast.ts';
import { createModal } from './ui/modal.ts';
import { initPresence } from './data/presence.ts';

initFirebase();
initSession();
initTheme();
initLayout({
  onThemeToggle: () => toggleTheme(),
  onUploadClick: (file) => handleUpload(file)
});
initServers();
initChannels();
initMessages();
initEmojiPicker();
initNotifications();
restoreFromHash();

onSession((user) => {
  if (!user) {
    showAuthPrompt();
  } else {
    const splash = document.getElementById('splash');
    if (splash) splash.hidden = true;
    initPresence(user.uid);
  }
});

subscribe((state) => {
  if (state.serverId) {
    configureHeaderForServer(state.serverId);
    subscribeToServerChannels(state.serverId);
    watchMembers(state.serverId);
  }
  if (state.view === 'dm') {
    setHeader('Direct Messages', [
      { label: 'Profile', onSelect: () => openProfileSettings() }
    ]);
  }
  if (state.view === 'group') {
    setHeader('Group Chat', [
      { label: 'Profile', onSelect: () => openProfileSettings() }
    ]);
  }
});

function handleUpload(file) {
  const state = getState();
  const scope = state.view === 'channel'
    ? { type: 'channel', id: state.channelId, serverId: state.serverId }
    : state.view === 'dm'
    ? { type: 'dm', id: state.dmId }
    : { type: 'group', id: state.groupId };
  enqueueUpload(file, scope);
}

function showAuthPrompt() {
  if (document.querySelector('[data-modal="open"]')) return;
  const modal = createModal({
    title: 'Sign in to StaticQuasar Chat',
    body: `
      <p>Choose a sign in method to continue.</p>
      <button id="login-google">Continue with Google</button>
      <div>
        <input id="login-email" type="email" placeholder="Email" />
        <input id="login-password" type="password" placeholder="Password" />
      </div>
    `,
    actions: [
      { label: 'Register', onSelect: () => registerWithEmail(modal.root) },
      { label: 'Sign In', onSelect: () => loginWithEmail(modal.root) }
    ]
  });
  modal.root.querySelector('#login-google').addEventListener('click', async () => {
    try {
      await loginGoogleProvider();
      showToast('Signed in with Google');
    } catch (error) {
      console.error(error);
      showToast('Google sign in failed');
    }
  });
}

async function loginWithEmail(root) {
  const email = root.querySelector('#login-email').value;
  const password = root.querySelector('#login-password').value;
  try {
    await loginEmailProvider(email, password);
    showToast('Signed in');
  } catch (error) {
    console.error(error);
    showToast('Unable to sign in');
    return false;
  }
}

async function registerWithEmail(root) {
  const email = root.querySelector('#login-email').value;
  const password = root.querySelector('#login-password').value;
  try {
    await registerEmailProvider(email, password, email.split('@')[0]);
    showToast('Account created');
  } catch (error) {
    console.error(error);
    showToast('Unable to register');
    return false;
  }
}

window.onbeforeunload = (event) => {
  const dirty = getComposerValue().trim().length > 0 || isUploading();
  if (dirty) {
    event.returnValue = 'You have unsent changes';
    return event.returnValue;
  }
};

window.addEventListener('keydown', (event) => {
  if (event.ctrlKey && !event.shiftKey) {
    const number = parseInt(event.key, 10);
    if (number >= 1 && number <= 9) {
      const target = document.querySelector(`[data-hotkey-index="${number}"]`);
      if (target instanceof HTMLElement) {
        target.click();
        event.preventDefault();
      }
    }
  }
  if (event.ctrlKey && event.shiftKey) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      cycleServer(event.key === 'ArrowRight' ? 1 : -1);
      event.preventDefault();
    }
  }
});

function cycleServer(direction) {
  const buttons = Array.from(document.querySelectorAll('#servers .server-button'));
  if (!buttons.length) return;
  const currentIndex = buttons.findIndex((button) => button.getAttribute('aria-current') === 'true');
  const nextIndex = (currentIndex + direction + buttons.length) % buttons.length;
  const target = buttons[nextIndex];
  target?.dispatchEvent(new Event('click'));
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./public/sw.js');
  });
}
