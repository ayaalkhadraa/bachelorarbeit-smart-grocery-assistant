import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { GroceryItem } from '@/stores/groceryStore'
import { getExpiryInfo, getProductExpiryDate } from '@/utils/expiryUtils'

const NOTIFICATION_CHANNEL_ID = 'expiry-reminders'
const NOTIFICATION_TITLE = 'Lebensmittel laufen bald ab'
const AUTO_REMINDER_STORAGE_KEY = 'smart-grocery-expiry-reminder-auto'
const AUTO_REMINDER_DELAY_MS = 30_000

export interface ExpiryReminderResult {
  count: number
  message: string
}

interface AutoReminderState {
  date: string
  signature: string
}

function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android'
}

export function getExpiringReminderItems(items: GroceryItem[]): GroceryItem[] {
  return items.filter((item) => {
    const expiryDate = getProductExpiryDate(item as unknown as Record<string, unknown>)

    if (!expiryDate) {
      return false
    }

    const expiryInfo = getExpiryInfo(expiryDate)
    return expiryInfo.status === 'today' || expiryInfo.status === 'soon'
  })
}

function buildReminderBody(items: GroceryItem[]): string {
  if (items.length === 0) {
    return 'Keine bald ablaufenden Produkte gefunden.'
  }

  const previewNames = items.slice(0, 3).map((item) => item.name)
  const extraCount = items.length - previewNames.length
  const previewText = previewNames.join(', ')

  if (items.length === 1) {
    return `${previewText} läuft bald ab.`
  }

  return extraCount > 0
    ? `${items.length} Produkte laufen bald ab: ${previewText} und ${extraCount} weitere.`
    : `${items.length} Produkte laufen bald ab: ${previewText}.`
}

function getTodayKey(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getReminderSignature(items: GroceryItem[]): string {
  return items
    .map((item) => `${item.id}:${getProductExpiryDate(item as unknown as Record<string, unknown>) ?? item.expiryDate}`)
    .sort()
    .join('|')
}

function readAutoReminderState(): AutoReminderState | null {
  try {
    const raw = localStorage.getItem(AUTO_REMINDER_STORAGE_KEY)

    if (!raw) {
      return null
    }

    return JSON.parse(raw) as AutoReminderState
  } catch {
    return null
  }
}

function writeAutoReminderState(signature: string): void {
  try {
    const state: AutoReminderState = {
      date: getTodayKey(),
      signature,
    }
    localStorage.setItem(AUTO_REMINDER_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage failures and fall back to scheduling.
  }
}

function hasAutoReminderAlreadyBeenScheduled(signature: string): boolean {
  const state = readAutoReminderState()
  return Boolean(state && state.date === getTodayKey() && state.signature === signature)
}

async function ensureNotificationChannel(): Promise<void> {
  await LocalNotifications.createChannel({
    id: NOTIFICATION_CHANNEL_ID,
    name: 'Ablauf-Erinnerungen',
    description: 'Lokale Erinnerungen an bald ablaufende Lebensmittel',
    importance: 5,
  })
}

export async function checkLocalNotificationPermission(): Promise<boolean> {
  if (!isAndroid()) {
    return false
  }

  const permission = await LocalNotifications.checkPermissions()
  return permission.display === 'granted'
}

export async function requestLocalNotificationPermission(): Promise<boolean> {
  if (!isAndroid()) {
    return false
  }

  const current = await LocalNotifications.checkPermissions()

  if (current.display === 'granted') {
    return true
  }

  const requested = await LocalNotifications.requestPermissions()
  return requested.display === 'granted'
}

export async function scheduleExpiryReminderNotification(
  items: GroceryItem[]
): Promise<ExpiryReminderResult> {
  if (!isAndroid()) {
    return {
      count: 0,
      message: 'Lokale Benachrichtigungen sind nur in der Android-App verfügbar.',
    }
  }

  const reminderItems = getExpiringReminderItems(items)

  if (reminderItems.length === 0) {
    return {
      count: 0,
      message: 'Keine bald ablaufenden Produkte vorhanden.',
    }
  }

  const hasPermission = await requestLocalNotificationPermission()

  if (!hasPermission) {
    return {
      count: reminderItems.length,
      message: 'Keine Berechtigung für lokale Benachrichtigungen erteilt.',
    }
  }

  await ensureNotificationChannel()

  const body = buildReminderBody(reminderItems)

  await LocalNotifications.schedule({
    notifications: [
      {
        id: Date.now() % 2147483647,
        title: NOTIFICATION_TITLE,
        body,
        channelId: NOTIFICATION_CHANNEL_ID,
        schedule: {
          at: new Date(Date.now() + 1000),
        },
        extra: {
          count: reminderItems.length,
          itemNames: reminderItems.slice(0, 5).map((item) => item.name),
        },
      },
    ],
  })

  return {
    count: reminderItems.length,
    message: `${reminderItems.length} Produkte für die Ablauf-Erinnerung geplant.`,
  }
}

export async function scheduleStartupExpiryReminderNotification(
  items: GroceryItem[]
): Promise<ExpiryReminderResult> {
  if (!isAndroid()) {
    return {
      count: 0,
      message: 'Lokale Benachrichtigungen sind nur in der Android-App verfügbar.',
    }
  }

  const reminderItems = getExpiringReminderItems(items)

  if (reminderItems.length === 0) {
    return {
      count: 0,
      message: 'Keine bald ablaufenden Produkte vorhanden.',
    }
  }

  const hasPermission = (await checkLocalNotificationPermission()) || (await requestLocalNotificationPermission())

  if (!hasPermission) {
    return {
      count: reminderItems.length,
      message: 'Keine Berechtigung für lokale Benachrichtigungen erteilt.',
    }
  }

  const signature = getReminderSignature(reminderItems)

  if (hasAutoReminderAlreadyBeenScheduled(signature)) {
    return {
      count: reminderItems.length,
      message: 'Ablauf-Erinnerung wurde für heute bereits geplant.',
    }
  }

  await ensureNotificationChannel()

  const body = buildReminderBody(reminderItems)
  const notificationId = Number.parseInt(
    `${getTodayKey().replace(/-/g, '')}${reminderItems.length}`,
    10
  ) || Date.now() % 2147483647

  await LocalNotifications.schedule({
    notifications: [
      {
        id: notificationId,
        title: NOTIFICATION_TITLE,
        body,
        channelId: NOTIFICATION_CHANNEL_ID,
        schedule: {
          at: new Date(Date.now() + AUTO_REMINDER_DELAY_MS),
        },
        extra: {
          count: reminderItems.length,
          itemNames: reminderItems.slice(0, 5).map((item) => item.name),
          autoScheduled: true,
        },
      },
    ],
  })

  writeAutoReminderState(signature)

  return {
    count: reminderItems.length,
    message: `${reminderItems.length} Produkte wurden für eine Ablauf-Erinnerung in 30 Sekunden geplant.`,
  }
}