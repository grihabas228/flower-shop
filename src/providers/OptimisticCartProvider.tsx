'use client'

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { toast } from 'sonner'

type OptimisticCartContextType = {
  /** Get optimistic quantity for a product (instant, no server wait) */
  getQty: (productId: number) => number
  /** Add product to cart — instant UI, server in background */
  addToCart: (productId: number, variantId?: number) => void
  /** Increment quantity — instant UI */
  increment: (productId: number) => void
  /** Decrement quantity — instant UI, removes at 0 */
  decrement: (productId: number) => void
  /** Total items in cart (optimistic) — for badges */
  totalItems: number
  /** Whether the server cart has been loaded at least once */
  isHydrated: boolean
}

const OptimisticCartContext = createContext<OptimisticCartContextType>({
  getQty: () => 0,
  addToCart: () => {},
  increment: () => {},
  decrement: () => {},
  totalItems: 0,
  isHydrated: false,
})

export function useOptimisticCart() {
  return useContext(OptimisticCartContext)
}

export function OptimisticCartProvider({ children }: { children: React.ReactNode }) {
  const { addItem, cart, incrementItem, decrementItem, removeItem } = useCart()

  // productId → optimistic quantity (overrides server value)
  const [optimistic, setOptimistic] = useState<Map<number, number>>(new Map())
  const [isHydrated, setIsHydrated] = useState(false)

  // Track products with add-in-flight
  const pendingAdds = useRef<Set<number>>(new Set())
  // Queue: products that need removal after add completes
  const removeQueue = useRef<Set<number>>(new Set())

  // Mark hydrated once cart loads
  useEffect(() => {
    if (cart) setIsHydrated(true)
  }, [cart])

  // Find cart item by product ID
  const findCartItem = useCallback((productId: number) => {
    if (!cart?.items?.length) return null
    return cart.items.find((item) => {
      if (!item.product) return false
      const pid = typeof item.product === 'object' ? item.product.id : item.product
      return pid === productId
    }) ?? null
  }, [cart])

  // Get quantity: optimistic if overridden, else server
  const getQty = useCallback((productId: number): number => {
    if (optimistic.has(productId)) return optimistic.get(productId)!
    const item = findCartItem(productId)
    return item?.quantity || 0
  }, [optimistic, findCartItem])

  // Sync: when server catches up, clear optimistic overrides
  useEffect(() => {
    if (optimistic.size === 0 && removeQueue.current.size === 0) return

    setOptimistic((prev) => {
      const next = new Map(prev)
      let changed = false
      for (const [pid, optQty] of prev) {
        const serverItem = findCartItem(pid)
        const serverQty = serverItem?.quantity || 0
        // Server matches optimistic → clear override
        if (serverQty === optQty) {
          next.delete(pid)
          changed = true
        }
        // Optimistic 0 and item gone from server → clear
        if (optQty === 0 && !serverItem) {
          next.delete(pid)
          changed = true
        }
      }
      return changed ? next : prev
    })

    // Process remove queue: items that need removal after add completed
    for (const pid of removeQueue.current) {
      if (!pendingAdds.current.has(pid)) {
        const item = findCartItem(pid)
        if (item?.id) {
          removeQueue.current.delete(pid)
          removeItem(item.id).catch(() => {})
        } else if (!item) {
          // Item already gone
          removeQueue.current.delete(pid)
        }
      }
    }
  }, [cart, findCartItem, optimistic, removeItem])

  const addToCart = useCallback((productId: number, variantId?: number) => {
    if (pendingAdds.current.has(productId)) return
    pendingAdds.current.add(productId)
    removeQueue.current.delete(productId)

    setOptimistic((prev) => new Map(prev).set(productId, 1))

    addItem({ product: productId, variant: variantId })
      .then(() => {
        pendingAdds.current.delete(productId)
      })
      .catch(() => {
        pendingAdds.current.delete(productId)
        removeQueue.current.delete(productId)
        setOptimistic((prev) => {
          const next = new Map(prev)
          next.delete(productId)
          return next
        })
        toast.error('Ошибка при добавлении')
      })
  }, [addItem])

  const increment = useCallback((productId: number) => {
    const currentQty = getQty(productId)
    setOptimistic((prev) => new Map(prev).set(productId, currentQty + 1))

    const item = findCartItem(productId)
    if (item?.id) {
      incrementItem(item.id).catch(() => {
        setOptimistic((prev) => {
          const next = new Map(prev)
          next.delete(productId)
          return next
        })
      })
    }
  }, [getQty, findCartItem, incrementItem])

  const decrement = useCallback((productId: number) => {
    const currentQty = getQty(productId)

    if (currentQty <= 1) {
      // Going to 0
      setOptimistic((prev) => new Map(prev).set(productId, 0))

      if (pendingAdds.current.has(productId)) {
        // Add still in flight → queue remove for when it arrives
        removeQueue.current.add(productId)
      } else {
        const item = findCartItem(productId)
        if (item?.id) {
          removeItem(item.id).catch(() => {
            setOptimistic((prev) => {
              const next = new Map(prev)
              next.delete(productId)
              return next
            })
          })
        }
      }
    } else {
      setOptimistic((prev) => new Map(prev).set(productId, currentQty - 1))

      const item = findCartItem(productId)
      if (item?.id) {
        decrementItem(item.id).catch(() => {
          setOptimistic((prev) => {
            const next = new Map(prev)
            next.delete(productId)
            return next
          })
        })
      }
    }
  }, [getQty, findCartItem, removeItem, decrementItem])

  // Total items: optimistic overrides + non-overridden server items
  const totalItems = useMemo(() => {
    let total = 0
    const overridden = new Set<number>()

    for (const [pid, qty] of optimistic) {
      total += Math.max(0, qty)
      overridden.add(pid)
    }

    if (cart?.items?.length) {
      for (const item of cart.items) {
        if (!item.product) continue
        const pid = typeof item.product === 'object' ? item.product.id : item.product
        if (!overridden.has(pid as number)) {
          total += item.quantity || 0
        }
      }
    }

    return total
  }, [optimistic, cart])

  const value = useMemo(() => ({
    getQty, addToCart, increment, decrement, totalItems, isHydrated,
  }), [getQty, addToCart, increment, decrement, totalItems, isHydrated])

  return (
    <OptimisticCartContext.Provider value={value}>
      {children}
    </OptimisticCartContext.Provider>
  )
}
