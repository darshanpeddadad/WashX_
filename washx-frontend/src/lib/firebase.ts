import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let messaging: Messaging | null = null;

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null;
  try {
    messaging = getMessaging(app);
    return messaging;
  } catch {
    return null;
  }
}

/**
 * Request notification permission and get FCM token.
 * Returns null if not supported or permission denied.
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[FCM] Notification permission denied');
      return null;
    }

    const msg = getFirebaseMessaging();
    if (!msg) return null;

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('[FCM] VAPID key not configured');
      return null;
    }

    const token = await getToken(msg, {
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js'),
    });

    console.log('[FCM] Token:', token);
    return token;
  } catch (err) {
    console.error('[FCM] Error getting token:', err);
    return null;
  }
}

/**
 * Listen for foreground push messages and show them as toast.
 */
export function onForegroundMessage(callback: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void) {
  const msg = getFirebaseMessaging();
  if (!msg) return () => {};
  return onMessage(msg, callback);
}

export default app;
