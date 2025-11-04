import { getDatabase, ref, onDisconnect, set } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js';
import { getApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { serverTime } from './db.ts';

let presenceRef;

export function initPresence(uid) {
  if (!uid) return;
  const db = getDatabase(getApp());
  presenceRef = ref(db, `/presence/${uid}`);
  set(presenceRef, { state: 'online', updatedAt: serverTime() });
  onDisconnect(presenceRef).set({ state: 'offline', updatedAt: serverTime() });
  window.addEventListener('beforeunload', () => {
    set(presenceRef, { state: 'offline', updatedAt: Date.now() });
  });
}

export function updatePresence(state) {
  if (!presenceRef) return;
  set(presenceRef, { state, updatedAt: serverTime() });
}
