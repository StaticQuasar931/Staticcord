import { updateData, removeData } from '../data/db.ts';
import { getCurrentUser } from '../auth/session.ts';

export async function toggleReaction(path, emoji) {
  const user = getCurrentUser();
  if (!user) return;
  const userPath = `${path}/reactions/${emoji}/${user.uid}`;
  await updateData(userPath, true);
}

export async function removeReaction(path, emoji) {
  const user = getCurrentUser();
  if (!user) return;
  const userPath = `${path}/reactions/${emoji}/${user.uid}`;
  await removeData(userPath);
}
