import { get } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js';
import { dbRef } from './db.ts';

const cache = new Map();

export async function fetchDisplayNames(uids = []) {
  const result = {};
  const unique = Array.from(new Set(uids.filter(Boolean)));
  await Promise.all(
    unique.map(async (uid) => {
      if (cache.has(uid)) {
        result[uid] = cache.get(uid);
        return;
      }
      try {
        const snapshot = await get(dbRef(`/users/${uid}`));
        const value = snapshot.val();
        const name = value?.displayName || value?.username || 'Member';
        cache.set(uid, name);
        result[uid] = name;
      } catch (error) {
        console.warn('Failed to load user profile', uid, error);
        cache.set(uid, 'Member');
        result[uid] = 'Member';
      }
    })
  );
  return result;
}
