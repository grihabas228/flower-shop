'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  addAddress,
  loadSavedAddresses,
  removeAddress,
  setDefaultAddress,
  sortAddresses,
  updateAddress,
  type NewAddressInput,
  type SavedAddress,
  SAVED_ADDRESSES_KEY,
} from '@/utilities/savedAddresses'

/**
 * Client hook that mirrors the localStorage saved-addresses store and exposes
 * imperative mutators. Subscribes to cross-tab `storage` events so multiple
 * tabs stay in sync.
 */
export function useSavedAddresses() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Initial load
  useEffect(() => {
    setAddresses(sortAddresses(loadSavedAddresses()))
    setHydrated(true)
  }, [])

  // Cross-tab sync
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (e: StorageEvent) => {
      if (e.key !== SAVED_ADDRESSES_KEY) return
      setAddresses(sortAddresses(loadSavedAddresses()))
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const add = useCallback((input: NewAddressInput): string => {
    const { addresses: next, id } = addAddress(input)
    setAddresses(sortAddresses(next))
    return id
  }, [])

  const update = useCallback(
    (id: string, patch: Partial<Omit<SavedAddress, 'id'>>) => {
      const next = updateAddress(id, patch)
      setAddresses(sortAddresses(next))
    },
    [],
  )

  const remove = useCallback((id: string) => {
    const next = removeAddress(id)
    setAddresses(sortAddresses(next))
  }, [])

  const makeDefault = useCallback((id: string) => {
    const next = setDefaultAddress(id)
    setAddresses(sortAddresses(next))
  }, [])

  return {
    addresses,
    hydrated,
    add,
    update,
    remove,
    makeDefault,
  }
}
