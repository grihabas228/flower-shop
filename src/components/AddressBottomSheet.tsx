'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { X, Truck, AlertCircle, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AddressInput, type DaDataSuggestion } from '@/components/AddressInput'
import { lockMobileScroll } from '@/utilities/lockMobileScroll'
import { YandexMap } from '@/components/YandexMap'
import { useDelivery, type DeliveryZoneSnapshot } from '@/providers/DeliveryProvider'

const LAST_ADDRESS_KEY = 'fleur_last_address'
const SHOP_COORDS: [number, number] = [55.751574, 37.573856]

function formatRub(n: number): string {
  return `${n.toLocaleString('ru-RU')} ₽`
}

/**
 * Bottom sheet for entering / changing the delivery address on mobile.
 * Contains AddressInput (DaData) + YandexMap + delivery zone result.
 * Listens for 'fleur:open-address-sheet' custom event.
 */
export function AddressBottomSheet() {
  const { zone, setZone, markUnavailable, clear } = useDelivery()
  const [open, setOpen] = useState(false)

  const [addressValue, setAddressValue] = useState('')
  const [addressSelected, setAddressSelected] = useState(false)
  const [addressUnavailable, setAddressUnavailable] = useState(false)

  const [mapCenter, setMapCenter] = useState<[number, number]>(SHOP_COORDS)
  const [mapMarker, setMapMarker] = useState<[number, number]>(SHOP_COORDS)
  const [mapZoom, setMapZoom] = useState(12)

  const [zoneResult, setZoneResult] = useState<{
    estimatedTime: string | null
    price3h: number
    isFree: boolean
    freeFrom: number | null
  } | null>(null)

  // Open via custom event
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('fleur:open-address-sheet', handler)
    return () => window.removeEventListener('fleur:open-address-sheet', handler)
  }, [])

  // Pre-populate from existing zone when opening
  useEffect(() => {
    if (!open) return
    if (zone) {
      setAddressValue(zone.address)
      setAddressSelected(true)
      setZoneResult({
        estimatedTime: zone.estimatedTime,
        price3h: zone.price3h,
        isFree: zone.freeFrom != null && zone.price3h === 0,
        freeFrom: zone.freeFrom,
      })
      // Try to restore map position from localStorage
      try {
        const raw = localStorage.getItem(LAST_ADDRESS_KEY)
        if (raw) {
          const stored = JSON.parse(raw)
          if (stored.geo_lat && stored.geo_lon) {
            const lat = parseFloat(stored.geo_lat)
            const lon = parseFloat(stored.geo_lon)
            if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
              setMapCenter([lat, lon])
              setMapMarker([lat, lon])
              setMapZoom(15)
            }
          }
        }
      } catch { /* ignore */ }
    } else {
      setAddressValue('')
      setAddressSelected(false)
      setZoneResult(null)
      setMapCenter(SHOP_COORDS)
      setMapMarker(SHOP_COORDS)
      setMapZoom(12)
    }
  }, [open, zone])

  // Lock scroll when opening — unlock is deferred to onExitComplete so the
  // exit animation finishes before we restore scroll position.
  const unlockRef = useRef<(() => void) | null>(null)
  useEffect(() => {
    if (open) {
      unlockRef.current = lockMobileScroll()
    }
  }, [open])

  const handleExitComplete = useCallback(() => {
    unlockRef.current?.()
    unlockRef.current = null
  }, [])

  const handleAddressSelect = useCallback(async (suggestion: DaDataSuggestion) => {
    const { data } = suggestion
    setAddressSelected(true)
    setAddressUnavailable(false)

    // Update map immediately from suggestion coordinates
    if (data.geo_lat && data.geo_lon) {
      const lat = parseFloat(data.geo_lat)
      const lon = parseFloat(data.geo_lon)
      setMapCenter([lat, lon])
      setMapMarker([lat, lon])
      setMapZoom(15)
    }

    try {
      // Step 1: Clean address
      const cleanRes = await fetch('/api/dadata/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: suggestion.value }),
      })
      const cleanData = await cleanRes.json()
      if (cleanData.error) return

      // Step 2: Determine zone
      const zoneRes = await fetch('/api/delivery/zone-by-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beltway_hit: cleanData.beltway_hit,
          beltway_distance: cleanData.beltway_distance,
          cartTotal: 0,
        }),
      })
      const info = await zoneRes.json()

      if (info.unavailable) {
        setAddressUnavailable(true)
        setZoneResult(null)
        markUnavailable(suggestion.value)
        return
      }

      if (info.zone) {
        const isFree = info.zone.freeFrom != null && info.isFree
        setZoneResult({
          estimatedTime: info.zone.estimatedTime,
          price3h: info.zone.price3h ?? 0,
          isFree,
          freeFrom: info.zone.freeFrom ?? null,
        })

        // Update DeliveryProvider
        const snapshot: DeliveryZoneSnapshot = {
          id: info.zone.id,
          zoneType: info.zone.zoneType,
          price3h: info.zone.price3h ?? 0,
          price1h: info.zone.price1h ?? null,
          priceExact: info.zone.priceExact ?? null,
          availableIntervals: info.zone.availableIntervals ?? ['3h'],
          freeFrom: info.zone.freeFrom ?? null,
          estimatedTime: info.zone.estimatedTime ?? null,
          address: suggestion.value,
        }
        setZone(snapshot)

        // Persist to localStorage
        try {
          localStorage.setItem(
            LAST_ADDRESS_KEY,
            JSON.stringify({
              address: suggestion.value,
              geo_lat: data.geo_lat ?? cleanData.geo_lat ?? '',
              geo_lon: data.geo_lon ?? cleanData.geo_lon ?? '',
              beltway_hit: cleanData.beltway_hit ?? null,
              beltway_distance: cleanData.beltway_distance ?? null,
              zone_result: info,
            }),
          )
        } catch { /* ignore */ }
      }
    } catch {
      // network error — keep current state
    }
  }, [setZone, markUnavailable])

  const handleConfirm = () => setOpen(false)

  const handleClear = useCallback(() => {
    setAddressValue('')
    setAddressSelected(false)
    setAddressUnavailable(false)
    setZoneResult(null)
    setMapCenter(SHOP_COORDS)
    setMapMarker(SHOP_COORDS)
    setMapZoom(12)
    clear()
    try { localStorage.removeItem(LAST_ADDRESS_KEY) } catch { /* ignore */ }
  }, [clear])

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[80] bg-[#2d2d2d]/40 lg:hidden"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-0 left-0 right-0 z-[80] max-h-[80dvh] overflow-y-auto rounded-t-3xl bg-[#faf5f0] lg:hidden"
          >
            {/* Handle + close */}
            <div className="sticky top-0 z-10 bg-[#faf5f0] pt-3 pb-2 px-5">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#e8e4de]" />
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl text-[#2d2d2d]">Адрес доставки</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 text-[#8a8a8a] hover:text-[#2d2d2d]"
                  aria-label="Закрыть"
                >
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <div className="space-y-4 px-5 pb-6">
              {/* AddressInput — wrapper forces 16px font to prevent iOS zoom */}
              <div className="ios-no-zoom">
                <AddressInput
                  value={addressValue}
                  onChange={(val) => {
                    setAddressValue(val)
                    if (addressSelected) {
                      setAddressSelected(false)
                      setZoneResult(null)
                      setAddressUnavailable(false)
                    }
                  }}
                  onSelect={handleAddressSelect}
                  placeholder="Укажите улицу и дом"
                />
              </div>

              {/* Map */}
              <div className="h-[200px] rounded-2xl overflow-hidden border border-[#e8e4de]">
                <YandexMap
                  center={mapCenter}
                  zoom={mapZoom}
                  markerCoords={mapMarker}
                  markerTitle={addressValue || 'FLEUR'}
                  markerBody=""
                />
              </div>

              {/* Zone result */}
              {addressUnavailable && (
                <div className="flex items-center gap-2.5 rounded-xl bg-red-50 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <p className="font-sans text-[13px] text-red-600">
                    Доставка в этот район пока недоступна
                  </p>
                </div>
              )}

              {zoneResult && !addressUnavailable && (
                <div className="rounded-xl bg-gradient-to-br from-[#e8b4b8]/10 to-[#e8b4b8]/5 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-[#e8b4b8] shrink-0" />
                    <p className="font-sans text-[13px] font-medium text-[#2d2d2d]">
                      Доставка: {zoneResult.estimatedTime}
                      {' · '}
                      {zoneResult.isFree ? (
                        <span className="text-[#5a7a45]">Бесплатно</span>
                      ) : (
                        formatRub(zoneResult.price3h)
                      )}
                    </p>
                  </div>
                  {zoneResult.freeFrom && !zoneResult.isFree && (
                    <p className="font-sans text-[11px] text-[#8a8a8a] mt-1 ml-6">
                      Бесплатно от {zoneResult.freeFrom.toLocaleString('ru-RU')} ₽
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                {addressSelected && !addressUnavailable && (
                  <button
                    onClick={handleConfirm}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#2d2d2d] py-3.5 font-sans text-[14px] font-medium text-[#faf5f0] transition-colors hover:bg-[#2d2d2d]/90"
                  >
                    <Check className="h-4 w-4" strokeWidth={2} />
                    Подтвердить
                  </button>
                )}
                {addressSelected && (
                  <button
                    onClick={handleClear}
                    className="shrink-0 rounded-full border border-[#e8e4de] px-5 py-3.5 font-sans text-[13px] text-[#8a8a8a] transition-colors hover:border-[#2d2d2d] hover:text-[#2d2d2d]"
                  >
                    Сбросить
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
