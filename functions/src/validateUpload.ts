import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v1/https';

if (!admin.apps.length) {
  admin.initializeApp();
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_BYTES = 10 * 1024 * 1024;

type UploadPayload = {
  path: string;
  size: number;
  contentType: string;
};

export default function validateUpload(data: UploadPayload, context: any) {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }
  if (!ALLOWED_TYPES.includes(data.contentType)) {
    throw new HttpsError('invalid-argument', 'File type not allowed');
  }
  if (data.size > MAX_BYTES) {
    throw new HttpsError('invalid-argument', 'File too large');
  }
  if (!data.path.startsWith(`users/${context.auth.uid}/uploads`) && !data.path.startsWith('servers/')) {
    throw new HttpsError('permission-denied', 'Invalid storage path');
  }
  return { ok: true };
}
