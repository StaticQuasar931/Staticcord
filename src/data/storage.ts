import config from '../config.ts';
import { getApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js';

let storage;

export function getBucket() {
  if (!storage) {
    storage = getStorage(getApp(), config.firebase.storageBucket);
  }
  return storage;
}

export function uploadImage(path, file, onProgress) {
  const ref = storageRef(getBucket(), path);
  const task = uploadBytesResumable(ref, file, {
    cacheControl: 'public,max-age=1209600',
    contentType: file.type
  });
  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        const progress = snapshot.totalBytes ? snapshot.bytesTransferred / snapshot.totalBytes : 0;
        onProgress?.(progress);
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}
