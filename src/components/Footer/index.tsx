import type { Footer as FooterType } from '@/payload-types'

import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'

const catalogLinks = [
  { label: 'Букеты', href: '/bukety' },
  { label: 'Розы', href: '/rozy' },
  { label: 'Композиции', href: '/kompozicii' },
  { label: 'Подарки', href: '/podarki' },
  { label: 'Акции', href: '/akcii' },
]

const contactInfo = [
  { icon: Phone, text: '+7 (495) 123-45-67', isPhone: true },
  { icon: Mail, text: 'info@fleur.ru', isPhone: false },
  { icon: MapPin, text: 'Москва, ул. Цветочная, 1', isPhone: false },
  { icon: Clock, text: 'Ежедневно с 8:00 до 22:00', isPhone: false },
]

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-16.5 7.5a2.25 2.25 0 0 0 .126 4.303l3.2.9.5 5.649a1.5 1.5 0 0 0 2.574.862l2.2-2.2 4.3 3.2a2.25 2.25 0 0 0 3.5-1.5l3-15a2.25 2.25 0 0 0-1.878-2.929z" />
      <path d="m10 14 2-2 6-5" />
    </svg>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </svg>
  )
}

export async function Footer() {
  const footer: FooterType = await getCachedGlobal('footer', 1)()
  const infoLinks = footer.navItems || []

  return (
    <footer className="bg-[#2d2d2d] pb-10 pt-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Main footer content */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-16">
          {/* Column 1 - Brand */}
          <div className="space-y-6">
            <h2 className="font-serif text-2xl tracking-[0.2em] text-[#faf5f0]">FLEUR</h2>
            <p className="text-[13px] leading-relaxed text-[#8a8a8a]">
              Доставка изысканных букетов по Москве с 2020 года
            </p>
          </div>

          {/* Column 2 - Catalog */}
          <div className="space-y-6">
            <h3 className="text-xs uppercase tracking-[0.15em] text-[#8a8a8a]">Каталог</h3>
            <nav className="flex flex-col">
              {catalogLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm leading-[2] text-[#faf5f0] transition-colors duration-200 hover:text-[#e8b4b8]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 3 - Info (from Payload CMS) */}
          <div className="space-y-6">
            <h3 className="text-xs uppercase tracking-[0.15em] text-[#8a8a8a]">Информация</h3>
            <nav className="flex flex-col">
              {infoLinks.length > 0 ? (
                infoLinks.map((item) => {
                  const href =
                    item.link.type === 'reference' &&
                    typeof item.link.reference?.value === 'object' &&
                    item.link.reference.value.slug
                      ? `/${item.link.reference.value.slug}`
                      : item.link.url || '#'

                  return (
                    <Link
                      key={item.id}
                      href={href}
                      className="text-sm leading-[2] text-[#faf5f0] transition-colors duration-200 hover:text-[#e8b4b8]"
                    >
                      {item.link.label}
                    </Link>
                  )
                })
              ) : (
                <>
                  <Link
                    href="/about"
                    className="text-sm leading-[2] text-[#faf5f0] transition-colors duration-200 hover:text-[#e8b4b8]"
                  >
                    О нас
                  </Link>
                  <Link
                    href="/delivery"
                    className="text-sm leading-[2] text-[#faf5f0] transition-colors duration-200 hover:text-[#e8b4b8]"
                  >
                    Доставка и оплата
                  </Link>
                  <Link
                    href="/returns"
                    className="text-sm leading-[2] text-[#faf5f0] transition-colors duration-200 hover:text-[#e8b4b8]"
                  >
                    Возврат
                  </Link>
                  <Link
                    href="/posts"
                    className="text-sm leading-[2] text-[#faf5f0] transition-colors duration-200 hover:text-[#e8b4b8]"
                  >
                    Блог
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Column 4 - Contacts */}
          <div className="space-y-6">
            <h3 className="text-xs uppercase tracking-[0.15em] text-[#8a8a8a]">Контакты</h3>
            <div className="flex flex-col gap-3">
              {contactInfo.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 shrink-0 text-[#8a8a8a]" strokeWidth={1.5} />
                  <span
                    className={`text-[#faf5f0] ${item.isPhone ? 'text-[15px]' : 'text-sm'}`}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Social icons */}
        <div className="mt-16 flex justify-center gap-6">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8a8a8a] transition-colors duration-200 hover:text-[#faf5f0]"
            aria-label="Instagram"
          >
            <InstagramIcon className="h-5 w-5" />
          </a>
          <a
            href="https://t.me"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8a8a8a] transition-colors duration-200 hover:text-[#faf5f0]"
            aria-label="Telegram"
          >
            <TelegramIcon className="h-5 w-5" />
          </a>
          <a
            href="https://wa.me"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8a8a8a] transition-colors duration-200 hover:text-[#faf5f0]"
            aria-label="WhatsApp"
          >
            <WhatsAppIcon className="h-5 w-5" />
          </a>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-white/10 pt-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-xs text-[#8a8a8a]">
              &copy; {new Date().getFullYear()} FLEUR. Все права защищены
            </p>
            <div className="flex items-center gap-4 text-xs text-[#8a8a8a]">
              <Link
                href="/privacy"
                className="transition-colors duration-200 hover:text-[#faf5f0]"
              >
                Политика конфиденциальности
              </Link>
              <span>&middot;</span>
              <Link
                href="/terms"
                className="transition-colors duration-200 hover:text-[#faf5f0]"
              >
                Договор оферты
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
