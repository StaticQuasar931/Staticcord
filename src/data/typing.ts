import { getDatabase, ref, set, remove, onValue } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js';
import { getApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';

let typingRef;

export function startTyping(scopeType, scopeId, uid) {
  if (!uid) return;
  const db = getDatabase(getApp());
  typingRef = ref(db, `/typing/${scopeType}/${scopeId}/${uid}`);
  set(typingRef, true);
}

export function stopTyping() {
  if (!typingRef) return;
  remove(typingRef);
  typingRef = null;
}

export function listenTyping(scopeType, scopeId, callback) {
  const db = getDatabase(getApp());
  const target = ref(db, `/typing/${scopeType}/${scopeId}`);
  const unsubscribe = onValue(target, (snapshot) => {
    const value = snapshot.val() || {};
    callback(Object.keys(value));
  });
  return () => unsubscribe();
}
