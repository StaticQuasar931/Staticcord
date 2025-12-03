import { updateData } from '../data/db.ts';

export function markGroupRead(groupId, uid) {
  updateData(`/groupDms/${groupId}/read/${uid}`, Date.now());
}

export function setGroupPassword(groupId, hash) {
  return updateData(`/groupDms/${groupId}`, { optionalPasswordHash: hash });
}
