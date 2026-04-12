'use client'

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { toast } from 'sonner'
import { setCartCookie, clearCartCookie } from '@/utilities/cartCookie'

// ─── localStorage persistence ────────────────────────────────────────────────

const STORAGE_KEY = 'fleur-cart-snapshot'

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

function writeSnapshot(map: Map<number, number>) {
  try {
    const entries = [...map.entries()].filter(([, qty]) => qty > 0)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {}
}

/** Write to both localStorage and cookie simultaneously */
function persistAll(map: Map<number, number>) {
  writeSnapshot(map)
  if (typeof document !== 'undefined') setCartCookie(map)
}

// ─── Types ───────────────────────────────────────────────────────────────────

type OptimisticCartContextType = {
  getQty: (productId: number) => number
  addToCart: (productId: number, variantId?: number) => void
  increment: (productId: number) => void
  decrement: (productId: number) => void
  removeFromCart: (productId: number) => void
  clearAllItems: () => void
  totalItems: number
  serverCart: any
}

const OptimisticCartContext = createContext<OptimisticCartContextType>({
  getQty: () => 0,
  addToCart: () => {},
  increment: () => {},
  decrement: () => {},
  removeFromCart: () => {},
  clearAllItems: () => {},
  totalItems: 0,
  serverCart: null,
})

export function useOptimisticCart() {
  return useContext(OptimisticCartContext)
}

// ─── Helper: update optimistic + persist to localStorage + cookie ────────────

function setOptimisticAndPersist(
  setter: React.Dispatch<React.SetStateAction<Map<number, number>>>,
  localCacheSetter: React.Dispatch<React.SetStateAction<Map<number, number>>>,
  updater: (prev: Map<number, number>) => Map<number, number>,
) {
  setter((prev) => {
    const next = updater(prev)
    localCacheSetter((lc) => {
      const merged = new Map(lc)
      for (const [pid, qty] of next) {
        if (qty > 0) merged.set(pid, qty)
        else merged.delete(pid)
      }
      persistAll(merged)
      return merged
    })
    return next
  })
}

// ─── Provider ────────────────────────────────────────────────────────────────

type ProviderProps = {
  children: React.ReactNode
  /** Initial cart from server cookie — enables flash-free SSR */
  initialCart?: [number, number][] | null
}

export function OptimisticCartProvider({ children, initialCart }: ProviderProps) {
  const { addItem, cart, incrementItem, decrementItem, removeItem, clearCart } = useCart()

  // Init: server cookie → localStorage → empty
  const [localCache, setLocalCache] = useState<Map<number, number>>(() => {
    if (initialCart && initialCart.length > 0) return new Map(initialCart)
    return readSnapshot()
  })
  const [optimistic, setOptimistic] = useState<Map<number, number>>(new Map())

  const pendingAdds = useRef<Set<number>>(new Set())
  const removeQueue = useRef<Set<number>>(new Set())

  const findCartItem = useCallback((productId: number) => {
    if (!cart?.items?.length) return null
    return cart.items.find((item: any) => {
      if (!item.product) return false
      const pid = typeof item.product === 'object' ? item.product.id : item.product
      return pid === productId
    }) ?? null
  }, [cart])

  const serverMap = useMemo(() => {
    const m = new Map<number, number>()
    if (!cart?.items?.length) return m
    for (const item of cart.items as any[]) {
      if (!item.product) continue
      const pid = typeof item.product === 'object' ? item.product.id : item.product
      m.set(pid as number, item.quantity || 0)
    }
    return m
  }, [cart])

  const getQty = useCallback((productId: number): number => {
    if (optimistic.has(productId)) return optimistic.get(productId)!
    if (serverMap.has(productId)) return serverMap.get(productId)!
    return localCache.get(productId) || 0
  }, [optimistic, serverMap, localCache])

  // Sync localStorage + cookie when server data arrives
  useEffect(() => {
    if (serverMap.size === 0) return
    setLocalCache((prev) => {
      const merged = new Map(prev)
      for (const [pid, qty] of serverMap) merged.set(pid, qty)
      for (const [pid, qty] of optimistic) {
        if (qty > 0) merged.set(pid, qty)
        else merged.delete(pid)
      }
      for (const [pid, qty] of merged) { if (qty <= 0) merged.delete(pid) }
      persistAll(merged)
      return merged
    })
  }, [serverMap]) // eslint-disable-line react-hooks/exhaustive-deps

  // Clear optimistic when server catches up
  useEffect(() => {
    if (optimistic.size === 0 && removeQueue.current.size === 0) return

    setOptimistic((prev) => {
      const next = new Map(prev)
      let changed = false
      for (const [pid, optQty] of prev) {
        const serverQty = serverMap.get(pid) ?? 0
        if (serverQty === optQty) { next.delete(pid); changed = true }
        if (optQty === 0 && !serverMap.has(pid)) { next.delete(pid); changed = true }
      }
      return changed ? next : prev
    })

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

  useEffect(() => {
    for (const pid of pendingAdds.current) {
      if (serverMap.has(pid)) pendingAdds.current.delete(pid)
    }
  }, [serverMap])

  // ── Actions ──

  const addToCart = useCallback((productId: number, variantId?: number) => {
    if (pendingAdds.current.has(productId)) return
    pendingAdds.current.add(productId)
    removeQueue.current.delete(productId)

    setOptimisticAndPersist(setOptimistic, setLocalCache, (prev) =>
      new Map(prev).set(productId, 1),
    )

    addItem({ product: productId, variant: variantId })
      .catch(() => {
        pendingAdds.current.delete(productId)
        setOptimisticAndPersist(setOptimistic, setLocalCache, (prev) => {
          const n = new Map(prev); n.delete(productId); return n
        })
        toast.error('Ошибка при добавлении')
      })
  }, [addItem])

  const increment = useCallback((productId: number) => {
    const currentQty = getQty(productId)
    setOptimisticAndPersist(setOptimistic, setLocalCache, (prev) =>
      new Map(prev).set(productId, currentQty + 1),
    )
    const item = findCartItem(productId)
    if (item?.id) {
      incrementItem(item.id).catch(() => {
        setOptimisticAndPersist(setOptimistic, setLocalCache, (prev) => {
          const n = new Map(prev); n.delete(productId); return n
        })
      })
    }
  }, [getQty, findCartItem, incrementItem])

  const decrement = useCallback((productId: number) => {
    const currentQty = getQty(productId)
    if (currentQty <= 1) {
      setOptimisticAndPersist(setOptimistic, setLocalCache, (prev) =>
        new Map(prev).set(productId, 0),
      )
      if (pendingAdds.current.has(productId)) {
        removeQueue.current.add(productId)
      } else {
        const item = findCartItem(productId)
        if (item?.id) removeItem(item.id).catch(() => {
          setOptimisticAndPersist(setOptimistic, setLocalCache, (prev) => {
            const n = new Map(prev); n.delete(productId); return n
          })
        })
      }
    } else {
      setOptimisticAndPersist(setOptimistic, setLocalCache, (prev) =>
        new Map(prev).set(productId, currentQty - 1),
      )
      const item = findCartItem(productId)
      if (item?.id) decrementItem(item.id).catch(() => {
        setOptimisticAndPersist(setOptimistic, setLocalCache, (prev) => {
          const n = new Map(prev); n.delete(productId); return n
        })
      })
    }
  }, [getQty, findCartItem, removeItem, decrementItem])

  const removeFromCart = useCallback((productId: number) => {
    setOptimisticAndPersist(setOptimistic, setLocalCache, (prev) =>
      new Map(prev).set(productId, 0),
    )
    if (pendingAdds.current.has(productId)) {
      removeQueue.current.add(productId)
    } else {
      const item = findCartItem(productId)
      if (item?.id) removeItem(item.id).catch(() => {})
    }
  }, [findCartItem, removeItem])

  const clearAllItems = useCallback(() => {
    setOptimistic(new Map())
    setLocalCache(new Map())
    persistAll(new Map())
    if (typeof document !== 'undefined') clearCartCookie()
    pendingAdds.current.clear()
    removeQueue.current.clear()
    clearCart().catch(() => {})
  }, [clearCart])

  const totalItems = useMemo(() => {
    const merged = new Map(localCache)
    for (const [pid, qty] of serverMap) merged.set(pid, qty)
    for (const [pid, qty] of optimistic) {
      if (qty > 0) merged.set(pid, qty)
      else merged.delete(pid)
    }
    let total = 0
    for (const qty of merged.values()) total += qty
    return total
  }, [localCache, serverMap, optimistic])

  const value = useMemo(() => ({
    getQty, addToCart, increment, decrement, removeFromCart, clearAllItems, totalItems, serverCart: cart,
  }), [getQty, addToCart, increment, decrement, removeFromCart, clearAllItems, totalItems, cart])

  return (
    <OptimisticCartContext.Provider value={value}>
      {children}
    </OptimisticCartContext.Provider>
  )
}
