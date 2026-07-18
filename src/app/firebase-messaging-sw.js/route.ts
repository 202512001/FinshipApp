import { NextResponse } from 'next/server';

export async function GET() {
  const swContent = `
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}",
  authDomain: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}",
  projectId: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}",
  storageBucket: "${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}",
  messagingSenderId: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}",
  appId: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'New Alert';
  const body = payload.notification?.body || 'Someone is available!';
  self.registration.showNotification(title, {
    body,
    icon: '/assets/images/app_logo.png',
    badge: '/assets/images/app_logo.png',
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    tag: 'community-alert',
    renotify: true,
    requireInteraction: true,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('https://finship-app.vercel.app/member-home')
  );
});
`;

  return new NextResponse(swContent, {
    headers: {
      'Content-Type': 'application/javascript',
      'Content-Security-Policy': "script-src 'self' https://www.gstatic.com",
      'Service-Worker-Allowed': '/',
      'Cache-Control': 'no-cache',
    },
  });
}