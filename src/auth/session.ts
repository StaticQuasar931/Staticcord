import { onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';
import { getFirebaseAuth } from './auth.ts';
import { dbRef, setData, updateData, listenValue, serverTime } from '../data/db.ts';
import { showToast } from '../ui/toast.ts';
import { isValidUsername } from '../utils/validate.ts';

let currentUser = null;
let unsubUserDoc = null;
const listeners = new Set();

export function onSession(listener) {
  listeners.add(listener);
  if (currentUser) listener(currentUser);
  return () => listeners.delete(listener);
}

function notify(user) {
  listeners.forEach((listener) => listener(user));
}

export function initSession() {
  onAuthStateChanged(getFirebaseAuth(), async (user) => {
    if (unsubUserDoc) {
      unsubUserDoc();
      unsubUserDoc = null;
    }
    if (user) {
      await ensureUserDocument(user);
      unsubUserDoc = listenValue(`/users/${user.uid}`, (value) => {
        currentUser = { ...user, profile: value };
        notify(currentUser);
      });
    } else {
      currentUser = null;
      notify(null);
    }
  });
}

async function ensureUserDocument(user) {
  const ref = dbRef(`/users/${user.uid}`);
  const snapshot = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js').then(({ get }) => get(ref));
  if (!snapshot.exists()) {
    const username = user.email?.split('@')[0].slice(0, 16) + Math.floor(Math.random() * 9999);
    await setData(`/users/${user.uid}`, {
      displayName: user.displayName || user.email,
      username,
      email: user.email,
      avatarUrl: user.photoURL || '',
      createdAt: Date.now(),
      status: 'online',
      settings: { theme: 'dark', notifications: true, lockOnLogout: false }
    });
  }
}

export function getCurrentUser() {
  return currentUser;
}

export async function updateDisplayName(name) {
  if (!currentUser) throw new Error('Not authenticated');
  await updateProfile(currentUser, { displayName: name });
  await updateData(`/users/${currentUser.uid}`, { displayName: name });
  showToast('Display name updated');
}

export async function updateUsername(username) {
  if (!isValidUsername(username)) throw new Error('Username invalid');
  if (!currentUser) throw new Error('Not authenticated');
  await updateData(`/users/${currentUser.uid}`, { username });
  showToast('Username updated');
}

export async function updateSettings(settings) {
  if (!currentUser) throw new Error('Not authenticated');
  await updateData(`/users/${currentUser.uid}/settings`, settings);
}

export async function setPresenceState(state) {
  if (!currentUser) return;
  await updateData(`/presence/${currentUser.uid}`, { state, updatedAt: serverTime() });
}
