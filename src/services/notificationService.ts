/**
 * notificationService.ts
 *
 * Push Notification service for Smart Grocery Assistant – Web variant.
 *
 * ── Architecture ───────────────────────────────────────────────────────────────
 * This file implements the WEB variant using:
 *   - Browser Notification API
 *   - Service Worker API  (public/sw.js)
 *   - Web Push API        (PushManager + VAPID)
 *
 * The INotificationProvider interface is defined here so that a future
 * MobileNotificationProvider can implement the same contract without
 * changing any call-sites in the UI.
 *
 * ── Mobile Migration (future – not implemented yet) ────────────────────────────
 * To support a Capacitor-based mobile app:
 *   1. Create src/services/mobileNotificationProvider.ts
 *   2. Implement INotificationProvider using @capacitor/push-notifications
 *   3. Android: route through Firebase Cloud Messaging (FCM)
 *      - Package: @capacitor-firebase/messaging
 *      - Server sends via FCM HTTP v1 API
 *   4. iOS: route through Apple Push Notifications (APNs)
 *      - Package: @capacitor/push-notifications
 *      - Requires Apple Developer account + certificate
 *   5. Select provider at runtime:
 *      import { Capacitor } from '@capacitor/core'
 *      const provider = Capacitor.isNativePlatform()
 *        ? new MobileNotificationProvider()
 *        : new WebNotificationProvider()
 */

// ── VAPID Public Key ──────────────────────────────────────────────────────────
// TODO (Backend): Replace this with a real VAPID public key.
// Generate a key pair with: npx web-push generate-vapid-keys
// The private key stays on the server; only the public key goes here.
const VAPID_PUBLIC_KEY =
  'BEl62iUYgUivxIkv69yViEuiBIa40HI80NMzQFQbevANEDCYCbVVw1w5pUg5sdkXFl0xKCnCFZBNgkLKp-OQMY'

import { getExpiryInfo, getProductExpiryDate } from '@/utils/expiryUtils'

// ── INotificationProvider ─────────────────────────────────────────────────────
/**
 * Common interface shared by the Web and future Mobile implementations.
 * Never import platform-specific APIs at the top level of implementors –
 * guard them inside the methods so bundlers can tree-shake them.
 */
export interface INotificationProvider {
  /** Register the underlying push channel (SW registration or FCM token). */
  register(): Promise<void>
  /** Ask the user for notification permission. */
  requestPermission(): Promise<NotificationPermission>
  /** Subscribe to push messages and return the subscription object. */
  subscribe(): Promise<PushSubscription | null>
  /** Fire a local test notification without a server round-trip. */
  sendTestNotification(): void
}

// ── Internal state ────────────────────────────────────────────────────────────
let _swRegistration: ServiceWorkerRegistration | null = null

// ── urlBase64ToUint8Array ─────────────────────────────────────────────────────
/**
 * Converts a base64url-encoded VAPID public key to a Uint8Array
 * as required by PushManager.subscribe().
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const outputArray = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// ── registerServiceWorker ─────────────────────────────────────────────────────
/**
 * Registers public/sw.js as a Service Worker.
 * Must be called before subscribeToPush().
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker wird von diesem Browser nicht unterstützt.')
  }

  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  _swRegistration = registration
  console.log('[Notifications] Service Worker registriert:', registration.scope)
  return registration
}

// ── requestNotificationPermission ────────────────────────────────────────────
/**
 * Requests browser notification permission from the user.
 * Returns the resulting permission state: 'granted' | 'denied' | 'default'.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Dieser Browser unterstützt keine Push-Benachrichtigungen.')
  }

  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'

  return Notification.requestPermission()
}

// ── subscribeToPush ───────────────────────────────────────────────────────────
/**
 * Subscribes the browser to Web Push via the registered Service Worker.
 *
 * After a successful subscription the endpoint + keys should be sent to
 * your backend so it can later push messages via the web-push library.
 *
 * TODO (Backend): Implement POST /api/push/subscribe
 *   - Accept: { endpoint, keys: { p256dh, auth } }
 *   - Store in DB linked to the user
 *   - Use the `web-push` npm package on the server to send messages
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!_swRegistration) {
    throw new Error('Service Worker ist nicht registriert. Bitte zuerst registerServiceWorker() aufrufen.')
  }

  if (!('PushManager' in window)) {
    throw new Error('Push API wird von diesem Browser nicht unterstützt.')
  }

  // Re-use an existing subscription if present
  const existing = await _swRegistration.pushManager.getSubscription()
  if (existing) {
    console.log('[Notifications] Vorhandene Subscription wiederverwendet:', existing.endpoint)
    return existing
  }

  const subscription = await _swRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  })

  console.log('[Notifications] Push Subscription erstellt:', subscription.endpoint)

  // TODO (Backend): uncomment once /api/push/subscribe is implemented
  // try {
  //   await fetch('/api/push/subscribe', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(subscription),
  //   })
  // } catch (err) {
  //   console.error('[Notifications] Subscription konnte nicht an Server gesendet werden:', err)
  // }

  return subscription
}

// ── enableTestNotification ────────────────────────────────────────────────────
/**
 * Shows a local test notification without any server round-trip.
 * Useful for verifying that the Notification API + Service Worker work.
 */
