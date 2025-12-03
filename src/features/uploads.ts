import { uploadImage } from '../data/storage.ts';
import { showToast } from '../ui/toast.ts';
import { isAllowedFile } from '../utils/validate.ts';
import { attachUpload } from './messages.ts';
import { getCurrentUser } from '../auth/session.ts';

const uploadQueue = [];
let activeUpload = null;

export function enqueueUpload(file, scope) {
  if (!isAllowedFile(file)) {
    showToast('Only images under the configured size are allowed');
    return;
  }
  uploadQueue.push({ file, scope });
  processQueue();
}

async function processQueue() {
  if (activeUpload || !uploadQueue.length) return;
  const job = uploadQueue.shift();
  activeUpload = job;
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('Authentication required');
    const path = buildPath(job.scope, user.uid, job.file.name);
    const toast = showToast('Uploading image…', { duration: null });
    const url = await uploadImage(path, job.file, (progress) => {
      if (toast) toast.textContent = `Uploading ${(progress * 100).toFixed(0)}%`;
    });
    toast.textContent = 'Upload complete';
    attachUpload({ url, alt: job.file.name });
    setTimeout(() => toast.remove(), 2000);
  } catch (error) {
    console.error(error);
    showToast('Upload failed');
  } finally {
    activeUpload = null;
    processQueue();
  }
}

function buildPath(scope, uid, filename) {
  const safeName = filename.replace(/[^a-zA-Z0-9\.\-_]/g, '_');
  if (scope.type === 'channel') {
    return `servers/${scope.serverId}/channels/${scope.id}/${Date.now()}_${safeName}`;
  }
  if (scope.type === 'dm') {
    return `users/${uid}/uploads/dms/${scope.id}/${Date.now()}_${safeName}`;
  }
  return `users/${uid}/uploads/groups/${scope.id}/${Date.now()}_${safeName}`;
}

export function isUploading() {
  return !!activeUpload;
}
