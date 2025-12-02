import { getDatabase, ref, query, orderByChild, startAt, endAt, limitToLast, get } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js';
import { getApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';

export async function searchMessages(scope, term, limit = 50) {
  const db = getDatabase(getApp());
  const path = scope.type === 'channel' ? `/channelsMessages/${scope.id}` : scope.type === 'dm' ? `/dmMessages/${scope.id}` : `/groupDmMessages/${scope.id}`;
  const q = query(ref(db, path), orderByChild('content'), startAt(term), endAt(`${term}\uf8ff`), limitToLast(limit));
  const snapshot = await get(q);
  if (!snapshot.exists()) return [];
  const result = [];
  snapshot.forEach((child) => {
    result.push({ id: child.key, ...child.val() });
  });
  return result.reverse();
}

export async function searchUsers(term, limit = 20) {
  const db = getDatabase(getApp());
  const q = query(ref(db, '/users'), orderByChild('username'), startAt(term), endAt(`${term}\uf8ff`), limitToLast(limit));
  const snapshot = await get(q);
  if (!snapshot.exists()) return [];
  return Object.entries(snapshot.val()).map(([id, value]) => ({ id, ...value }));
}
