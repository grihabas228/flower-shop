'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  User,
  ShoppingBag,
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
import { Cart } from '@/components/Cart'
import { AuthModal } from '@/components/AuthModal'
import { useAuth } from '@/providers/Auth'
import { DeliveryAddressBar } from '@/components/DeliveryAddressBar'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { Suspense } from 'react'

import { MobileMenu } from './MobileMenu'
import type { Header } from 'src/payload-types'

const defaultNavLinks = [
  { label: 'Букеты', href: '/shop?category=bukety' },
  { label: 'Розы', href: '/shop?category=rozy' },
  { label: 'Композиции', href: '/shop?category=kompozicii' },
  { label: 'Подарки', href: '/shop?category=podarki' },
  { label: 'Акции', href: '/shop' },
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

// Fixed heights — desktop
const DESKTOP_INFO_BAR_H = 32
const DESKTOP_MAIN_BAR_H = 70
const DESKTOP_NAV_BAR_H = 48
const DESKTOP_HEADER_FULL_H = DESKTOP_INFO_BAR_H + DESKTOP_MAIN_BAR_H + DESKTOP_NAV_BAR_H

type Props = {
  header: Header
}

export function HeaderClient({ header }: Props) {
  const navLinks = defaultNavLinks
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // Desktop: collapse top info bar on scroll
  const [isScrolled, setIsScrolled] = useState(false)

  const isShopPage = pathname === '/shop' || pathname.startsWith('/shop?')

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

  // Desktop scroll listener only
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
      <div className="fixed top-0 left-0 right-0 z-50 lg:hidden">
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
          DESKTOP HEADER (≥ lg) — UNCHANGED
          ═══════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 hidden lg:block bg-[#faf5f0] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <AnimatePresence>
          {!isScrolled && (
            <motion.div
              initial={{ height: DESKTOP_INFO_BAR_H, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden bg-[#f0ebe3]"
            >
              <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 font-sans text-[12px] tracking-wide text-[#5a5a5a]">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" strokeWidth={1.5} />
                  <span>Москва</span>
                </div>
                <span className="text-[#6b6b6b]">Бесплатная доставка от 5 000 &#8381;</span>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" strokeWidth={1.5} />
                    <span>Доставка с 8:00 до 22:00</span>
                  </div>
                  <a
                    href="tel:+74951234567"
                    className="flex items-center gap-1.5 transition-colors hover:text-[#2d2d2d]"
                  >
                    <Phone className="h-3 w-3" strokeWidth={1.5} />
                    <span>+7 (495) 123-45-67</span>
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="border-b border-[#e8e4de]/50 bg-[#faf5f0]">
          <div className="mx-auto max-w-7xl px-4">
            <div
              className={cn(
                'flex items-center justify-between transition-all duration-300',
                isScrolled ? 'h-14' : 'h-[70px]',
              )}
            >
              <motion.div
                animate={{ fontSize: isScrolled ? '20px' : '26px' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <Link
                  href="/"
                  className="font-serif uppercase tracking-[0.2em] text-[#2d2d2d]"
                  style={{ fontSize: 'inherit' }}
                >
                  Fleur
                </Link>
              </motion.div>

              <div className="mx-12 max-w-[400px] flex-1">
                <div className="group relative w-full">
                  <input
                    type="text"
                    placeholder="Найти букет..."
                    className="h-10 w-full rounded-full border border-[#e8e4de] bg-transparent pl-4 pr-10 font-sans text-sm text-[#2d2d2d] transition-colors placeholder:text-[#9a9a9a] focus:border-[#c9c4be] focus:outline-none"
                  />
                  <Search
                    className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9a9a] transition-colors group-focus-within:text-[#5a5a5a]"
                    strokeWidth={1.5}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleAccountClick}
                  className="p-2 text-[#2d2d2d] transition-colors hover:text-[#5a5a5a] cursor-pointer"
                  aria-label="Аккаунт"
                >
                  <User className="h-5 w-5" strokeWidth={1.5} />
                </button>
                <Suspense
                  fallback={
                    <button className="relative p-2 text-[#2d2d2d]" aria-label="Корзина">
                      <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
                    </button>
                  }
                >
                  <Cart />
                </Suspense>
              </div>
            </div>
          </div>
        </div>

        <nav className="border-b border-[#e8e4de]/30 bg-[#faf5f0]">
          <div className="mx-auto max-w-7xl px-4">
            <ul className="flex h-12 items-center justify-center gap-10">
              {navLinks.map((link) => {
                const isActive =
                  link.href !== '#' && link.href !== '/'
                    ? pathname.startsWith(link.href.split('?')[0]!)
                    : pathname === link.href

                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        'relative py-1 font-sans text-[13px] uppercase tracking-[0.08em] text-[#5a5a5a] transition-colors hover:text-[#2d2d2d]',
                        isActive && 'text-[#2d2d2d]',
                      )}
                    >
                      {link.label}
                      {isActive && (
                        <motion.span
                          layoutId="nav-underline"
                          className="absolute bottom-0 left-0 right-0 h-px bg-[#2d2d2d]"
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>
      </header>

      {/* Desktop spacer */}
      <div
        className="hidden lg:block transition-all duration-300"
        style={{ height: isScrolled ? 110 : DESKTOP_HEADER_FULL_H }}
      />

      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}
