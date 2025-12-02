import { updateData, setData } from '../data/db.ts';
import { getCurrentUser } from '../auth/session.ts';
import { showToast } from '../ui/toast.ts';

export async function blockUser(targetUid) {
  const user = getCurrentUser();
  if (!user) throw new Error('Authentication required');
  await updateData(`/users/${user.uid}/blocks/${targetUid}`, true);
  showToast('User blocked');
}

export async function unblockUser(targetUid) {
  const user = getCurrentUser();
  if (!user) throw new Error('Authentication required');
  await setData(`/users/${user.uid}/blocks/${targetUid}`, null);
  showToast('User unblocked');
}
