import * as functions from 'firebase-functions';
import reportRouter from './reportRouter';
import validateUpload from './validateUpload';
import { cleanupTyping, cleanupInvites } from './cleanup';
import { auditSoftDelete, roleGuardCheck } from './adminTools';

export const submitReport = functions.region('us-central1').https.onCall(reportRouter);
export const validateImageUpload = functions.region('us-central1').https.onCall(validateUpload);
export const cleanupScheduler = functions.region('us-central1').pubsub.schedule('every 24 hours').onRun(async () => {
  await cleanupTyping();
  await cleanupInvites();
});
export const toggleSoftDeleteVisibility = functions.region('us-central1').https.onCall(auditSoftDelete);
export const roleGuard = functions.region('us-central1').https.onCall(roleGuardCheck);
