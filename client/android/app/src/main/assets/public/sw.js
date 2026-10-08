// Jeevan LifeOS Service Worker for Web Push and Smart Reminders

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {
    title: '🎯 Jeevan Ritual Reminder',
    body: 'Time for your scheduled routine.',
    icon: '/branding/jeevan-icon-192.png',
    badge: '/branding/jeevan-icon-192.png',
    data: { actionUrl: '/dailies' },
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: payload.body,
    icon: payload.icon || '/branding/jeevan-icon-192.png',
    badge: payload.badge || '/branding/jeevan-icon-192.png',
    data: payload.data || {},
    vibrate: [100, 50, 100],
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'snooze_10', title: 'Snooze 10m' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const data = event.notification.data || {};
  const actionUrl = data.actionUrl || '/dailies';

  if (action === 'snooze_10') {
    // Call snooze endpoint in background
    event.waitUntil(
      fetch('/api/v1/notifications/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occurrenceKey: data.occurrenceKey || `snooze_${Date.now()}`,
          snoozeMinutes: 10,
          title: event.notification.title,
          body: event.notification.body,
          actionUrl,
        }),
      }).catch((err) => console.warn('[SW] Snooze request failed:', err))
    );
    return;
  }

  // Focus existing open window or open new window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(actionUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(actionUrl);
      }
    })
  );
});
