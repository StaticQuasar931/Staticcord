import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v1/https';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.database();

interface ReportPayload {
  scopeType: 'channel' | 'dm' | 'group';
  scopeId: string;
  serverId?: string;
  messageId: string;
  reason: string;
  notes?: string;
}

export default async function reportRouter(data: ReportPayload, context: any) {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }
  if (!data.scopeType || !data.scopeId || !data.messageId) {
    throw new HttpsError('invalid-argument', 'Invalid report payload');
  }
  const reportRef = db.ref('/reports').push();
  await reportRef.set({
    messageRef: {
      type: data.scopeType,
      idPath: data.scopeId,
      serverId: data.serverId || null,
      messageId: data.messageId
    },
    reporterId: context.auth.uid,
    reason: data.reason || 'other',
    notes: data.notes || '',
    status: 'open',
    createdAt: admin.database.ServerValue.TIMESTAMP
  });
  await db.ref('/audit/logs').push({
    type: 'report_created',
    reportId: reportRef.key,
    createdAt: admin.database.ServerValue.TIMESTAMP,
    actor: context.auth.uid
  });
  return { success: true, id: reportRef.key };
}
