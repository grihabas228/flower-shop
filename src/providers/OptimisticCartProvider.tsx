'use client'

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { toast } from 'sonner'

// ─── localStorage persistence ────────────────────────────────────────────────

const STORAGE_KEY = 'fleur-cart-snapshot'

/** Read cart snapshot from localStorage synchronously (no async, no flash) */
function readSnapshot(): Map<number, number> {
  if (typeof window === 'undefined') return new Map()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Map()
    const entries: [number, number][] = JSON.parse(raw)
    return new Map(entries.filter(([, qty]) => qty > 0))
  } catch {
    return new Map()
  }
}

/** Write cart snapshot to localStorage */
function writeSnapshot(map: Map<number, number>) {
  try {
    const entries = [...map.entries()].filter(([, qty]) => qty > 0)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch { /* quota / privacy */ }
}

// ─── Types ───────────────────────────────────────────────────────────────────

type OptimisticCartContextType = {
  getQty: (productId: number) => number
  addToCart: (productId: number, variantId?: number) => void
  increment: (productId: number) => void
  decrement: (productId: number) => void
  totalItems: number
}

const OptimisticCartContext = createContext<OptimisticCartContextType>({
  getQty: () => 0,
  addToCart: () => {},
  increment: () => {},
  decrement: () => {},
  totalItems: 0,
})

export function useOptimisticCart() {
  return useContext(OptimisticCartContext)
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function OptimisticCartProvider({ children }: { children: React.ReactNode }) {
  const { addItem, cart, incrementItem, decrementItem, removeItem } = useCart()

  // localStorage snapshot — read SYNCHRONOUSLY on init → no flash
  const [localCache, setLocalCache] = useState<Map<number, number>>(() => readSnapshot())

  // Optimistic overrides: productId → qty (takes priority over everything)
  const [optimistic, setOptimistic] = useState<Map<number, number>>(new Map())

  // Track add-in-flight products
  const pendingAdds = useRef<Set<number>>(new Set())
  const removeQueue = useRef<Set<number>>(new Set())

  // ── Helpers ──

  const findCartItem = useCallback((productId: number) => {
    if (!cart?.items?.length) return null
    return cart.items.find((item) => {
      if (!item.product) return false
      const pid = typeof item.product === 'object' ? item.product.id : item.product
      return pid === productId
    }) ?? null
  }, [cart])

  // Server quantities as a map
  const serverMap = useMemo(() => {
    const m = new Map<number, number>()
    if (!cart?.items?.length) return m
    for (const item of cart.items) {
      if (!item.product) continue
      const pid = typeof item.product === 'object' ? item.product.id : item.product
      m.set(pid as number, item.quantity || 0)
    }
    return m
  }, [cart])

  // ── Get quantity: optimistic > server > localStorage cache ──

  const getQty = useCallback((productId: number): number => {
    if (optimistic.has(productId)) return optimistic.get(productId)!
    if (serverMap.has(productId)) return serverMap.get(productId)!
    return localCache.get(productId) || 0
  }, [optimistic, serverMap, localCache])

  // ── Persist merged view to localStorage ──

  useEffect(() => {
    const merged = new Map(localCache)
    // Layer server data
    for (const [pid, qty] of serverMap) {
      merged.set(pid, qty)
    }
    // Layer optimistic on top
    for (const [pid, qty] of optimistic) {
      if (qty > 0) merged.set(pid, qty)
      else merged.delete(pid)
    }
    // Clean zeros
    for (const [pid, qty] of merged) {
      if (qty <= 0) merged.delete(pid)
    }
    setLocalCache(merged)
    writeSnapshot(merged)
  }, [serverMap, optimistic]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync: clear optimistic when server catches up ──

  useEffect(() => {
    if (optimistic.size === 0 && removeQueue.current.size === 0) return

    setOptimistic((prev) => {
      const next = new Map(prev)
      let changed = false
      for (const [pid, optQty] of prev) {
        const serverQty = serverMap.get(pid) ?? 0
        if (serverQty === optQty) {
          next.delete(pid)
          changed = true
        }
        if (optQty === 0 && !serverMap.has(pid)) {
          next.delete(pid)
          changed = true
        }
      }
      return changed ? next : prev
    })

    // Process remove queue
    for (const pid of removeQueue.current) {
      if (!pendingAdds.current.has(pid)) {
        const item = findCartItem(pid)
        if (item?.id) {
          removeQueue.current.delete(pid)
          removeItem(item.id).catch(() => {})
        } else if (!serverMap.has(pid)) {
          removeQueue.current.delete(pid)
        }
      }
    }
  }, [serverMap, optimistic, findCartItem, removeItem])

  // Clear pendingAdds when item appears in server cart
  useEffect(() => {
    for (const pid of pendingAdds.current) {
      if (serverMap.has(pid)) {
        pendingAdds.current.delete(pid)
      }
    }
  }, [serverMap])

  // ── Actions: instant UI, server in background ──

  const addToCart = useCallback((productId: number, variantId?: number) => {
    if (pendingAdds.current.has(productId)) return
    pendingAdds.current.add(productId)
    removeQueue.current.delete(productId)

    setOptimistic((prev) => new Map(prev).set(productId, 1))

    addItem({ product: productId, variant: variantId })
      .catch(() => {
        pendingAdds.current.delete(productId)
        setOptimistic((prev) => { const n = new Map(prev); n.delete(productId); return n })
        toast.error('Ошибка при добавлении')
      })
  }, [addItem])

  const increment = useCallback((productId: number) => {
    const currentQty = getQty(productId)
    setOptimistic((prev) => new Map(prev).set(productId, currentQty + 1))

    const item = findCartItem(productId)
    if (item?.id) {
      incrementItem(item.id).catch(() => {
        setOptimistic((prev) => { const n = new Map(prev); n.delete(productId); return n })
      })
    }
  }, [getQty, findCartItem, incrementItem])

  const decrement = useCallback((productId: number) => {
    const currentQty = getQty(productId)

    if (currentQty <= 1) {
      setOptimistic((prev) => new Map(prev).set(productId, 0))

      if (pendingAdds.current.has(productId)) {
        removeQueue.current.add(productId)
      } else {
        const item = findCartItem(productId)
        if (item?.id) {
          removeItem(item.id).catch(() => {
            setOptimistic((prev) => { const n = new Map(prev); n.delete(productId); return n })
          })
        }
      }
    } else {
      setOptimistic((prev) => new Map(prev).set(productId, currentQty - 1))

      const item = findCartItem(productId)
      if (item?.id) {
        decrementItem(item.id).catch(() => {
          setOptimistic((prev) => { const n = new Map(prev); n.delete(productId); return n })
        })
      }
    }
  }, [getQty, findCartItem, removeItem, decrementItem])

  // ── Total items: instant from merged data ──

  const totalItems = useMemo(() => {
    // Build complete view: localCache as base, server, then optimistic
    const merged = new Map(localCache)
    for (const [pid, qty] of serverMap) {
      merged.set(pid, qty)
    }
    for (const [pid, qty] of optimistic) {
      if (qty > 0) merged.set(pid, qty)
      else merged.delete(pid)
    }

    let total = 0
    for (const qty of merged.values()) {
      total += qty
    }
    return total
  }, [localCache, serverMap, optimistic])

  const value = useMemo(() => ({
    getQty, addToCart, increment, decrement, totalItems,
  }), [getQty, addToCart, increment, decrement, totalItems])

  return (
    <OptimisticCartContext.Provider value={value}>
      {children}
    </OptimisticCartContext.Provider>
  )
}
