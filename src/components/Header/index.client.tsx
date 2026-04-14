'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search,
  User,
  ShoppingBag,
  Heart,
  MapPin,
  Phone,
  Clock,
  X,
  SlidersHorizontal,
  Send,
  MessageCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utilities/cn'
import { AuthModal } from '@/components/AuthModal'
import { useAuth } from '@/providers/Auth'
import { DeliveryAddressBar } from '@/components/DeliveryAddressBar'
import { useDelivery, DEFAULT_DELIVERY_TIME } from '@/providers/DeliveryProvider'
import { AddressInput, type DaDataSuggestion } from '@/components/AddressInput'
import { useOptimisticCart } from '@/providers/OptimisticCartProvider'
import { createUrl } from '@/utilities/createUrl'
import { sorting, priceRanges, occasions, colors, recipients } from '@/lib/constants'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { Suspense } from 'react'

import { MobileMenu } from './MobileMenu'
import { useFavorites } from '@/providers/FavoritesProvider'
import type { Header } from 'src/payload-types'

// Desktop nav — short, clean
const desktopNavLinks = [
  { label: 'Каталог', href: '/shop' },
  { label: 'О нас', href: '/about' },
  { label: 'Доставка', href: '/delivery' },
]

const categoryLinks = [
  { label: 'Все', href: '/shop', slug: '' },
  { label: 'Букеты', href: '/shop?category=bukety', slug: 'bukety' },
  { label: 'Розы', href: '/shop?category=rozy', slug: 'rozy' },
  { label: 'Композиции', href: '/shop?category=kompozicii', slug: 'kompozicii' },
  { label: 'Подарки', href: '/shop?category=podarki', slug: 'podarki' },
  { label: 'Акции', href: '/shop?category=akcii', slug: 'akcii' },
]

// Fixed heights — mobile (exported for MobileScrollContainer)
export const MOBILE_ADDRESS_BAR_H = 32
export const MOBILE_MAIN_BAR_H = 48
export const MOBILE_CATEGORY_BAR_H = 40
export const MOBILE_HEADER_H = MOBILE_ADDRESS_BAR_H + MOBILE_MAIN_BAR_H // 80
export const MOBILE_HEADER_SHOP_H = MOBILE_ADDRESS_BAR_H + MOBILE_MAIN_BAR_H + MOBILE_CATEGORY_BAR_H // 120

// Fixed heights — desktop (new 2-row layout)
const DESKTOP_ROW1_H = 64
const DESKTOP_ROW2_H = 46
const DESKTOP_HEADER_FULL_H = DESKTOP_ROW1_H + DESKTOP_ROW2_H

type Props = {
  header: Header
}

