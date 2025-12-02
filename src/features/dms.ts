import { updateData } from '../data/db.ts';
import { getCurrentUser } from '../auth/session.ts';

export function markDmRead(dmId) {
  const user = getCurrentUser();
  if (!user) return;
  updateData(`/dms/${dmId}/read/${user.uid}`, Date.now());
}

export function setDmPassword(dmId, hash) {
  return updateData(`/dms/${dmId}`, { optionalPasswordHash: hash });
}
