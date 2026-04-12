'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { setDeliveryCookie, type DeliveryCookieData } from '@/utilities/cartCookie'

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
  address: string
}

type DeliveryContextValue = {
  zone: DeliveryZoneSnapshot | null
  estimatedTime: string
  hasAddress: boolean
  setZone: (zone: DeliveryZoneSnapshot | null) => void
  markUnavailable: (address: string) => void
  unavailable: boolean
  clear: () => void
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const DEFAULT_DELIVERY_TIME = 'от 120 мин'
const STORAGE_KEY = 'fleur:delivery-zone'

// ─── Context ─────────────────────────────────────────────────────────────────

const DeliveryContext = createContext<DeliveryContextValue | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

type ProviderProps = {
  children: React.ReactNode
  /** Initial delivery data from server cookie — enables flash-free SSR */
  initialDelivery?: DeliveryCookieData
}

export const DeliveryProvider: React.FC<ProviderProps> = ({ children, initialDelivery }) => {
  // Init: server cookie → localStorage → null
  const [zone, setZoneState] = useState<DeliveryZoneSnapshot | null>(() => {
    // If server passed initial data, reconstruct zone from it
    if (initialDelivery) {
      return {
        id: 0,
        zoneType: initialDelivery.zoneType,
        price3h: initialDelivery.price3h,
        price1h: null,
        priceExact: null,
        availableIntervals: ['3h'] as DeliveryInterval[],
        freeFrom: null,
        estimatedTime: initialDelivery.estimatedTime,
        address: initialDelivery.address,
      }
    }
    // Fallback: localStorage
    if (typeof window === 'undefined') return null
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as { zone?: DeliveryZoneSnapshot }
      return parsed.zone ?? null
    } catch { return null }
  })

  const [unavailable, setUnavailable] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return false
      const parsed = JSON.parse(raw) as { unavailable?: boolean }
      return parsed.unavailable ?? false
    } catch { return false }
  })

  // Persist to localStorage + cookie whenever zone changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (zone || unavailable) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ zone, unavailable }))
      } else {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    } catch {}

    // Update cookie for SSR
    if (zone) {
      setDeliveryCookie({
        address: zone.address,
        estimatedTime: zone.estimatedTime,
        zoneType: zone.zoneType,
        price3h: zone.price3h,
      })
    } else {
      setDeliveryCookie(null)
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
