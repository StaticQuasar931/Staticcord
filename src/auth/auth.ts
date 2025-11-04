import config from '../config.ts';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getAnalytics, logEvent } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js';

let app;
let auth;
let analytics;

export function initFirebase() {
  if (app) return { app, auth, analytics };
  app = initializeApp(config.firebase);
  auth = getAuth(app);
  auth.useDeviceLanguage();
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics unavailable', error);
  }
  return { app, auth, analytics };
}

export function getFirebaseAuth() {
  if (!auth) initFirebase();
  return auth;
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(getFirebaseAuth(), provider);
  analytics && logEvent(analytics, 'login', { method: 'google' });
  return result.user;
}

export async function loginWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  analytics && logEvent(analytics, 'login', { method: 'password' });
  return result.user;
}

export async function registerWithEmail(email, password, displayName) {
  const result = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
  analytics && logEvent(analytics, 'sign_up', { method: 'password' });
  return result.user;
}

export function resetPassword(email) {
  return sendPasswordResetEmail(getFirebaseAuth(), email);
}

export function logout() {
  return signOut(getFirebaseAuth());
}
