'use client'

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { toast } from 'sonner'
import { setCartCookie, clearCartCookie } from '@/utilities/cartCookie'

// ─── Types ───────────────────────────────────────────────────────────────────

/** Product details stored in localStorage for CartPage rendering */
export type CartItemDetail = {
  productId: number
  title: string
  slug: string
  price: number
  image: string | null
  imageAlt: string | null
  variantId?: number
  variantLabel?: string
}

/** Full cart item = detail + optimistic quantity */
export type CartItemFull = CartItemDetail & { qty: number }

type OptimisticCartContextType = {
  getQty: (productId: number) => number
  addToCart: (productId: number, detail: CartItemDetail, variantId?: number) => void
  increment: (productId: number) => void
  decrement: (productId: number) => void
  removeFromCart: (productId: number) => void
  clearAllItems: () => void
  totalItems: number
  /** Full cart items with details — for CartPage rendering */
  cartItems: CartItemFull[]
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
  cartItems: [],
  serverCart: null,
})

export function useOptimisticCart() {
  return useContext(OptimisticCartContext)
}

// ─── localStorage: quantities ────────────────────────────────────────────────

const QTY_KEY = 'fleur-cart-snapshot'
const DETAILS_KEY = 'fleur-cart-details'

function readQtySnapshot(): Map<number, number> {
  if (typeof window === 'undefined') return new Map()
  try {
    const raw = localStorage.getItem(QTY_KEY)
    if (!raw) return new Map()
    const entries: [number, number][] = JSON.parse(raw)
    return new Map(entries.filter(([, qty]) => qty > 0))
  } catch {
    return new Map()
  }
}

function writeQtySnapshot(map: Map<number, number>) {
  try {
    const entries = [...map.entries()].filter(([, qty]) => qty > 0)
    localStorage.setItem(QTY_KEY, JSON.stringify(entries))
  } catch {}
}

// ─── localStorage: product details ───────────────────────────────────────────

function readDetails(): Map<number, CartItemDetail> {
  if (typeof window === 'undefined') return new Map()
  try {
    const raw = localStorage.getItem(DETAILS_KEY)
    if (!raw) return new Map()
    const arr: CartItemDetail[] = JSON.parse(raw)
    if (!Array.isArray(arr)) return new Map()
    return new Map(arr.map((d) => [d.productId, d]))
  } catch {
    return new Map()
  }
}

function writeDetails(map: Map<number, CartItemDetail>) {
  try {
    localStorage.setItem(DETAILS_KEY, JSON.stringify([...map.values()]))
  } catch {}
}

// ─── Persist all (qty + cookie + details) ────────────────────────────────────

function persistQty(map: Map<number, number>) {
  writeQtySnapshot(map)
  if (typeof document !== 'undefined') setCartCookie(map)
}

// ─── Helper ──────────────────────────────────────────────────────────────────

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
      persistQty(merged)
      return merged
    })
    return next
  })
}

// ─── Provider ────────────────────────────────────────────────────────────────

type ProviderProps = {
  children: React.ReactNode
  initialCart?: [number, number][] | null
}

export function OptimisticCartProvider({ children, initialCart }: ProviderProps) {
  const { addItem, cart, incrementItem, decrementItem, removeItem, clearCart } = useCart()

  const [localCache, setLocalCache] = useState<Map<number, number>>(() => {
    if (initialCart && initialCart.length > 0) return new Map(initialCart)
    return readQtySnapshot()
  })
  const [optimistic, setOptimistic] = useState<Map<number, number>>(new Map())
  const [details, setDetails] = useState<Map<number, CartItemDetail>>(() => readDetails())

  const pendingAdds = useRef<Set<number>>(new Set())
  const removeQueue = useRef<Set<number>>(new Set())

  // ── Server helpers ──

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

  // ── Quantity: optimistic > server > localStorage ──

  const getQty = useCallback((productId: number): number => {
    if (optimistic.has(productId)) return optimistic.get(productId)!
    if (serverMap.has(productId)) return serverMap.get(productId)!
    return localCache.get(productId) || 0
  }, [optimistic, serverMap, localCache])

  // ── Sync server → localStorage + update details from server cart ──

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
      persistQty(merged)
      return merged
    })

    // Enrich details from server cart (full product data)
    if (cart?.items?.length) {
      setDetails((prev) => {
        const next = new Map(prev)
        let changed = false
        for (const item of cart.items as any[]) {
          const product = item.product
          if (typeof product !== 'object' || !product?.slug) continue
          const pid = product.id as number
          const variant = item.variant
          const isVariant = Boolean(variant) && typeof variant === 'object'
          const gallery = product.gallery || []
          const firstImage = typeof gallery[0]?.image === 'object' ? gallery[0].image : null
          const metaImage = typeof product.meta?.image === 'object' ? product.meta.image : null
          const img = firstImage || metaImage

          const detail: CartItemDetail = {
            productId: pid,
            title: product.title || '',
            slug: product.slug || '',
            price: isVariant ? (variant?.priceInUSD ?? product.priceInUSD ?? 0) : (product.priceInUSD ?? 0),
            image: img?.url || null,
            imageAlt: img?.alt || null,
            variantId: isVariant ? variant?.id : undefined,
            variantLabel: isVariant
              ? variant?.options?.map((o: any) => typeof o === 'object' ? o.label : null).filter(Boolean).join(' / ')
              : undefined,
          }
          next.set(pid, detail)
          changed = true
        }
        if (changed) writeDetails(next)
        return changed ? next : prev
      })
    }
  }, [serverMap, cart]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync optimistic ──

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

  const addToCart = useCallback((productId: number, detail: CartItemDetail, variantId?: number) => {
    if (pendingAdds.current.has(productId)) return
    pendingAdds.current.add(productId)
    removeQueue.current.delete(productId)

    // Save product details immediately
    setDetails((prev) => {
      const next = new Map(prev)
      next.set(productId, detail)
      writeDetails(next)
      return next
    })

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
    // Remove from details too
    setDetails((prev) => {
      const next = new Map(prev)
      next.delete(productId)
      writeDetails(next)
      return next
    })
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
    setDetails(new Map())
    persistQty(new Map())
    writeDetails(new Map())
    if (typeof document !== 'undefined') clearCartCookie()
    pendingAdds.current.clear()
    removeQueue.current.clear()
    clearCart().catch(() => {})
  }, [clearCart])

  // ── Total items ──

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

  // ── Full cart items with details ──

  const cartItems = useMemo<CartItemFull[]>(() => {
    const merged = new Map(localCache)
    for (const [pid, qty] of serverMap) merged.set(pid, qty)
    for (const [pid, qty] of optimistic) {
      if (qty > 0) merged.set(pid, qty)
      else merged.delete(pid)
    }

    const result: CartItemFull[] = []
    for (const [pid, qty] of merged) {
      if (qty <= 0) continue
      const detail = details.get(pid)
      if (detail) {
        result.push({ ...detail, qty })
      }
    }
    return result
  }, [localCache, serverMap, optimistic, details])

  const value = useMemo(() => ({
    getQty, addToCart, increment, decrement, removeFromCart, clearAllItems,
    totalItems, cartItems, serverCart: cart,
  }), [getQty, addToCart, increment, decrement, removeFromCart, clearAllItems, totalItems, cartItems, cart])

  return (
    <OptimisticCartContext.Provider value={value}>
      {children}
    </OptimisticCartContext.Provider>
  )
}