export function enableTestNotification(): void {
  if (!('Notification' in window)) {
    console.warn('[Notifications] Notification API nicht verfügbar.')
    return
  }

  if (Notification.permission !== 'granted') {
    console.warn('[Notifications] Berechtigung nicht erteilt – Test abgebrochen.')
    return
  }

  const options: NotificationOptions = {
    body: 'Benachrichtigungen funktionieren korrekt! 🎉',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
  }

  // Prefer Service Worker notification (required on mobile/Chrome for reliability)
  if (_swRegistration) {
    _swRegistration.showNotification('🛒 Smart Grocery – Test', options)
  } else {
    new Notification('🛒 Smart Grocery – Test', options)
  }
}

// ── ExpiringProduct ───────────────────────────────────────────────────────────
/**
 * Minimal product shape required by the notification functions.
 * GroceryItem from groceryStore satisfies this interface.
 */
export interface ExpiringProduct {
  id: number
  name: string
  expiryDate: string
}

// ── scheduleMobileExpiryNotification (Capacitor – future) ─────────────────────
/**
 * Public alias for enableTestNotification().
 * Shows a local test notification without any server round-trip.
 */
export function showTestNotification(): void {
  enableTestNotification()
}

// ── notifyExpiringProduct ─────────────────────────────────────────────────────
/**
 * Fires a local browser notification for a single expiring product.
 * Uses getExpiryInfo() from expiryUtils for consistent labelling.
 *
 * Web: uses the registered Service Worker notification if available,
 *      falls back to the plain Notification API.
 *
 * MOBILE (future): see scheduleMobileExpiryNotification() comment below.
 */
export function notifyExpiringProduct(product: ExpiringProduct): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const info = getExpiryInfo(product.expiryDate)
  const body = info.notificationBody(product.name)

  console.log('[notificationService] Sende Notification für:', product.name, product.expiryDate)

  const options: NotificationOptions = {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: `freshflow-expiry-${product.id}-${Date.now()}`,
  }

  if (_swRegistration) {
    _swRegistration.showNotification('🥦 FreshFlow – Haltbarkeit', options)
  } else {
    new Notification('🥦 FreshFlow – Haltbarkeit', options)
  }
}

// ── ExpiryCheckResult ────────────────────────────────────────────────────────
/**
 * Returned by checkExpiringProducts() so the UI can display
 * "bereits abgelaufen" and "bald ablaufend" in separate groups.
 */
export interface ExpiryCheckResult {
  /** Products where expiryDate is today or in the future, within the warning window (0 <= days <= EXPIRY_WARNING_DAYS). */
  soonExpiring: ExpiringProduct[]
  /** Products where expiryDate is already in the past (days < 0). */
  alreadyExpired: ExpiringProduct[]
}

// ── checkExpiringProducts ─────────────────────────────────────────────────────
/**
 * Iterates the given product list and fires a browser notification for every
 * item classified as 'expired', 'today', or 'soon' by getExpiryInfo().
 *
 * Rules (from expiryUtils):
 *   days < 0               → alreadyExpired
 *   days = 0 or 1–3        → soonExpiring
 *   days > EXPIRY_WARNING_DAYS → ignored (fresh)
 *
 * Returns the two groups separately so the UI can render them distinctly.
 */
