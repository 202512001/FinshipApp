importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDTo7AcBJ67EGu9cmyVFlZk3On-fz4hccY",
  authDomain: "communityvisit.firebaseapp.com",
  projectId: "communityvisit",
  storageBucket: "communityvisit.firebasestorage.app",
  messagingSenderId: "1006136553310",
  appId: "1:1006136553310:web:43c49ecbff74a3f13069cf",
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