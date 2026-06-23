/**
 * expiryUtils.ts
 *
 * Zentrale Ablaufdatum-Logik für FreshFlow.
 * Alle Komponenten und Services verwenden ausschließlich `getExpiryInfo()`.
 *
 * Regeln:
 *  days < 0       → 'expired'  – Abgelaufen (Datum liegt in der Vergangenheit)
 *  days = 0       → 'today'    – Läuft heute ab
 *  days 1–3       → 'soon'     – Läuft bald ab (konfigurierbar via warningDays)
 *  days > 3       → 'fresh'    – Frisch
 *  kein Datum     → 'unknown'  – Kein Ablaufdatum
 */

export type ExpiryStatus = 'expired' | 'today' | 'soon' | 'fresh' | 'unknown'

export interface ExpiryInfo {
  /** Calendar days until expiry. Negative = already expired. null = no date set. */
  days: number | null
  /** Semantic status category based on the FreshFlow rules. */
  status: ExpiryStatus
  /** German display label for use in PrimeVue Tag / UI. */
  label: string
  /** PrimeVue Tag severity string. */
  severity: 'danger' | 'warn' | 'success' | 'secondary'
  /** Ready-made notification body text for a given product name. */
  notificationBody: (name: string) => string
}

/** Products expiring within this many days (inclusive) are classified as 'soon'. */
export const EXPIRY_WARNING_DAYS = 3

/**
 * Safely parses a YYYY-MM-DD date string using local time, avoiding the UTC
 * midnight shift that `new Date('YYYY-MM-DD')` causes in negative-offset timezones.
 */
export function parseDateOnly(isoDate: string): Date {
  const parts = isoDate.split('-')
  const year = parseInt(parts[0] ?? '0', 10)
  const month = parseInt(parts[1] ?? '1', 10) - 1 // months are 0-based
  const day = parseInt(parts[2] ?? '1', 10)
  const d = new Date(year, month, day)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Returns the number of whole calendar days between today and the given ISO date.
 * Negative values mean the date is in the past.
 */
export function getDaysUntilExpiry(isoDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = parseDateOnly(isoDate)
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/** Returns true if the product has already expired (days < 0). */
export function isExpired(isoDate: string): boolean {
  return getDaysUntilExpiry(isoDate) < 0
}

/** Returns true if the product expires today (days === 0). */
export function isExpiringToday(isoDate: string): boolean {
  return getDaysUntilExpiry(isoDate) === 0
}

/** Returns true if the product expires between 1 and warningDays days from now. */
export function isExpiringSoon(isoDate: string, warningDays = EXPIRY_WARNING_DAYS): boolean {
  const days = getDaysUntilExpiry(isoDate)
  return days >= 1 && days <= warningDays
}

/** Returns true if the product expires more than warningDays days from now. */
export function isFresh(isoDate: string, warningDays = EXPIRY_WARNING_DAYS): boolean {
  return getDaysUntilExpiry(isoDate) > warningDays
}

/**
 * Resolves the expiry date string from a product object, checking multiple
 * possible field names used across different product schemas:
 *   - expiryDate     (FreshFlow GroceryItem)
 *   - expirationDate (alternative naming)
 *   - bestBeforeDate (best-before labelling)
 */
export function getProductExpiryDate(product: Record<string, unknown>): string | undefined {
  const value =
    (product['expiryDate'] as string | undefined) ??
    (product['expirationDate'] as string | undefined) ??
    (product['bestBeforeDate'] as string | undefined)
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

/**
 * Returns full expiry information for a given ISO date string (YYYY-MM-DD).
 * Pass null / undefined / empty string to receive the 'unknown' result.
 * Products without a date are NOT treated as fresh – they are 'unknown'.
 */
export function getExpiryInfo(
  isoDate: string | undefined | null,
  warningDays = EXPIRY_WARNING_DAYS
): ExpiryInfo {
  if (!isoDate || isoDate.trim() === '') {
    return {
      days: null,
      status: 'unknown',
      label: 'Kein Ablaufdatum',
      severity: 'secondary',
      notificationBody: (name) => `${name} hat kein Ablaufdatum.`,
    }
  }

  const days = getDaysUntilExpiry(isoDate)

  if (days < 0) {
    return {
      days,
      status: 'expired',
      label: 'Abgelaufen',
      severity: 'danger',
      notificationBody: (name) => `${name} ist abgelaufen.`,
    }
  }

  if (days === 0) {
    return {
      days,
      status: 'today',
      label: 'Läuft heute ab',
      severity: 'danger',
      notificationBody: (name) => `${name} läuft heute ab.`,
    }
  }

  if (days <= warningDays) {
    return {
      days,
      status: 'soon',
      label: 'Läuft bald ab',
      severity: 'warn',
      notificationBody: (name) =>
        days === 1 ? `${name} läuft morgen ab.` : `${name} läuft in ${days} Tagen ab.`,
    }
  }

  return {
    days,
    status: 'fresh',
    label: 'Frisch',
    severity: 'success',
    notificationBody: (name) => `${name} ist noch frisch (${days} Tage).`,
  }
}
