importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "PASTE_YOUR_apiKey_HERE",
  authDomain: "PASTE_YOUR_authDomain_HERE",
  projectId: "PASTE_YOUR_projectId_HERE",
  storageBucket: "PASTE_YOUR_storageBucket_HERE",
  messagingSenderId: "PASTE_YOUR_messagingSenderId_HERE",
  appId: "PASTE_YOUR_appId_HERE",
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
    clients.openWindow('/')
  );
});