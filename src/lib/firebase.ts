import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export async function getMessagingInstance() {
  try {
    const supported = await isSupported();
    if (!supported) return null;
    return getMessaging(app);
  } catch {
    return null;
  }
}
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    if (typeof window === 'undefined') return null;
    
    // Check if notifications are supported
    if (!('Notification' in window)) return null;
    if (!('serviceWorker' in navigator)) return null;

    // Request permission first
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    // Register service worker manually
    let swRegistration: ServiceWorkerRegistration;
    try {
      swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
      });
      await navigator.serviceWorker.ready;
    } catch (swErr) {
      return null;
    }

    // Now get messaging with the registration
    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    return token || null;
  } catch (err) {
    return null;
  }
}

export async function onForegroundMessage(callback: (payload: any) => void) {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return;
    onMessage(messaging, callback);
  } catch {
    // silently fail
  }
}