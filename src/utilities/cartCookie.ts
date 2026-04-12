/**
 * Cookie utilities for SSR-friendly cart and delivery state.
 *
 * Cookies let the server render the correct initial state (no flash).
 * localStorage remains the full cache; cookies store only summaries.
 */

const CART_COOKIE = 'fleur-cart'
const DELIVERY_COOKIE = 'fleur-delivery'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

// ─── Cart cookie ─────────────────────────────────────────────────────────────

export type CartCookieData = [number, number][] // [[productId, qty], ...]

export function setCartCookie(items: Map<number, number>) {
  const entries = [...items.entries()].filter(([, qty]) => qty > 0)
  const value = encodeURIComponent(JSON.stringify(entries))
  document.cookie = `${CART_COOKIE}=${value}; path=/; max-age=${MAX_AGE}; SameSite=Lax`
}

export function clearCartCookie() {
  document.cookie = `${CART_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}

export function parseCartCookie(cookieValue: string | undefined | null): Map<number, number> {
  if (!cookieValue) return new Map()
  try {
    const decoded = decodeURIComponent(cookieValue)
    const entries: [number, number][] = JSON.parse(decoded)
    return new Map(entries.filter(([, qty]) => qty > 0))
  } catch {
    return new Map()
  }
}

/** Parse from raw cookie header string (server-side) */
export function getCartFromCookieHeader(cookieHeader: string): Map<number, number> {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${CART_COOKIE}=([^;]*)`))
  return parseCartCookie(match?.[1])
}

// ─── Delivery cookie ─────────────────────────────────────────────────────────

export type DeliveryCookieData = {
  address: string
  estimatedTime: string | null
  zoneType: string
  price3h: number
} | null

export function setDeliveryCookie(data: DeliveryCookieData) {
  if (!data) {
    document.cookie = `${DELIVERY_COOKIE}=; path=/; max-age=0; SameSite=Lax`
    return
  }
  const value = encodeURIComponent(JSON.stringify(data))
  document.cookie = `${DELIVERY_COOKIE}=${value}; path=/; max-age=${MAX_AGE}; SameSite=Lax`
}

export function parseDeliveryCookie(cookieValue: string | undefined | null): DeliveryCookieData {
  if (!cookieValue) return null
  try {
    return JSON.parse(decodeURIComponent(cookieValue))
  } catch {
    return null
  }
}

// ─── Cookie names (for server-side reading with next/headers cookies()) ──────

export const CART_COOKIE_NAME = CART_COOKIE
export const DELIVERY_COOKIE_NAME = DELIVERY_COOKIE
