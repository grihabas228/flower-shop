'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const STORAGE_KEY = 'fleur_favorites'

type FavoritesContextType = {
  favorites: number[]
  toggleFavorite: (productId: number) => void
  isFavorite: (productId: number) => boolean
  /** Remove IDs that no longer exist in the database */
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
  } catch {
    // corrupted — reset
  }
  return []
}

function writeStorage(ids: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // storage full — ignore
  }
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<number[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage after mount
  useEffect(() => {
    setFavorites(readStorage())
    setHydrated(true)
  }, [])

  // Sync across tabs
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setFavorites(readStorage())
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const toggleFavorite = useCallback((productId: number) => {
    setFavorites((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
      writeStorage(next)
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
      if (next.length !== prev.length) {
        writeStorage(next)
      }
      return next
    })
  }, [])

  const count = hydrated ? favorites.length : 0

  const value = useMemo(
    () => ({ favorites, toggleFavorite, isFavorite, removeStale, count }),
    [favorites, toggleFavorite, isFavorite, removeStale, count],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}
