import config from '../config.ts';
import { showToast } from '../ui/toast.ts';

let messaging;

export async function initNotifications() {
  if (!config.FEATURES.fcm) return;
  try {
    const { getMessaging, getToken } = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-messaging.js');
    messaging = getMessaging();
    const token = await getToken(messaging, { vapidKey: 'YOUR_PUBLIC_VAPID_KEY' });
    if (token) {
      showToast('Desktop notifications enabled');
    }
  } catch (error) {
    console.warn('Notifications disabled', error);
  }
}

export function notifyNewMessage(title, body) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: 'https://cdn.jsdelivr.net/gh/StaticQuasar931/Images@main/icon.png' });
  }
}
