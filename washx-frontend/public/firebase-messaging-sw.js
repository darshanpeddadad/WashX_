// Firebase Cloud Messaging Service Worker for WashX
// This file MUST be at the root of the public folder: /firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase config — injected at runtime via next.config.ts or hardcoded here for the SW
firebase.initializeApp({
  apiKey: self.__FIREBASE_API_KEY__ || 'REPLACE_WITH_API_KEY',
  authDomain: self.__FIREBASE_AUTH_DOMAIN__ || 'REPLACE_WITH_AUTH_DOMAIN',
  projectId: self.__FIREBASE_PROJECT_ID__ || 'REPLACE_WITH_PROJECT_ID',
  storageBucket: self.__FIREBASE_STORAGE_BUCKET__ || 'REPLACE_WITH_STORAGE_BUCKET',
  messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID__ || 'REPLACE_WITH_SENDER_ID',
  appId: self.__FIREBASE_APP_ID__ || 'REPLACE_WITH_APP_ID',
});

const messaging = firebase.messaging();

// Handle background push messages
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Received background message:', payload);

  const { title = 'WashX Update 🧺', body = 'Your order status has changed!' } = payload.notification || {};
  const icon = '/icons/icon-192.png';
  const badge = '/icons/badge-72.png';
  const data = payload.data || {};

  self.registration.showNotification(title, {
    body,
    icon,
    badge,
    tag: `washx-order-${data.orderId || 'update'}`,
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: data.orderId ? `/orders/${data.orderId}` : '/dashboard' },
    actions: [
      { action: 'view', title: '👁️ View Order' },
      { action: 'dismiss', title: '✕ Dismiss' },
    ],
  });
});

// Handle notification click — open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// PWA install prompt
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));
