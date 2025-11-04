import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v1/https';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.database();

export async function roleGuardCheck(data: any, context: any) {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }
  const { serverId, permission } = data;
  const memberSnap = await db.ref(`/servers/${serverId}/members/${context.auth.uid}/perms/${permission}`).get();
  return { allowed: memberSnap.val() === true };
}

export async function auditSoftDelete(data: any, context: any) {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }
  const { serverId, visible } = data;
  const hasAudit = await db.ref(`/servers/${serverId}/members/${context.auth.uid}/perms/viewAudit`).get();
  if (hasAudit.val() !== true) {
    throw new HttpsError('permission-denied', 'Audit permission required');
  }
  await db.ref(`/servers/${serverId}/settings/softDeleteVisible`).set(visible === true);
  return { success: true };
}
