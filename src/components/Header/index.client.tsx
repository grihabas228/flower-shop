'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, User, ShoppingBag, MapPin, Phone, Clock, X } from 'lucide-react'
import { MOBILE_SCROLL_ID } from '@/components/MobileScrollContainer'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utilities/cn'
import { Cart } from '@/components/Cart'
import { AuthModal } from '@/components/AuthModal'
import { useAuth } from '@/providers/Auth'
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

// Fixed heights so nothing ever shifts
const MOBILE_HEADER_H = 56 // px — fixed on mobile
const DESKTOP_INFO_BAR_H = 32
const DESKTOP_MAIN_BAR_H = 70
const DESKTOP_NAV_BAR_H = 48
const DESKTOP_HEADER_FULL_H = DESKTOP_INFO_BAR_H + DESKTOP_MAIN_BAR_H + DESKTOP_NAV_BAR_H // 150

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

  // Mobile: hide header on scroll down, show on scroll up
  const [mobileHidden, setMobileHidden] = useState(false)
  const lastScrollY = useRef(0)
  const scrollThreshold = 10 // px — avoid jitter on small scrolls

  const handleAccountClick = () => {
    if (user) {
      router.push('/account')
    } else {
      setShowAuthModal(true)
    }
  }

  useEffect(() => {
    let ticking = false

    // Desktop: listen on window (body scrolls normally)
    const onWindowScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 50)
        ticking = false
      })
    }

    // Mobile: listen on the inner scroll container (body is overflow:hidden)
    const onContainerScroll = (e: Event) => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const el = e.target as HTMLElement
        const y = el.scrollTop

        if (y > MOBILE_HEADER_H) {
          const delta = y - lastScrollY.current
          if (delta > scrollThreshold) {
            setMobileHidden(true) // scrolling down
          } else if (delta < -scrollThreshold) {
            setMobileHidden(false) // scrolling up
          }
        } else {
          setMobileHidden(false) // at top
        }

        lastScrollY.current = y
        ticking = false
      })
    }

    window.addEventListener('scroll', onWindowScroll, { passive: true })

    const container = document.getElementById(MOBILE_SCROLL_ID)
    container?.addEventListener('scroll', onContainerScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onWindowScroll)
      container?.removeEventListener('scroll', onContainerScroll)
    }
  }, [])

  // Close search on route change
  useEffect(() => {
    setSearchOpen(false)
  }, [pathname])

  return (
    <>
      {/* ═══════ MOBILE HEADER (< lg) ═══════ */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 lg:hidden',
          'bg-[#faf5f0] border-b border-[#e8e4de]/50',
          'transition-transform duration-300 ease-in-out',
          mobileHidden ? '-translate-y-full' : 'translate-y-0',
        )}
        style={{ height: MOBILE_HEADER_H }}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
          {/* Burger */}
          <Suspense fallback={null}>
            <MobileMenu navLinks={navLinks} />
          </Suspense>

          {/* Logo */}
          <Link
            href="/"
            className="font-serif text-[20px] uppercase tracking-[0.2em] text-[#2d2d2d]"
          >
            Fleur
          </Link>

          {/* Icons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-[#2d2d2d] transition-colors hover:text-[#5a5a5a]"
              aria-label="Поиск"
            >
              <Search className="h-5 w-5" strokeWidth={1.5} />
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
      </header>

      {/* Mobile spacer — fixed height, never changes */}
      <div className="h-[56px] lg:hidden" />

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

      {/* ═══════ DESKTOP HEADER (≥ lg) ═══════ */}
      <header className="fixed top-0 left-0 right-0 z-50 hidden lg:block bg-[#faf5f0] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        {/* Top Info Bar — collapses on scroll */}
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

        {/* Main Header Bar */}
        <div className="border-b border-[#e8e4de]/50 bg-[#faf5f0]">
          <div className="mx-auto max-w-7xl px-4">
            <div
              className={cn(
                'flex items-center justify-between transition-all duration-300',
                isScrolled ? 'h-14' : 'h-[70px]',
              )}
            >
              {/* Logo */}
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

              {/* Search Bar */}
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

              {/* Icons */}
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

        {/* Navigation Bar */}
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
        className={cn(
          'hidden lg:block transition-all duration-300',
          isScrolled ? 'h-[110px]' : `h-[${DESKTOP_HEADER_FULL_H}px]`,
        )}
        style={{ height: isScrolled ? 110 : DESKTOP_HEADER_FULL_H }}
      />

      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}
