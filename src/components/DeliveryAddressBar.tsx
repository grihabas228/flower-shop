'use client'

import { MapPin } from 'lucide-react'
import { useDelivery, DEFAULT_DELIVERY_TIME } from '@/providers/DeliveryProvider'

function formatRub(n: number): string {
  return `${n.toLocaleString('ru-RU')} ₽`
}

/**
 * Thin delivery-address bar shown above the mobile header (32px).
 * Clicking dispatches 'fleur:open-address-sheet' to open the address bottom sheet.
 */
export function DeliveryAddressBar() {
  const { zone, hasAddress } = useDelivery()

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('fleur:open-address-sheet'))
  }

  let addressText: string
  let detailText: string

  if (hasAddress && zone) {
    const fullAddr = zone.address || ''
    const short = fullAddr
      .replace(/^г\s*Москва,?\s*/i, '')
      .replace(/^Москва,?\s*/i, '')
      .replace(/^Россия,?\s*/i, '')
      .trim()
    addressText = short || fullAddr

    const time = zone.estimatedTime || DEFAULT_DELIVERY_TIME
    const isFree = zone.freeFrom != null && zone.price3h === 0
    const priceStr = isFree ? 'Бесплатно' : formatRub(zone.price3h)
    detailText = `${time} · ${priceStr}`
  } else {
    addressText = 'Москва'
    detailText = 'Доставка от 2 часов'
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-1.5 bg-[#f0ebe3] px-4 py-1.5 lg:hidden"
      style={{ height: 32 }}
    >
      <MapPin className="h-3 w-3 shrink-0 text-[#8a8a8a]" strokeWidth={1.5} />
      <span className="truncate font-sans text-[11px] text-[#5a5a5a]">
        <span className="font-medium text-[#2d2d2d]">{addressText}</span>
        {' · '}
        {detailText}
      </span>
    </button>
  )
}
