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
    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.error('FCM: messaging not supported');
      return null;
    }

    const permission = await Notification.requestPermission();
    console.log('FCM: permission status:', permission);
    if (permission !== 'granted') return null;

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    console.log('FCM: token generated:', token ? 'YES' : 'NO - token is empty');
    return token || null;
  } catch (err) {
    console.error('FCM: token error:', err);
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