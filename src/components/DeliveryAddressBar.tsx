'use client'

import { MapPin } from 'lucide-react'
import { useDelivery, DEFAULT_DELIVERY_TIME } from '@/providers/DeliveryProvider'

const LAST_ADDRESS_KEY = 'fleur_last_address'

function formatRub(n: number): string {
  return `${n.toLocaleString('ru-RU')} ₽`
}

/**
 * Thin delivery-address bar shown above the mobile header.
 * Shows "Москва · Доставка от 2 часов" when no address is stored,
 * or the saved address + estimatedTime + price3h when one exists.
 *
 * Clicking scrolls to hero AddressInput on homepage, or could open
 * an address modal on other pages (TODO).
 */
export function DeliveryAddressBar() {
  const { zone, hasAddress } = useDelivery()

  const handleClick = () => {
    // On homepage scroll to hero AddressInput
    const hero = document.getElementById('hero-address-input')
    if (hero) {
      hero.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Try to focus the input inside
      setTimeout(() => {
        const input = hero.querySelector('input')
        input?.focus()
      }, 400)
      return
    }
    // On other pages — scroll to top of scroll container
    const container = document.getElementById('mobile-scroll')
    if (container) container.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Build display text
  let addressText: string
  let detailText: string

  if (hasAddress && zone) {
    // Shorten the address for display
    const fullAddr = zone.address || ''
    // Extract street + house from full address (skip city prefix)
    const short = fullAddr
      .replace(/^г\s*Москва,?\s*/i, '')
      .replace(/^Москва,?\s*/i, '')
      .replace(/^Россия,?\s*/i, '')
      .trim()
    addressText = short || fullAddr

    const time = zone.estimatedTime || DEFAULT_DELIVERY_TIME
    const isFree = zone.freeFrom != null && zone.price3h === 0
    const priceStr = isFree ? 'Бесплатная доставка' : formatRub(zone.price3h)
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
