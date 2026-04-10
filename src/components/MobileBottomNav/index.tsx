'use client'

import {
  Heart,
  ShoppingBag,
  User,
  MoreHorizontal,
  Flower2,
  Search,
  X,
  MapPin,
  Phone,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useAuth } from '@/providers/Auth'
import { useFavorites } from '@/providers/FavoritesProvider'
import { AuthModal } from '@/components/AuthModal'
import { cn } from '@/utilities/cn'
import { lockMobileScroll } from '@/utilities/lockMobileScroll'
import { motion, AnimatePresence } from 'framer-motion'
import React, { useMemo, useState, useEffect, Suspense } from 'react'

const menuNavLinks = [
  { label: 'Букеты', href: '/shop?category=bukety' },
  { label: 'Розы', href: '/shop?category=rozy' },
  { label: 'Композиции', href: '/shop?category=kompozicii' },
  { label: 'Подарки', href: '/shop?category=podarki' },
  { label: 'Акции', href: '/shop' },
  { label: 'О нас', href: '/about' },
  { label: 'Доставка', href: '/delivery' },
]

const navItems = [
  { label: 'Букеты', href: '/shop?category=bukety', icon: Flower2 },
  { label: 'Избранное', href: '/favorites', icon: Heart, hasFavoritesBadge: true },
  { label: 'Корзина', href: '/cart', icon: ShoppingBag, hasBadge: true },
  { label: 'Кабинет', href: '/account', icon: User },
]

function BottomNavInner() {
  const pathname = usePathname()
  const router = useRouter()
  const { cart } = useCart()
  const { user } = useAuth()
  const { count: favoritesCount } = useFavorites()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleAccountClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (user) {
      router.push('/account')
    } else {
      setShowAuthModal(true)
    }
  }

  const totalQuantity = useMemo(() => {
    if (!cart?.items?.length) return 0
    return cart.items.reduce((qty, item) => (item.quantity || 0) + qty, 0)
  }, [cart])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-[60] border-t border-[#e8e4de] bg-white/95 backdrop-blur-sm md:hidden safe-bottom-nav">
        <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-2">
          {navItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            const badge = item.hasBadge
              ? totalQuantity
              : item.hasFavoritesBadge
                ? favoritesCount
                : 0
            const isAccount = item.href === '/account'

            const content = (
              <>
                <span className="relative">
                  <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 1.8 : 1.5} />
                  {badge > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e8b4b8] px-1 text-[9px] font-semibold text-white">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    'font-sans text-[11px] leading-tight',
                    active ? 'font-medium' : 'font-normal',
                  )}
                >
                  {item.label}
                </span>
              </>
            )

            if (isAccount) {
              return (
                <button
                  key={item.href}
                  onClick={handleAccountClick}
                  className={cn(
                    'relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer',
                    active ? 'text-[#e8b4b8]' : 'text-[#9a9a9a]',
                  )}
                >
                  {content}
                </button>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors',
                  active ? 'text-[#e8b4b8]' : 'text-[#9a9a9a]',
                )}
              >
                {content}
              </Link>
            )
          })}

          {/* Menu button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[#9a9a9a] transition-colors"
          >
            <MoreHorizontal className="h-[22px] w-[22px]" strokeWidth={1.5} />
            <span className="font-sans text-[11px] font-normal leading-tight">Меню</span>
          </button>
        </div>
      </nav>

      {/* Menu drawer */}
      <AnimatePresence>
        {menuOpen && <MenuDrawer onClose={() => setMenuOpen(false)} />}
      </AnimatePresence>

      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}

export function MobileBottomNav() {
  return (
    <Suspense fallback={null}>
      <BottomNavInner />
    </Suspense>
  )
}

/* ---- Drawer rendered from "Меню" button ---- */

function MenuDrawer({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Close on route change
  useEffect(() => {
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  // Lock scroll and restore position on close
  useEffect(() => {
    return lockMobileScroll()
  }, [])

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[70] bg-black/20"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed bottom-0 left-0 top-0 z-[70] w-[300px] overflow-y-auto bg-[#faf5f0]"
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#e8e4de] px-6">
          <span className="font-serif text-[20px] uppercase tracking-[0.2em] text-[#2d2d2d]">
            Fleur
          </span>
          <button
            onClick={onClose}
            className="-mr-2 p-2 text-[#2d2d2d] transition-colors hover:text-[#5a5a5a]"
            aria-label="Закрыть меню"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-[#e8e4de] p-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Найти букет..."
              className="h-10 w-full rounded-full border border-[#e8e4de] bg-transparent pl-4 pr-10 font-sans text-sm text-[#2d2d2d] transition-colors placeholder:text-[#9a9a9a] focus:border-[#c9c4be] focus:outline-none"
            />
            <Search
              className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9a9a]"
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* Nav links */}
        <nav className="py-4">
          <ul>
            {menuNavLinks.map((link) => {
              const active =
                link.href !== '/' ? pathname.startsWith(link.href) : pathname === link.href

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className={cn(
                      'block px-6 py-3 font-sans text-[14px] uppercase tracking-[0.08em] text-[#5a5a5a] transition-colors hover:bg-[#f0ebe3] hover:text-[#2d2d2d]',
                      active && 'bg-[#f0ebe3] text-[#2d2d2d]',
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Account */}
        <div className="border-t border-[#e8e4de] py-4">
          {user ? (
            <>
              <Link
                href="/orders"
                onClick={onClose}
                className="flex items-center gap-3 px-6 py-3 font-sans text-[14px] text-[#5a5a5a] transition-colors hover:bg-[#f0ebe3] hover:text-[#2d2d2d]"
              >
                <User className="h-4 w-4" strokeWidth={1.5} />
                <span>Мои заказы</span>
              </Link>
              <Link
                href="/account"
                onClick={onClose}
                className="flex items-center gap-3 px-6 py-3 font-sans text-[14px] text-[#5a5a5a] transition-colors hover:bg-[#f0ebe3] hover:text-[#2d2d2d]"
              >
                <Heart className="h-4 w-4" strokeWidth={1.5} />
                <span>Аккаунт</span>
              </Link>
              <Link
                href="/logout"
                onClick={onClose}
                className="flex items-center gap-3 px-6 py-3 font-sans text-[14px] text-[#5a5a5a] transition-colors hover:bg-[#f0ebe3] hover:text-[#2d2d2d]"
              >
                <span className="ml-7">Выйти</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={onClose}
                className="flex items-center gap-3 px-6 py-3 font-sans text-[14px] text-[#5a5a5a] transition-colors hover:bg-[#f0ebe3] hover:text-[#2d2d2d]"
              >
                <User className="h-4 w-4" strokeWidth={1.5} />
                <span>Войти</span>
              </Link>
              <Link
                href="/create-account"
                onClick={onClose}
                className="flex items-center gap-3 px-6 py-3 font-sans text-[14px] text-[#5a5a5a] transition-colors hover:bg-[#f0ebe3] hover:text-[#2d2d2d]"
              >
                <Heart className="h-4 w-4" strokeWidth={1.5} />
                <span>Регистрация</span>
              </Link>
            </>
          )}
        </div>

        {/* Contacts */}
        <div className="space-y-3 border-t border-[#e8e4de] p-6 text-[12px] text-[#6b6b6b]">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>Москва</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>Доставка с 8:00 до 22:00</span>
          </div>
          <a
            href="tel:+74951234567"
            className="flex items-center gap-2 transition-colors hover:text-[#2d2d2d]"
          >
            <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>+7 (495) 123-45-67</span>
          </a>
        </div>
      </motion.div>
    </>
  )
}
