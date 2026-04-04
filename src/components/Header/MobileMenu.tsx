'use client'

import type { Header } from '@/payload-types'

import { Search, Heart, User, X, MapPin, Phone, Clock } from 'lucide-react'
import { Menu } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utilities/cn'
import { useAuth } from '@/providers/Auth'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

interface Props {
  menu: Header['navItems']
}

export function MobileMenu({ menu }: Props) {
  const { user } = useAuth()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  // Close on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname, searchParams])

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="-ml-2 p-2 text-[#2d2d2d] transition-colors hover:text-[#5a5a5a]"
        aria-label="Открыть меню"
      >
        <Menu className="h-5 w-5" strokeWidth={1.5} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 bg-black/20 lg:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed bottom-0 left-0 top-0 z-50 w-[300px] overflow-y-auto bg-[#faf5f0] lg:hidden"
            >
              {/* Drawer Header */}
              <div className="flex h-16 items-center justify-between border-b border-[#e8e4de] px-6">
                <span className="font-serif text-[20px] uppercase tracking-[0.2em] text-[#2d2d2d]">
                  Fleur
                </span>
                <button
                  onClick={() => setIsOpen(false)}
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

              {/* Navigation Links */}
              <nav className="py-4">
                <ul>
                  {menu?.map((item) => {
                    const href =
                      item.link.type === 'reference' &&
                      typeof item.link.reference?.value === 'object' &&
                      item.link.reference.value.slug
                        ? `/${item.link.reference.value.slug}`
                        : item.link.url || '#'

                    const isActive =
                      href !== '#' && href !== '/' ? pathname.startsWith(href) : pathname === href

                    return (
                      <li key={item.id}>
                        <Link
                          href={href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            'block px-6 py-3 font-sans text-[14px] uppercase tracking-[0.08em] text-[#5a5a5a] transition-colors hover:bg-[#f0ebe3] hover:text-[#2d2d2d]',
                            isActive && 'bg-[#f0ebe3] text-[#2d2d2d]',
                          )}
                        >
                          {item.link.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>

              {/* Account Links */}
              <div className="border-t border-[#e8e4de] py-4">
                {user ? (
                  <>
                    <Link
                      href="/orders"
                      className="flex items-center gap-3 px-6 py-3 font-sans text-[14px] text-[#5a5a5a] transition-colors hover:bg-[#f0ebe3] hover:text-[#2d2d2d]"
                    >
                      <User className="h-4 w-4" strokeWidth={1.5} />
                      <span>Мои заказы</span>
                    </Link>
                    <Link
                      href="/account"
                      className="flex items-center gap-3 px-6 py-3 font-sans text-[14px] text-[#5a5a5a] transition-colors hover:bg-[#f0ebe3] hover:text-[#2d2d2d]"
                    >
                      <Heart className="h-4 w-4" strokeWidth={1.5} />
                      <span>Аккаунт</span>
                    </Link>
                    <Link
                      href="/logout"
                      className="flex items-center gap-3 px-6 py-3 font-sans text-[14px] text-[#5a5a5a] transition-colors hover:bg-[#f0ebe3] hover:text-[#2d2d2d]"
                    >
                      <span className="ml-7">Выйти</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="flex items-center gap-3 px-6 py-3 font-sans text-[14px] text-[#5a5a5a] transition-colors hover:bg-[#f0ebe3] hover:text-[#2d2d2d]"
                    >
                      <User className="h-4 w-4" strokeWidth={1.5} />
                      <span>Войти</span>
                    </Link>
                    <Link
                      href="/create-account"
                      className="flex items-center gap-3 px-6 py-3 font-sans text-[14px] text-[#5a5a5a] transition-colors hover:bg-[#f0ebe3] hover:text-[#2d2d2d]"
                    >
                      <Heart className="h-4 w-4" strokeWidth={1.5} />
                      <span>Регистрация</span>
                    </Link>
                  </>
                )}
              </div>

              {/* Contact Info */}
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
        )}
      </AnimatePresence>
    </>
  )
}
