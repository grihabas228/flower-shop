'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { X, Truck, AlertCircle, Check, Loader2 } from 'lucide-react'
import { Drawer } from 'vaul'
import { AddressInput, type DaDataSuggestion } from '@/components/AddressInput'
import { YandexMap } from '@/components/YandexMap'
import { useDelivery, type DeliveryZoneSnapshot } from '@/providers/DeliveryProvider'
import { MOBILE_SCROLL_ID } from '@/components/MobileScrollContainer'

const LAST_ADDRESS_KEY = 'fleur_last_address'
const SHOP_COORDS: [number, number] = [55.751574, 37.573856]
const DEFAULT_ZOOM = 10
const SELECTED_ZOOM = 15

function formatRub(n: number): string {
  return `${n.toLocaleString('ru-RU')} ₽`
}

/**
 * Bottom sheet for entering / changing the delivery address on mobile.
 * Fixed height (~75dvh) — no layout shifts between states.
 *
 * States: empty → loading → result / unavailable
 * All slots (input, map, info bar, buttons) are always rendered with fixed sizes.
 */
export function AddressBottomSheet() {
  const { zone, setZone, markUnavailable, clear } = useDelivery()
  const [open, setOpen] = useState(false)
  const savedScrollTop = useRef(0)

  const [addressValue, setAddressValue] = useState('')
  const [addressSelected, setAddressSelected] = useState(false)
  const [addressUnavailable, setAddressUnavailable] = useState(false)
  const [loading, setLoading] = useState(false)

  const [mapCenter, setMapCenter] = useState<[number, number]>(SHOP_COORDS)
  const [mapMarker, setMapMarker] = useState<[number, number]>(SHOP_COORDS)
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM)

  const [zoneResult, setZoneResult] = useState<{
    estimatedTime: string | null
    price3h: number
    isFree: boolean
    freeFrom: number | null
  } | null>(null)

  // Save scroll position whenever drawer opens
  useEffect(() => {
    if (open) {
      const el = document.getElementById(MOBILE_SCROLL_ID)
      if (el) savedScrollTop.current = el.scrollTop
    }
  }, [open])

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
      setLoading(false)
      setZoneResult({
        estimatedTime: zone.estimatedTime,
        price3h: zone.price3h,
        isFree: zone.freeFrom != null && zone.price3h === 0,
        freeFrom: zone.freeFrom,
      })
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
              setMapZoom(SELECTED_ZOOM)
            }
          }
        }
      } catch { /* ignore */ }
    } else {
      resetToEmpty()
    }
  }, [open, zone])

  /** Reset all fields to empty state — NO layout shift */
  const resetToEmpty = useCallback(() => {
    setAddressValue('')
    setAddressSelected(false)
    setAddressUnavailable(false)
    setLoading(false)
    setZoneResult(null)
    setMapCenter(SHOP_COORDS)
    setMapMarker(SHOP_COORDS)
    setMapZoom(DEFAULT_ZOOM)
  }, [])

  const handleAddressSelect = useCallback(async (suggestion: DaDataSuggestion) => {
    const { data } = suggestion
    setAddressSelected(true)
    setAddressUnavailable(false)
    setLoading(true)
    setZoneResult(null)

    // Update map immediately from suggestion coordinates
    if (data.geo_lat && data.geo_lon) {
      const lat = parseFloat(data.geo_lat)
      const lon = parseFloat(data.geo_lon)
      setMapCenter([lat, lon])
      setMapMarker([lat, lon])
      setMapZoom(SELECTED_ZOOM)
    }

    try {
      // Step 1: Clean address
      const cleanRes = await fetch('/api/dadata/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: suggestion.value }),
      })
      const cleanData = await cleanRes.json()
      if (cleanData.error) {
        setLoading(false)
        return
      }

      // Step 2: Determine zone (sequential — depends on clean result)
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
        setLoading(false)
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
    } finally {
      setLoading(false)
    }
  }, [setZone, markUnavailable])

  /** Restore scroll position after drawer closes */
  const restoreScroll = useCallback(() => {
    const el = document.getElementById(MOBILE_SCROLL_ID)
    if (!el) return
    const target = savedScrollTop.current
    const restore = () => {
      el.scrollTop = target
      document.body.style.removeProperty('position')
      document.body.style.removeProperty('top')
      document.body.style.removeProperty('left')
      document.body.style.removeProperty('right')
      document.body.style.removeProperty('overflow')
      document.body.style.removeProperty('pointer-events')
    }
    restore()
    requestAnimationFrame(restore)
    setTimeout(restore, 0)
    setTimeout(restore, 50)
    setTimeout(restore, 150)
    setTimeout(restore, 300)
  }, [])

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) restoreScroll()
  }, [restoreScroll])

  const handleClose = useCallback(() => handleOpenChange(false), [handleOpenChange])
  const handleConfirm = handleClose

  const handleClear = useCallback(() => {
    resetToEmpty()
    clear()
    try { localStorage.removeItem(LAST_ADDRESS_KEY) } catch { /* ignore */ }
  }, [clear, resetToEmpty])

  // Derived state
  const canConfirm = addressSelected && !addressUnavailable && !loading

  return (
    <Drawer.Root
      open={open}
      onOpenChange={handleOpenChange}
      noBodyStyles
      repositionInputs={false}
      shouldScaleBackground={false}
      disablePreventScroll
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[80] bg-[#2d2d2d]/40 lg:hidden" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-[80] rounded-t-3xl bg-[#faf5f0] outline-none lg:hidden"
          style={{ height: '75dvh', minHeight: '75dvh' }}
        >
          {/* Drag handle */}
          <Drawer.Handle className="mx-auto mt-3 mb-1 h-1 w-10 rounded-full bg-[#e8e4de]" />

          {/* Fixed-height inner layout — no scroll needed, everything fits */}
          <div className="flex flex-col h-[calc(75dvh-24px)] px-5">
            {/* Header — fixed 40px */}
            <div className="flex items-center justify-between shrink-0 pb-3">
              <Drawer.Title className="font-serif text-xl text-[#2d2d2d]">
                Адрес доставки
              </Drawer.Title>
              <button
                onClick={handleClose}
                className="p-1 text-[#8a8a8a] hover:text-[#2d2d2d]"
                aria-label="Закрыть"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Address input — fixed slot */}
            <div className="shrink-0 ios-no-zoom">
              <AddressInput
                value={addressValue}
                onChange={(val) => {
                  setAddressValue(val)
                  if (addressSelected) {
                    setAddressSelected(false)
                    setZoneResult(null)
                    setAddressUnavailable(false)
                    setLoading(false)
                  }
                }}
                onSelect={handleAddressSelect}
                placeholder="Укажите улицу и дом"
              />
            </div>

            {/* Map — fixed height, identical in both states */}
            <div className="shrink-0 h-[220px] mt-3 rounded-2xl overflow-hidden border border-[#e8e4de]">
              <YandexMap
                center={mapCenter}
                zoom={mapZoom}
                markerCoords={mapMarker}
                markerTitle={addressValue || 'FLEUR'}
                markerBody=""
              />
            </div>

            {/* Delivery info bar — FIXED HEIGHT, always rendered, identical in all states */}
            <div className="shrink-0 mt-3">
              <DeliveryInfoSlot
                loading={loading}
                zoneResult={zoneResult}
                addressUnavailable={addressUnavailable}
                addressSelected={addressSelected}
              />
            </div>

            {/* Action buttons — ALWAYS rendered, fixed height */}
            <div className="shrink-0 flex gap-3 mt-3 pb-4">
              <button
                onClick={handleConfirm}
                disabled={!canConfirm}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 font-sans text-[14px] font-medium transition-all duration-150 ${
                  canConfirm
                    ? 'bg-[#2d2d2d] text-[#faf5f0] hover:bg-[#2d2d2d]/90'
                    : 'bg-[#e8e4de] text-[#b0a99e] cursor-not-allowed'
                }`}
              >
                <Check className="h-4 w-4" strokeWidth={2} />
                Подтвердить
              </button>
              <button
                onClick={handleClear}
                className={`shrink-0 rounded-full border border-[#e8e4de] px-5 py-3.5 font-sans text-[13px] transition-all duration-150 ${
                  addressSelected
                    ? 'text-[#8a8a8a] hover:border-[#2d2d2d] hover:text-[#2d2d2d]'
                    : 'invisible'
                }`}
              >
                Сбросить
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

/**
 * Fixed-height slot for delivery info. Shows one of:
 * - Hint text (no address)
 * - Skeleton loader (loading)
 * - Delivery result (price + time)
 * - Unavailable warning
 *
 * All variants have identical outer dimensions — zero layout shift.
 */
function DeliveryInfoSlot({
  loading,
  zoneResult,
  addressUnavailable,
  addressSelected,
}: {
  loading: boolean
  zoneResult: { estimatedTime: string | null; price3h: number; isFree: boolean; freeFrom: number | null } | null
  addressUnavailable: boolean
  addressSelected: boolean
}) {
  // Shared outer shell — identical px, py, rounded, min-h, bg for ALL states
  // Two-line inner structure: line1 (icon + text 13px) + line2 (text 11px, always rendered)
  const shell = 'min-h-[56px] rounded-xl px-4 py-3 bg-gradient-to-br from-[#e8b4b8]/10 to-[#e8b4b8]/5'

  // Unavailable
  if (addressUnavailable) {
    return (
      <div className={`${shell} !bg-red-50`}>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="font-sans text-[13px] font-medium text-red-600">
            Доставка в этот район пока недоступна
          </p>
        </div>
        <p className="font-sans text-[11px] text-transparent mt-1 ml-6" aria-hidden="true">&nbsp;</p>
      </div>
    )
  }

  // Loading skeleton — identical <p> tags as result, skeleton bars inside
  if (loading) {
    return (
      <div className={shell}>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 text-[#e8b4b8] shrink-0 animate-spin" />
          <p className="font-sans text-[13px] font-medium leading-normal">
            <span className="inline-block h-3 w-36 rounded bg-[#e8e4de] animate-pulse align-middle" />
          </p>
        </div>
        <p className="font-sans text-[11px] mt-1 ml-6 leading-normal">
          <span className="inline-block h-2.5 w-24 rounded bg-[#e8e4de]/60 animate-pulse align-middle" />
        </p>
      </div>
    )
  }

  // Result — always render line2 (invisible spacer when no freeFrom text)
  if (zoneResult) {
    const hasFreeLine = zoneResult.freeFrom && !zoneResult.isFree
    return (
      <div className={shell}>
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
        <p className={`font-sans text-[11px] mt-1 ml-6 ${hasFreeLine ? 'text-[#8a8a8a]' : 'text-transparent'}`}>
          {hasFreeLine ? `Бесплатно от ${zoneResult.freeFrom!.toLocaleString('ru-RU')} ₽` : '\u00A0'}
        </p>
      </div>
    )
  }

  // Empty — hint, identical shell and two-line structure
  return (
    <div className={shell}>
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-[#c9c4be] shrink-0" />
        <p className="font-sans text-[13px] font-medium text-[#999]">
          Укажите адрес для расчёта доставки
        </p>
      </div>
      <p className="font-sans text-[11px] text-transparent mt-1 ml-6" aria-hidden="true">&nbsp;</p>
    </div>
  )
}
