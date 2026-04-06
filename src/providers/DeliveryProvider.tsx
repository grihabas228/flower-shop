'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

export type DeliveryInterval = '3h' | '1h' | 'exact'

export type DeliveryZoneSnapshot = {
  id: number
  zoneType: string
  price3h: number
  price1h: number | null
  priceExact: number | null
  availableIntervals: DeliveryInterval[]
  freeFrom: number | null
  estimatedTime: string | null
  /** Original address string the user picked (for display / re-population). */
  address: string
}

type DeliveryContextValue = {
  /** Current detected zone, or null if no address has been selected. */
  zone: DeliveryZoneSnapshot | null
  /** Estimated delivery time string for the detected zone, or default fallback. */
  estimatedTime: string
  /** Whether an address has been selected (zone may still be null if unavailable). */
  hasAddress: boolean
  /** Set the detected zone (called from HeroSection / CheckoutPage). */
  setZone: (zone: DeliveryZoneSnapshot | null) => void
  /** Mark the address as unavailable (selected but no zone matches). */
  markUnavailable: (address: string) => void
  /** Whether the last address was unavailable. */
  unavailable: boolean
  /** Clear all delivery state. */
  clear: () => void
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const DEFAULT_DELIVERY_TIME = 'от 120 мин'
const STORAGE_KEY = 'fleur:delivery-zone'

// ─── Context ─────────────────────────────────────────────────────────────────

const DeliveryContext = createContext<DeliveryContextValue | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

export const DeliveryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [zone, setZoneState] = useState<DeliveryZoneSnapshot | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as { zone?: DeliveryZoneSnapshot; unavailable?: boolean }
      if (parsed.zone) setZoneState(parsed.zone)
      if (parsed.unavailable) setUnavailable(true)
    } catch {
      // ignore corrupted storage
    }
  }, [])

  // Persist to localStorage whenever zone changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (zone || unavailable) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ zone, unavailable }))
      } else {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // ignore quota / privacy mode errors
    }
  }, [zone, unavailable])

  const setZone = useCallback((next: DeliveryZoneSnapshot | null) => {
    setZoneState(next)
    if (next) setUnavailable(false)
  }, [])

  const markUnavailable = useCallback((_address: string) => {
    setZoneState(null)
    setUnavailable(true)
  }, [])

  const clear = useCallback(() => {
    setZoneState(null)
    setUnavailable(false)
  }, [])

  const value = useMemo<DeliveryContextValue>(
    () => ({
      zone,
      estimatedTime: zone?.estimatedTime ?? DEFAULT_DELIVERY_TIME,
      hasAddress: !!zone || unavailable,
      setZone,
      markUnavailable,
      unavailable,
      clear,
    }),
    [zone, unavailable, setZone, markUnavailable, clear],
  )

  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useDelivery(): DeliveryContextValue {
  const ctx = useContext(DeliveryContext)
  if (!ctx) {
    // Safe fallback when used outside provider — return neutral defaults so
    // components don't crash if they're rendered in isolation (e.g. tests).
    return {
      zone: null,
      estimatedTime: DEFAULT_DELIVERY_TIME,
      hasAddress: false,
      setZone: () => {},
      markUnavailable: () => {},
      unavailable: false,
      clear: () => {},
    }
  }
  return ctx
}
