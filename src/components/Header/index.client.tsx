'use client'

import { useState, useEffect } from 'react'
import { Search, Heart, User, ShoppingBag, MapPin, Phone, Clock, Menu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utilities/cn'
import { Cart } from '@/components/Cart'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { Suspense } from 'react'

import { MobileMenu } from './MobileMenu'
import type { Header } from 'src/payload-types'

const defaultNavLinks = [
  { label: 'Букеты', href: '/bukety' },
  { label: 'Розы', href: '/rozy' },
  { label: 'Композиции', href: '/kompozicii' },
  { label: 'Подарки', href: '/podarki' },
  { label: 'Акции', href: '/akcii' },
  { label: 'О нас', href: '/about' },
  { label: 'Доставка', href: '/delivery' },
]

type NavLink = { label: string; href: string }

type Props = {
  header: Header
}

export function HeaderClient({ header }: Props) {
  const navLinks = defaultNavLinks
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        {/* Top Info Bar */}
        <AnimatePresence>
          {!isScrolled && (
            <motion.div
              initial={{ height: 32, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden bg-[#f0ebe3]"
            >
              <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 font-sans text-[12px] tracking-wide text-[#5a5a5a]">
                <div className="hidden items-center gap-1.5 md:flex">
                  <MapPin className="h-3 w-3" strokeWidth={1.5} />
                  <span>Москва</span>
                </div>

                <div className="flex-1 text-center md:flex-none">
                  <span className="text-[#6b6b6b]">Бесплатная доставка от 5 000 &#8381;</span>
                </div>

                <div className="hidden items-center gap-6 md:flex">
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

        {/* Main Header */}
        <motion.div
          animate={{ backgroundColor: '#faf5f0' }}
          transition={{ duration: 0.3 }}
          className="border-b border-[#e8e4de]/50"
        >
          <div className="mx-auto max-w-7xl px-4">
            <div
              className={cn(
                'flex items-center justify-between transition-all duration-300',
                isScrolled ? 'h-14' : 'h-[70px]',
              )}
            >
              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <Suspense fallback={null}>
                  <MobileMenu navLinks={navLinks} />
                </Suspense>
              </div>

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

              {/* Search Bar - Desktop */}
              <div className="mx-12 hidden max-w-[400px] flex-1 lg:flex">
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
              <div className="flex items-center gap-1 sm:gap-4">
                <button
                  className="p-2 text-[#2d2d2d] transition-colors hover:text-[#5a5a5a] lg:hidden"
                  aria-label="Поиск"
                >
                  <Search className="h-5 w-5" strokeWidth={1.5} />
                </button>

                <Link
                  href="/account"
                  className="hidden p-2 text-[#2d2d2d] transition-colors hover:text-[#5a5a5a] sm:block"
                  aria-label="Аккаунт"
                >
                  <User className="h-5 w-5" strokeWidth={1.5} />
                </Link>

                {/* Cart */}
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
        </motion.div>

        {/* Navigation Bar - Desktop */}
        <nav className="hidden border-b border-[#e8e4de]/30 bg-[#faf5f0] lg:block">
          <div className="mx-auto max-w-7xl px-4">
            <ul className="flex h-12 items-center justify-center gap-10">
              {navLinks.map((link) => {
                const isActive =
                  link.href !== '#' && link.href !== '/'
                    ? pathname.startsWith(link.href)
                    : pathname === link.href

                return (
                  <li key={link.id || link.href}>
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

      {/* Spacer */}
      <div
        className={cn(
          'transition-all duration-300',
          isScrolled ? 'h-[66px]' : 'h-[114px] lg:h-[162px]',
        )}
      />
    </>
  )
}
