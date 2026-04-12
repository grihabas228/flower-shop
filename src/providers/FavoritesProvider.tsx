'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { setFavoritesCookie } from '@/utilities/cartCookie'

const STORAGE_KEY = 'fleur_favorites'

type FavoritesContextType = {
  favorites: number[]
  toggleFavorite: (productId: number) => void
  isFavorite: (productId: number) => boolean
  removeStale: (validIds: number[]) => void
  count: number
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  toggleFavorite: () => {},
  isFavorite: () => false,
  removeStale: () => {},
  count: 0,
})

export function useFavorites() {
  return useContext(FavoritesContext)
}

function readStorage(): number[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.filter((id): id is number => typeof id === 'number')
  } catch {}
  return []
}

function persistAll(ids: number[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)) } catch {}
  if (typeof document !== 'undefined') setFavoritesCookie(ids)
}

type ProviderProps = {
  children: React.ReactNode
  /** Initial favorites from server cookie — enables flash-free SSR */
  initialFavorites?: number[] | null
}

export function FavoritesProvider({ children, initialFavorites }: ProviderProps) {
  // Init: server cookie → localStorage → empty
  const [favorites, setFavorites] = useState<number[]>(() => {
    if (initialFavorites && initialFavorites.length > 0) return initialFavorites
    return readStorage()
  })

  // Sync across tabs
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setFavorites(readStorage())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const toggleFavorite = useCallback((productId: number) => {
    setFavorites((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
      persistAll(next)
      return next
    })
  }, [])

  const isFavorite = useCallback(
    (productId: number) => favorites.includes(productId),
    [favorites],
  )

  const removeStale = useCallback((validIds: number[]) => {
    setFavorites((prev) => {
      const validSet = new Set(validIds)
      const next = prev.filter((id) => validSet.has(id))
      if (next.length !== prev.length) persistAll(next)
      return next
    })
  }, [])

  const count = favorites.length

  const value = useMemo(
    () => ({ favorites, toggleFavorite, isFavorite, removeStale, count }),
    [favorites, toggleFavorite, isFavorite, removeStale, count],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}