export function checkExpiringProducts(products: ExpiringProduct[]): ExpiryCheckResult {
  const result: ExpiryCheckResult = { soonExpiring: [], alreadyExpired: [] }

  if (!('Notification' in window) || Notification.permission !== 'granted') return result

  for (const product of products) {
    if (!product.expiryDate) continue
    const { status } = getExpiryInfo(product.expiryDate)
    if (status === 'today' || status === 'soon') {
      // Only 'today' and 'soon' products receive browser notifications.
      notifyExpiringProduct(product)
      result.soonExpiring.push(product)
    } else if (status === 'expired') {
      // Expired products are tracked for UI display but do NOT trigger a notification.
      result.alreadyExpired.push(product)
    }
  }
  return result
}

// ── notifyExpiringProducts ───────────────────────────────────────────────────
/**
 * Sends browser notifications for products expiring today or soon.
 * Uses getProductExpiryDate() for flexible field name resolution and
 * getExpiryInfo() from expiryUtils for consistent status classification.
 *
 * Rules:
 *   status === 'today' || 'soon'  → notification sent, added to soonExpiring
 *   status === 'expired'          → tracked in alreadyExpired, NO notification
 *   status === 'fresh' | 'unknown' → ignored
 */
export function notifyExpiringProducts(products: ExpiringProduct[]): ExpiryCheckResult {
  const result: ExpiryCheckResult = { soonExpiring: [], alreadyExpired: [] }

  if (!('Notification' in window) || Notification.permission !== 'granted') return result

  for (const product of products) {
    const dateStr =
      getProductExpiryDate(product as unknown as Record<string, unknown>) ?? product.expiryDate
    if (!dateStr) continue
    const { status } = getExpiryInfo(dateStr)
    if (status === 'today' || status === 'soon') {
      notifyExpiringProduct({ id: product.id, name: product.name, expiryDate: dateStr })
      result.soonExpiring.push(product)
    } else if (status === 'expired') {
      result.alreadyExpired.push(product)
    }
  }

  return result
}

// ── scheduleMobileExpiryNotification (Capacitor – future) ─────────────────────
/**
 * TODO (Mobile): Schedule a timed local notification via Capacitor.
 *
 * Install:  npm install @capacitor/local-notifications
 * Sync:     npx cap sync
 *
 * import { LocalNotifications } from '@capacitor/local-notifications'
 *
 * export async function scheduleMobileExpiryNotification(
 *   product: ExpiringProduct
 * ): Promise<void> {
 *   const { days } = getExpiryInfo(product.expiryDate)
 *   const scheduleAt = new Date()
 *   scheduleAt.setDate(scheduleAt.getDate() + Math.max(0, days - 1))
 *   scheduleAt.setHours(8, 0, 0, 0) // 08:00 Uhr am Vortag des Ablaufs
 *
 *   await LocalNotifications.schedule({
 *     notifications: [{
 *       id: product.id,
 *       title: '🥦 FreshFlow – Haltbarkeit',
 *       body: days <= 1
 *         ? `${product.name} läuft heute ab!`
 *         : `${product.name} läuft morgen ab.`,
 *       schedule: { at: scheduleAt },
 *       smallIcon: 'ic_notification',
 *     }],
 *   })
 * }
 *
 * Remote Push Ausblick:
 *   - Firebase Cloud Messaging (FCM) via @capacitor-firebase/messaging
 *   - Server sendet Push-Payloads per web-push npm-Paket (Node.js Backend)
 *   - iOS: Apple Push Notifications (APNs) via @capacitor/push-notifications
 *   - Subscription-Endpoint wird per POST /api/push/subscribe registriert
 */

// ── WebNotificationProvider ───────────────────────────────────────────────────
/**
 * Web implementation of INotificationProvider.
 *
 * Uses: Service Worker + Browser Notification API + Web Push API (VAPID).
 *
 * MOBILE (future):
 *   Do NOT add Capacitor/FCM imports here.
 *   Create a separate MobileNotificationProvider in:
 *   src/services/mobileNotificationProvider.ts
 *
 *   Android → Firebase Cloud Messaging via @capacitor-firebase/messaging
 *   iOS     → Apple Push Notifications via @capacitor/push-notifications
 */
export class WebNotificationProvider implements INotificationProvider {
  async register(): Promise<void> {
    await registerServiceWorker()
  }

  async requestPermission(): Promise<NotificationPermission> {
    return requestNotificationPermission()
  }

  async subscribe(): Promise<PushSubscription | null> {
    return subscribeToPush()
  }

  sendTestNotification(): void {
    enableTestNotification()
  }
}