export function HeaderClient({ header }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const { count: favoritesCount } = useFavorites()
  const { totalItems: cartCount } = useOptimisticCart()
  const { zone, hasAddress } = useDelivery()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const isShopPage = pathname === '/shop' || pathname.startsWith('/shop?')
  const isCartOrCheckout = pathname === '/cart' || pathname.startsWith('/checkout') || pathname.startsWith('/account')

  const handleAccountClick = () => {
    if (user) {
      router.push('/account')
    } else {
      setShowAuthModal(true)
    }
  }

  // Active category from URL
  const activeCategory = (() => {
    if (typeof window === 'undefined') return ''
    try {
      const url = new URL(window.location.href)
      return url.searchParams.get('category') || ''
    } catch {
      return ''
    }
  })()

  // Close search on route change
  useEffect(() => {
    setSearchOpen(false)
  }, [pathname])

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════
          MOBILE HEADER (< lg) — STATIC, NO HIDE-ON-SCROLL
          Row 1: Address bar (32px)
          Row 2: Logo + social icons + search (48px)
          Row 3: Category bar — only on /shop (40px)
          ═══════════════════════════════════════════════════════════ */}
      <div className="relative z-50 shrink-0 lg:hidden">
        {/* Row 1: Delivery address bar */}
        <DeliveryAddressBar />

        {/* Row 2: Logo + contact icons */}
        <div
          className="flex items-center justify-between border-b border-[#e8e4de]/50 bg-[#faf5f0] px-4"
          style={{ height: MOBILE_MAIN_BAR_H }}
        >
          {/* Logo */}
          <Link
            href="/"
            className="font-serif text-[18px] uppercase tracking-[0.2em] text-[#2d2d2d]"
          >
            Fleur
          </Link>

          {/* Right icons: Phone · Telegram · WhatsApp · Search */}
          <div className="flex items-center gap-4">
            <a href="tel:+74951234567" aria-label="Телефон" className="text-[#2d2d2d]">
              <Phone className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </a>
            <a href="#" aria-label="Telegram" className="text-[#2d2d2d]">
              <Send className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </a>
            <a href="#" aria-label="WhatsApp" className="text-[#2d2d2d]">
              <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </a>
            <button
              onClick={() => setSearchOpen(true)}
              className="text-[#2d2d2d]"
              aria-label="Поиск"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Row 3: Category bar — only on /shop */}
        {isShopPage && (
          <div
            className="flex items-center gap-2 border-b border-[#e8e4de]/30 bg-[#faf5f0] px-3"
            style={{ height: MOBILE_CATEGORY_BAR_H }}
          >
            {/* Filter button */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('fleur:open-filters'))}
              className="shrink-0 flex items-center gap-1.5 rounded-full border border-[#e8e4de] px-3 py-1.5 text-[12px] font-medium text-[#2d2d2d] hover:border-[#e8b4b8] transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="hidden min-[400px]:inline">Фильтры</span>
            </button>

            {/* Categories horizontal scroll */}
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-1.5 pr-3">
                {categoryLinks.map((cat) => {
                  const isActive =
                    cat.slug === activeCategory || (cat.slug === '' && !activeCategory)
                  return (
                    <Link
                      key={cat.slug}
                      href={cat.href}
                      className={cn(
                        'shrink-0 rounded-full px-3 py-1.5 font-sans text-[12px] font-medium transition-all whitespace-nowrap',
                        isActive
                          ? 'bg-[#2d2d2d] text-[#faf5f0]'
                          : 'text-[#5a5a5a] hover:bg-[#f0ebe3]',
                      )}
                    >
                      {cat.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════ MOBILE SEARCH OVERLAY ═══════ */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] bg-[#faf5f0] lg:hidden"
          >
            <div className="flex h-14 items-center gap-3 px-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Найти букет..."
                  autoFocus
                  className="h-10 w-full rounded-full border border-[#e8e4de] bg-white pl-4 pr-10 font-sans text-sm text-[#2d2d2d] placeholder:text-[#9a9a9a] focus:border-[#c9c4be] focus:outline-none"
                />
                <Search
                  className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9a9a]"
                  strokeWidth={1.5}
                />
              </div>
              <button
                onClick={() => setSearchOpen(false)}
                className="p-2 text-[#2d2d2d]"
                aria-label="Закрыть поиск"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          DESKTOP HEADER (≥ lg) — 2-row layout
          Row 1: Logo · Nav · Icons (64px, fixed)
          Row 2: Context bar — depends on page (46px, sticky)
          ═══════════════════════════════════════════════════════════ */}
      <header className="hidden lg:block">
        {/* ROW 1 — Main navigation, always visible */}
        <div className="fixed top-0 left-0 right-0 z-50 border-b border-black/[0.06] bg-[#faf5f0]">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-8">
            {/* Logo */}
            <Link href="/" className="font-serif text-[22px] uppercase tracking-[0.2em] text-[#2d2d2d]">
              Fleur
            </Link>

            {/* Center nav */}
            <nav className="flex items-center gap-8">
              {desktopNavLinks.map((link) => {
                const isActive = link.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(link.href.split('?')[0]!)

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'font-sans text-[13px] uppercase tracking-[0.12em] transition-colors',
                      isActive ? 'text-[#e8b4b8]' : 'text-[#5a5a5a] hover:text-[#e8b4b8]',
                    )}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            {/* Right icons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAccountClick}
                className="p-2 text-[#2d2d2d] transition-colors hover:text-[#e8b4b8] cursor-pointer"
                aria-label="Аккаунт"
              >
                <User className="h-[20px] w-[20px]" strokeWidth={1.5} />
              </button>
              <Link
                href="/favorites"
                className="relative p-2 text-[#2d2d2d] transition-colors hover:text-[#e8b4b8]"
                aria-label="Избранное"
              >
                <Heart className="h-[20px] w-[20px]" strokeWidth={1.5} />
                {favoritesCount > 0 && (
                  <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e8b4b8] px-1 text-[9px] font-semibold text-white">
                    {favoritesCount > 99 ? '99+' : favoritesCount}
                  </span>
                )}
              </Link>
              <Link
                href="/cart"
                className="relative p-2 text-[#2d2d2d] transition-colors hover:text-[#e8b4b8]"
                aria-label="Корзина"
              >
                <ShoppingBag className="h-[20px] w-[20px]" strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e8b4b8] px-1 text-[9px] font-semibold text-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* ROW 2 — Context bar (sticky below row 1) */}
        {!isCartOrCheckout && (
          <div className="fixed top-16 left-0 right-0 z-40 border-b border-black/[0.04] bg-white" suppressHydrationWarning>
            <div className="mx-auto flex h-[46px] max-w-7xl items-center px-8">
              <Suspense fallback={null}>
                <DesktopContextBar
                  isShopPage={isShopPage}
                  activeCategory={activeCategory}
                  zone={zone}
                  hasAddress={hasAddress}
                />
              </Suspense>
            </div>
          </div>
        )}
      </header>

      {/* Desktop spacer */}
      <div
        className="hidden lg:block"
        style={{ height: isCartOrCheckout ? DESKTOP_ROW1_H : DESKTOP_HEADER_FULL_H }}
      />

      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}

// ─── Desktop Context Bar ─────────────────────────────────────────────────────

const shopCategoryLinks = [
  { label: 'Все', href: '/shop', slug: '' },
  { label: 'Букеты', href: '/shop?category=bukety', slug: 'bukety' },
  { label: 'Розы', href: '/shop?category=rozy', slug: 'rozy' },
  { label: 'Композиции', href: '/shop?category=kompozicii', slug: 'kompozicii' },
  { label: 'Подарки', href: '/shop?category=podarki', slug: 'podarki' },
]

function DesktopContextBar({
  isShopPage,
  zone,
  hasAddress,
}: {
  isShopPage: boolean
  activeCategory: string
  zone: any
  hasAddress: boolean
}) {
  if (isShopPage) {
    return <ShopContextBar zone={zone} hasAddress={hasAddress} />
  }
  return <InlineAddressWidget zone={zone} hasAddress={hasAddress} />
}

// ─── Compact Inline Address Widget for Desktop Header ────────────────────────

const LAST_ADDRESS_KEY = 'fleur_last_address'

function InlineAddressWidget({ zone, hasAddress, compact }: { zone: any; hasAddress: boolean; compact?: boolean }) {
  const { setZone, markUnavailable, clear: clearDelivery } = useDelivery()
  const [editing, setEditing] = useState(false)
  const [addressValue, setAddressValue] = useState('')
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!editing) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditing(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editing])

  // Close on click outside
  useEffect(() => {
    if (!editing) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setEditing(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [editing])

  // Address select — same chain as HeroSection:
  // DaData clean → zone-by-address → DeliveryProvider → cookie → localStorage
  // Editing closes ONLY after full chain completes (fixes /shop reset bug)
  const handleAddressSelect = useCallback(async (suggestion: DaDataSuggestion) => {
    setLoading(true)

    try {
      // Step 1: Clean address via DaData Cleaner API
      const cleanRes = await fetch('/api/dadata/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: suggestion.value }),
      })
      const cleanData = await cleanRes.json()

      if (cleanData.error) {
        setLoading(false)
        setEditing(false)
        return
      }

      // Step 2: Determine delivery zone
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

      // Step 3: Update DeliveryProvider (triggers cookie + localStorage via provider)
      if (info.unavailable) {
        markUnavailable(suggestion.value)
      } else if (info.zone) {
        setZone({
          id: info.zone.id,
          zoneType: info.zone.zoneType,
          price3h: info.zone.price3h ?? 0,
          price1h: info.zone.price1h ?? null,
          priceExact: info.zone.priceExact ?? null,
          availableIntervals: info.zone.availableIntervals ?? ['3h'],
          freeFrom: info.zone.freeFrom ?? null,
          estimatedTime: info.zone.estimatedTime ?? null,
          address: suggestion.value,
        })
      }

      // Step 4: Save to LAST_ADDRESS_KEY (same key HeroSection reads on mount)
      try {
        const payload = {
          address: suggestion.value,
          geo_lat: suggestion.data.geo_lat,
          geo_lon: suggestion.data.geo_lon,
          beltway_hit: cleanData.beltway_hit ?? null,
          beltway_distance: cleanData.beltway_distance ?? null,
          zone_result: info,
        }
        window.localStorage.setItem(LAST_ADDRESS_KEY, JSON.stringify(payload))
      } catch {}
    } catch {
      /* ignore network errors */
    }

    // Step 5: Close editing AFTER full chain completes (prevents /shop reset)
    setLoading(false)
    setEditing(false)
  }, [setZone, markUnavailable])

  // Clear address everywhere
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      clearDelivery()
      try {
        window.localStorage.removeItem(LAST_ADDRESS_KEY)
      } catch {}
    },
    [clearDelivery],
  )

  // ── Editing: AddressInput styled as FLEUR pill ──
  if (editing) {
    return (
      <div ref={containerRef} className={cn('relative', compact ? 'w-[200px]' : 'w-[320px]')}>
        <AddressInput
          value={addressValue}
          onChange={setAddressValue}
          onSelect={handleAddressSelect}
          placeholder="Улица и дом..."
          variant="compact"
          onClose={() => setEditing(false)}
          autoFocus
        />
        {loading && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#e8b4b8] border-t-transparent" />
          </div>
        )}
      </div>
    )
  }

  // ── Display: address pill with clear button ──
  if (hasAddress && zone) {
    const addr =
      (zone.address || '').replace(/^г\s*Москва,?\s*/i, '').replace(/^Москва,?\s*/i, '').trim() ||
      zone.address
    const time = zone.estimatedTime || DEFAULT_DELIVERY_TIME
    const price =
      zone.freeFrom != null && zone.price3h === 0
        ? 'Бесплатно'
        : `${zone.price3h?.toLocaleString('ru-RU')} ₽`

    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            setAddressValue('')
            setEditing(true)
          }}
          className={cn(
            'flex items-center gap-2 rounded-full bg-[#f3ede7] px-4 transition-colors hover:bg-[#ebe5de]',
            compact ? 'h-7' : 'h-8',
          )}
        >
          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#e8b4b8]" strokeWidth={1.5} />
          <span
            className={cn(
              'font-sans font-medium text-[#2d2d2d] truncate',
              compact ? 'max-w-[100px] text-[11px]' : 'max-w-[160px] text-[12px]',
            )}
          >
            {addr}
          </span>
          <span
            className={cn(
              'font-sans text-[#999] whitespace-nowrap',
              compact ? 'text-[10px]' : 'text-[11px]',
            )}
          >
            · {time} · {price}
          </span>
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="p-1 text-[#b0a99e] transition-colors hover:text-[#2d2d2d]"
          aria-label="Очистить адрес"
        >
          <X className="h-3 w-3" strokeWidth={2} />
        </button>
      </div>
    )
  }

  // ── CTA: no address selected ──
  return (
    <button
      type="button"
      onClick={() => {
        setAddressValue('')
        setEditing(true)
      }}
      className={cn(
        'flex items-center gap-2 rounded-full bg-[#f3ede7] px-4 transition-colors hover:bg-[#ebe5de]',
        compact ? 'h-7' : 'h-8',
      )}
    >
      <MapPin className="h-3.5 w-3.5 text-[#2d2d2d]" strokeWidth={1.5} />
      <span
        className={cn(
          'font-sans font-medium text-[#2d2d2d]',
          compact ? 'text-[11px]' : 'text-[12px]',
        )}
      >
        {compact ? 'Укажите адрес' : 'Укажите адрес доставки'}
      </span>
    </button>
  )
}

