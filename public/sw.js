/**
 * sw.js – Service Worker for Smart Grocery Assistant
 *
 * Handles:
 *   - install / activate lifecycle
 *   - push events (Web Push API)
 *   - notificationclick (open/focus app)
 *
 * Mobile migration note:
 *   In a Capacitor-based mobile app, this Service Worker is NOT used.
 *   Android push is handled by Firebase Cloud Messaging (FCM).
 *   iOS push is handled by Apple Push Notifications (APNs) via Capacitor.
 */

const SW_VERSION = 'smart-grocery-sw-v1'

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', () => {
  console.log(`[SW] Installing (${SW_VERSION})`)
  // Skip waiting so the new SW activates immediately
  self.skipWaiting()
})

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating (${SW_VERSION})`)
  // Claim all open clients so the SW controls them without reload
  event.waitUntil(self.clients.claim())
})

// ── Push ──────────────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  /** @type {{ title?: string; body?: string; icon?: string; url?: string }} */
  let payload = {
    title: '🛒 Smart Grocery',
    body: 'Du hast eine neue Benachrichtigung.',
    icon: '/favicon.ico',
    url: self.location.origin,
  }

  if (event.data) {
    try {
      // TODO (Backend): Push payload must be sent as JSON from your server
      // using the web-push library with the VAPID keys.
      Object.assign(payload, event.data.json())
    } catch {
      payload.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: '/favicon.ico',
      // Pass url to notificationclick handler
      data: { url: payload.url },
    })
  )
})

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || self.location.origin

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If the app is already open, focus it
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            return client.focus()
          }
        }
        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl)
        }
      })
  )
})
