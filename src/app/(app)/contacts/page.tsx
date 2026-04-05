import type { Metadata } from 'next'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ContactForm } from '@/components/Contacts/ContactForm'
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageCircle,
} from 'lucide-react'
import Link from 'next/link'

const contactInfo = [
  {
    icon: Phone,
    label: 'Телефон',
    value: '+7 (495) 123-45-67',
    href: 'tel:+74951234567',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'info@fleur.ru',
    href: 'mailto:info@fleur.ru',
  },
  {
    icon: MapPin,
    label: 'Адрес',
    value: 'Москва, ул. Цветочная, д. 12',
    href: undefined,
  },
  {
    icon: Clock,
    label: 'Часы работы',
    value: 'Ежедневно с 9:00 до 21:00',
    href: undefined,
  },
]

const messengers = [
  {
    name: 'Telegram',
    icon: Send,
    href: 'https://t.me/fleur_flowers',
    color: 'hover:bg-[#e8f4fd] hover:text-[#2aabee] hover:border-[#2aabee]/20',
  },
  {
    name: 'WhatsApp',
    icon: MessageCircle,
    href: 'https://wa.me/74951234567',
    color: 'hover:bg-[#e8f8e8] hover:text-[#25d366] hover:border-[#25d366]/20',
  },
  {
    name: 'Instagram',
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
    href: 'https://instagram.com/fleur_flowers',
    color: 'hover:bg-[#fdf0f7] hover:text-[#e4405f] hover:border-[#e4405f]/20',
  },
]

export default function ContactsPage() {
  return (
    <div className="min-h-[60vh]">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Breadcrumbs
          items={[
            { label: 'Главная', href: '/' },
            { label: 'Контакты' },
          ]}
        />
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.5rem] text-[#2d2d2d] mb-10">
          Контакты
        </h1>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Left: Contact Info + Messengers */}
          <div>
            {/* Contact Details */}
            <div className="space-y-6 mb-10">
              {contactInfo.map((item) => {
                const Icon = item.icon
                const content = (
                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-lg bg-[#faf5f0] border border-[#e8e4de] flex items-center justify-center shrink-0 group-hover:border-[#e8b4b8]/30 transition-colors">
                      <Icon className="h-5 w-5 text-[#e8b4b8]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#8a8a8a] font-sans uppercase tracking-wide mb-0.5">
                        {item.label}
                      </p>
                      <p className="font-sans text-[#2d2d2d] group-hover:text-[#e8b4b8] transition-colors">
                        {item.value}
                      </p>
                    </div>
                  </div>
                )

                return item.href ? (
                  <Link key={item.label} href={item.href} className="block">
                    {content}
                  </Link>
                ) : (
                  <div key={item.label}>{content}</div>
                )
              })}
            </div>

            {/* Messengers */}
            <div className="mb-10">
              <h3 className="font-sans text-sm text-[#8a8a8a] uppercase tracking-wide mb-4">
                Мессенджеры
              </h3>
              <div className="flex gap-3">
                {messengers.map((messenger) => {
                  const Icon = messenger.icon
                  return (
                    <Link
                      key={messenger.name}
                      href={messenger.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[#e8e4de] text-[#5a5a5a] text-sm font-sans transition-all duration-200 ${messenger.color}`}
                    >
                      <Icon />
                      {messenger.name}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="rounded-2xl overflow-hidden border border-[#e8e4de] bg-[#f0ebe3] aspect-[16/9] relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <MapPin className="h-8 w-8 text-[#e8b4b8] mb-2" />
                <p className="font-sans text-sm text-[#8a8a8a]">Яндекс Карта</p>
                <p className="font-sans text-xs text-[#c9c4be] mt-1">
                  Москва, ул. Цветочная, д. 12
                </p>
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div>
            <div className="rounded-2xl border border-[#e8e4de] bg-white p-6 sm:p-8 sticky top-32">
              <h2 className="font-serif text-xl sm:text-2xl text-[#2d2d2d] mb-2">
                Обратная связь
              </h2>
              <p className="font-sans text-sm text-[#8a8a8a] mb-6">
                Напишите нам, и мы ответим в ближайшее время
              </p>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Контакты — FLEUR',
  description:
    'Свяжитесь с нами: телефон, email, мессенджеры. Адрес мастерской FLEUR в Москве.',
  openGraph: mergeOpenGraph({
    title: 'Контакты — FLEUR',
    url: '/contacts',
  }),
}