// ─── Shop Context Bar ────────────────────────────────────────────────────────

function ShopContextBar({ zone, hasAddress }: { zone: any; hasAddress: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchVal, setSearchVal] = useState(searchParams?.get('q') || '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const activeCategory = searchParams?.get('category') || ''

  // Read active filters from URL
  const activeSort = searchParams?.get('sort') || ''
  const activePriceMin = searchParams?.get('priceMin') || ''
  const activePriceMax = searchParams?.get('priceMax') || ''
  const activeOccasion = searchParams?.get('occasion') || ''
  const activeColor = searchParams?.get('color') || ''
  const activeRecipient = searchParams?.get('recipient') || ''

  const activeFilterCount = [activeSort, activePriceMin, activeOccasion, activeColor, activeRecipient].filter(Boolean).length

  useEffect(() => { setSearchVal(searchParams?.get('q') || '') }, [searchParams])

  // Close filters on outside click — exclude both panel AND button to prevent toggle race
  useEffect(() => {
    if (!filtersOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        panelRef.current && !panelRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setFiltersOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [filtersOpen])

  const pushSearch = useCallback((q: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (q.trim()) params.set('q', q.trim()); else params.delete('q')
    router.push(createUrl('/shop', params), { scroll: false })
  }, [router, searchParams])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setSearchVal(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => pushSearch(v), 300)
  }, [pushSearch])

  // Toggle a single-value filter param
  const toggleFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (params.get(key) === value) {
      params.delete(key)
    } else if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(createUrl('/shop', params), { scroll: false })
  }, [router, searchParams])

  // Toggle a price range (sets both priceMin + priceMax)
  const togglePriceRange = useCallback((min: number, max: number | null) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (activePriceMin === String(min)) {
      params.delete('priceMin')
      params.delete('priceMax')
    } else {
      params.set('priceMin', String(min))
      if (max !== null) params.set('priceMax', String(max)); else params.delete('priceMax')
    }
    router.push(createUrl('/shop', params), { scroll: false })
  }, [router, searchParams, activePriceMin])

  // Clear all filters (keep search query and category)
  const clearFilters = useCallback(() => {
    const params = new URLSearchParams()
    const q = searchParams?.get('q')
    const cat = searchParams?.get('category')
    if (q) params.set('q', q)
    if (cat) params.set('category', cat)
    router.push(createUrl('/shop', params), { scroll: false })
    setFiltersOpen(false)
  }, [router, searchParams])

  return (
    <div className="relative w-full">
      <div className="flex w-full items-center gap-4">
        {/* Search */}
        <div className="relative w-[220px] shrink-0">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#b0a99e]" strokeWidth={1.5} />
          <input type="text" value={searchVal} onChange={handleSearchChange}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (debounceRef.current) clearTimeout(debounceRef.current); pushSearch(searchVal) } }}
            placeholder="Поиск букетов..."
            className="h-8 w-full rounded-[20px] border border-black/[0.08] bg-transparent pl-9 pr-3 font-sans text-[12px] text-[#2d2d2d] placeholder:text-[#b0a99e] focus:border-[#e8b4b8] focus:outline-none transition-colors"
          />
        </div>

        <div className="h-6 w-px bg-black/[0.08]" />

        {/* Filters toggle */}
        <button
          ref={buttonRef}
          onClick={() => setFiltersOpen((v) => !v)}
          className={cn(
            'relative flex shrink-0 items-center gap-1.5 rounded-[20px] border px-3.5 py-1 font-sans text-[11px] font-medium transition-all',
            filtersOpen || activeFilterCount > 0
              ? 'border-[#e8b4b8] text-[#e8b4b8]'
              : 'border-black/[0.08] text-[#5a5a5a] hover:border-[#e8b4b8] hover:text-[#e8b4b8]',
          )}
        >
          <SlidersHorizontal className="h-3 w-3" strokeWidth={1.5} />
          Фильтры
          {activeFilterCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e8b4b8] px-1 text-[9px] font-semibold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className="h-6 w-px bg-black/[0.08]" />

        {/* Categories */}
        <div className="flex items-center gap-1.5">
          {shopCategoryLinks.map((cat) => {
            const isActive = cat.slug === activeCategory || (cat.slug === '' && !activeCategory)
            return (
              <Link key={cat.slug} href={cat.href}
                className={cn(
                  'rounded-full px-3.5 py-1 font-sans text-[12px] font-medium transition-all whitespace-nowrap',
                  isActive ? 'bg-[#2d2d2d] text-[#faf5f0]' : 'border border-black/[0.08] text-[#5a5a5a] hover:border-[#e8b4b8] hover:text-[#e8b4b8]',
                )}>
                {cat.label}
              </Link>
            )
          })}
        </div>

        <div className="flex-1" />

        {/* Compact address */}
        <div className="shrink-0">
          <InlineAddressWidget zone={zone} hasAddress={hasAddress} compact />
        </div>
      </div>

      {/* ── Filters panel ── */}
      {filtersOpen && (
        <div
          ref={panelRef}
          className="absolute left-0 right-0 top-full z-[39] border-b border-black/[0.06] bg-white px-8 py-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
        >
          <div className="mx-auto max-w-7xl space-y-3.5">
            {/* Sort */}
            <div className="flex items-start gap-3">
              <span className="w-[80px] shrink-0 pt-1 font-sans text-[11px] font-medium text-[#999]">Сортировка</span>
              <div className="flex flex-wrap gap-1.5">
                {sorting.map((s) => (
                  <button
                    key={s.title}
                    onClick={() => toggleFilter('sort', s.slug || '')}
                    className={cn(
                      'rounded-full border px-3 py-1 font-sans text-[11px] transition-all',
                      activeSort === (s.slug || '')
                        ? 'border-[#2d2d2d] bg-[#2d2d2d] text-white'
                        : 'border-[#e8e4de] text-[#5a5a5a] hover:border-[#c9c4be]',
                    )}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="flex items-start gap-3">
              <span className="w-[80px] shrink-0 pt-1 font-sans text-[11px] font-medium text-[#999]">Цена</span>
              <div className="flex flex-wrap gap-1.5">
                {priceRanges.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => togglePriceRange(r.min, r.max)}
                    className={cn(
                      'rounded-full border px-3 py-1 font-sans text-[11px] transition-all',
                      activePriceMin === String(r.min)
                        ? 'border-[#2d2d2d] bg-[#2d2d2d] text-white'
                        : 'border-[#e8e4de] text-[#5a5a5a] hover:border-[#c9c4be]',
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Occasion */}
            <div className="flex items-start gap-3">
              <span className="w-[80px] shrink-0 pt-1 font-sans text-[11px] font-medium text-[#999]">Повод</span>
              <div className="flex flex-wrap gap-1.5">
                {occasions.map((occ) => (
                  <button
                    key={occ}
                    onClick={() => toggleFilter('occasion', activeOccasion === occ ? '' : occ)}
                    className={cn(
                      'rounded-full border px-3 py-1 font-sans text-[11px] transition-all',
                      activeOccasion === occ
                        ? 'border-[#2d2d2d] bg-[#2d2d2d] text-white'
                        : 'border-[#e8e4de] text-[#5a5a5a] hover:border-[#c9c4be]',
                    )}
                  >
                    {occ}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="flex items-start gap-3">
              <span className="w-[80px] shrink-0 pt-1 font-sans text-[11px] font-medium text-[#999]">Цвет</span>
              <div className="flex flex-wrap gap-1.5">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => toggleFilter('color', activeColor === c.value ? '' : c.value)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-3 py-1 font-sans text-[11px] transition-all',
                      activeColor === c.value
                        ? 'border-[#2d2d2d] bg-[#2d2d2d] text-white'
                        : 'border-[#e8e4de] text-[#5a5a5a] hover:border-[#c9c4be]',
                    )}
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full border border-white/20"
                      style={{ background: c.hex }}
                    />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient */}
            <div className="flex items-start gap-3">
              <span className="w-[80px] shrink-0 pt-1 font-sans text-[11px] font-medium text-[#999]">Для кого</span>
              <div className="flex flex-wrap gap-1.5">
                {recipients.map((rec) => (
                  <button
                    key={rec}
                    onClick={() => toggleFilter('recipient', activeRecipient === rec ? '' : rec)}
                    className={cn(
                      'rounded-full border px-3 py-1 font-sans text-[11px] transition-all',
                      activeRecipient === rec
                        ? 'border-[#2d2d2d] bg-[#2d2d2d] text-white'
                        : 'border-[#e8e4de] text-[#5a5a5a] hover:border-[#c9c4be]',
                    )}
                  >
                    {rec}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear all */}
            {activeFilterCount > 0 && (
              <div className="flex justify-end border-t border-[#e8e4de]/50 pt-3">
                <button
                  onClick={clearFilters}
                  className="font-sans text-[11px] text-[#999] transition-colors hover:text-[#2d2d2d]"
                >
                  Сбросить все фильтры
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
