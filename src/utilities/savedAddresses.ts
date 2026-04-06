/**
 * localStorage-backed saved delivery addresses for the checkout flow.
 *
 * Stored under "fleur_saved_addresses" as a JSON array. All read/write
 * operations are SSR-safe (no-op when window is undefined).
 */

export type SavedAddress = {
  id: string
  address: string
  apartment: string
  entrance: string
  floor: string
  intercom: string
  geo_lat: string
  geo_lon: string
  beltway_hit: string | null
  beltway_distance: string | null
  isDefault: boolean
}

export const SAVED_ADDRESSES_KEY = 'fleur_saved_addresses'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

function generateId(): string {
  if (isBrowser() && typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `addr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function loadSavedAddresses(): SavedAddress[] {
  if (!isBrowser()) return []
  try {
    const raw = window.localStorage.getItem(SAVED_ADDRESSES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((a): a is SavedAddress => typeof a?.id === 'string' && typeof a?.address === 'string')
  } catch {
    return []
  }
}

function persist(addresses: SavedAddress[]): SavedAddress[] {
  if (!isBrowser()) return addresses
  try {
    window.localStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(addresses))
  } catch {
    // ignore quota / privacy mode
  }
  return addresses
}

/** Sort: default first, then most-recently-added (insertion order). */
export function sortAddresses(addresses: SavedAddress[]): SavedAddress[] {
  return [...addresses].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1
    if (!a.isDefault && b.isDefault) return 1
    return 0
  })
}

/** Find an existing saved address by full address string (case-insensitive trim). */
export function findExistingByAddress(
  addresses: SavedAddress[],
  address: string,
): SavedAddress | null {
  const needle = address.trim().toLowerCase()
  if (!needle) return null
  return addresses.find((a) => a.address.trim().toLowerCase() === needle) ?? null
}

export type NewAddressInput = Omit<SavedAddress, 'id' | 'isDefault'> & {
  isDefault?: boolean
}

/**
 * Add a new address. If an entry with the same `address` string already exists,
 * it is updated in place (returning its id). The first address ever saved is
 * automatically marked as default.
 */
export function addAddress(input: NewAddressInput): { addresses: SavedAddress[]; id: string } {
  const current = loadSavedAddresses()
  const existing = findExistingByAddress(current, input.address)

  if (existing) {
    const updated = current.map((a) =>
      a.id === existing.id
        ? {
            ...a,
            apartment: input.apartment || a.apartment,
            entrance: input.entrance || a.entrance,
            floor: input.floor || a.floor,
            intercom: input.intercom || a.intercom,
            geo_lat: input.geo_lat || a.geo_lat,
            geo_lon: input.geo_lon || a.geo_lon,
            beltway_hit: input.beltway_hit ?? a.beltway_hit,
            beltway_distance: input.beltway_distance ?? a.beltway_distance,
          }
        : a,
    )
    return { addresses: persist(updated), id: existing.id }
  }

  const id = generateId()
  const isDefault = input.isDefault ?? current.length === 0
  const next: SavedAddress = {
    id,
    address: input.address,
    apartment: input.apartment,
    entrance: input.entrance,
    floor: input.floor,
    intercom: input.intercom,
    geo_lat: input.geo_lat,
    geo_lon: input.geo_lon,
    beltway_hit: input.beltway_hit,
    beltway_distance: input.beltway_distance,
    isDefault,
  }

  // If we're adding a new default, demote others
  const cleared = isDefault ? current.map((a) => ({ ...a, isDefault: false })) : current
  return { addresses: persist([...cleared, next]), id }
}

export function updateAddress(id: string, patch: Partial<Omit<SavedAddress, 'id'>>): SavedAddress[] {
  const current = loadSavedAddresses()
  const updated = current.map((a) => (a.id === id ? { ...a, ...patch } : a))
  return persist(updated)
}

export function removeAddress(id: string): SavedAddress[] {
  const current = loadSavedAddresses()
  const filtered = current.filter((a) => a.id !== id)
  // If we removed the default, promote the first remaining
  if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
    filtered[0]!.isDefault = true
  }
  return persist(filtered)
}

export function setDefaultAddress(id: string): SavedAddress[] {
  const current = loadSavedAddresses()
  const updated = current.map((a) => ({ ...a, isDefault: a.id === id }))
  return persist(updated)
}
