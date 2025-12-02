import { setData, updateData } from '../data/db.ts';
import { showToast } from '../ui/toast.ts';

export async function createRole(serverId, roleId, payload) {
  await setData(`/servers/${serverId}/roles/${roleId}`, payload);
  showToast('Role created');
}

export async function updateRole(serverId, roleId, payload) {
  await updateData(`/servers/${serverId}/roles/${roleId}`, payload);
  showToast('Role updated');
}

export async function assignRole(serverId, uid, roleId) {
  await updateData(`/servers/${serverId}/members/${uid}/roles/${roleId}`, true);
  showToast('Role assigned');
}
