import { updateData, setData } from '../data/db.ts';
import { getCurrentUser } from '../auth/session.ts';
import { showToast } from '../ui/toast.ts';

export async function sendFriendRequest(targetUid) {
  const user = getCurrentUser();
  if (!user) throw new Error('Authentication required');
  await updateData(`/users/${user.uid}/friends/${targetUid}`, {
    since: Date.now(),
    status: 'pending_out'
  });
  await updateData(`/users/${targetUid}/friends/${user.uid}`, {
    since: Date.now(),
    status: 'pending_in'
  });
  showToast('Friend request sent');
}

export async function acceptFriendRequest(targetUid) {
  const user = getCurrentUser();
  if (!user) throw new Error('Authentication required');
  await updateData(`/users/${user.uid}/friends/${targetUid}`, {
    since: Date.now(),
    status: 'accepted'
  });
  await updateData(`/users/${targetUid}/friends/${user.uid}`, {
    since: Date.now(),
    status: 'accepted'
  });
  showToast('Friend request accepted');
}

export async function declineFriendRequest(targetUid) {
  const user = getCurrentUser();
  if (!user) throw new Error('Authentication required');
  await setData(`/users/${user.uid}/friends/${targetUid}`, null);
  await setData(`/users/${targetUid}/friends/${user.uid}`, null);
  showToast('Friend request declined');
}
