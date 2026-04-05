import type { Metadata } from 'next'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import {
  Star,
  Camera,
  MessageCircle,
  ShieldCheck,
  Phone,
  Send,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

const serviceCards = [
  {
    icon: Star,
    title: 'Удобный сайт',
    description: 'Оформление заказа не более чем за 1 минуту.',
  },
  {
    icon: Camera,
    title: 'Точное соответствие',
    description: 'Каждый букет соответствует фотографиям на нашем сайте.',
  },
  {
    icon: MessageCircle,
    title: 'Быстрый ответ',
    description: 'На связи с 9 до 21 в WhatsApp и Telegram. Отвечаем не дольше 2 мин.',
  },
  {
    icon: ShieldCheck,
    title: 'Проверка качества',
    description: 'Двойная проверка на свежесть и качество цветов перед отправкой.',
  },
  {
    icon: Phone,
    title: 'Фото перед доставкой',
    description: 'Передаём заказы в доставку только после одобрения фотографий собранных букетов.',
  },
]

const galleryImages = [
  { alt: 'Букеты FLEUR', bg: 'from-[#e8b4b8]/20 to-[#faf5f0]' },
  { alt: 'Мастерская FLEUR', bg: 'from-[#b5c7a3]/20 to-[#faf5f0]' },
  { alt: 'Авторский букет', bg: 'from-[#f0c987]/20 to-[#faf5f0]' },
  { alt: 'Доставка цветов', bg: 'from-[#e8b4b8]/10 to-[#f0ebe3]' },
  { alt: 'Цветочная композиция', bg: 'from-[#b5c7a3]/10 to-[#f0ebe3]' },
  { alt: 'Упаковка букета', bg: 'from-[#e8b4b8]/15 to-[#faf5f0]' },
]

export default function AboutPage() {
  return (
    <div className="min-h-[60vh]">
      {/* Breadcrumbs + Title */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Breadcrumbs
          items={[
            { label: 'Главная', href: '/' },
            { label: 'О нас' },
          ]}
        />
        <h1 className="font-serif text-3xl sm:text-4xl text-[#2d2d2d] mb-10">О нас</h1>
      </div>

      {/* Hero: Photo + Story */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Photo placeholder */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#f0ebe3] to-[#e8e4de] aspect-[4/3]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="font-serif text-6xl text-[#e8b4b8]/30 mb-2">FLEUR</div>
                <p className="text-sm text-[#8a8a8a]">Фото команды</p>
              </div>
            </div>
          </div>

          {/* Story */}
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#2d2d2d] mb-6 uppercase tracking-wide">
              Любовь с первого букета
            </h2>
            <div className="space-y-4 text-[#5a5a5a] font-sans text-[15px] leading-relaxed">
              <p>
                Мы открыли нашу мастерскую с одной мечтой — дарить людям качественные авторские
                букеты, создавая атмосферу праздника в каждой доставке.
              </p>
              <p>
                Сегодня у нас большая команда и тысячи доставляемых букетов ежемесячно, но наши
                ценности остаются прежними —
              </p>
              <p className="text-[#2d2d2d] font-medium italic">
                качество, изысканность и безупречный сервис.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[#e8e4de]">
              <p className="font-sans text-sm text-[#8a8a8a] mb-3">Наша история</p>
              <p className="font-sans text-sm text-[#5a5a5a] leading-relaxed">
                Узнайте больше о нашем пути, ценностях и команде в нашем Telegram-канале.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Service Cards */}
      <div className="bg-[#f5f0eb]/50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl sm:text-3xl text-[#2d2d2d] mb-10">
            Мы за высокий сервис и технологии
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {serviceCards.map((card) => {
              const Icon = card.icon
              return (
                <div
                  key={card.title}
                  className="rounded-xl border border-[#e8e4de] bg-white p-5 hover:shadow-md transition-shadow duration-300"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#faf5f0] flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-[#e8b4b8]" />
                  </div>
                  <h3 className="font-sans font-medium text-[#2d2d2d] text-sm mb-2">
                    {card.title}
                  </h3>
                  <p className="text-[13px] text-[#8a8a8a] leading-relaxed">{card.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mission */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#2d2d2d] mb-6">
              Наша главная цель и миссия
            </h2>
            <div className="space-y-4 text-[#5a5a5a] font-sans text-[15px] leading-relaxed">
              <p>
                Создание лучшего сервиса доставки цветов и подарков с доставкой от 120 минут после
                оформления заказа.
              </p>
              <p>
                Мы хотим создать сеть цветочных мастерских с одинаковым уровнем обслуживания,
                удобным сайтом и быстрой доставкой букетов в любую точку города.
              </p>
              <p>
                Мы рады хорошим отзывам и благодаря вашей обратной связи постоянно становимся лучше.
              </p>
              <p>
                С самого начала проекта мы открыто рассказываем о своих успехах, промахах и работе
                над ошибками.
              </p>
            </div>
          </div>

          {/* Bouquet photo placeholder */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#fdf0f0] to-[#f0ebe3] aspect-[3/4] max-h-[480px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
                  <span className="font-serif text-2xl text-[#e8b4b8]">F</span>
                </div>
                <p className="text-sm text-[#8a8a8a]">Авторский букет</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Gallery */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <h2 className="font-serif text-2xl sm:text-3xl text-[#2d2d2d] mb-8">Фотографии</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {galleryImages.map((img, idx) => (
            <div
              key={idx}
              className={`relative rounded-xl overflow-hidden bg-gradient-to-br ${img.bg} aspect-square hover:scale-[1.02] transition-transform duration-300`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xs text-[#8a8a8a]/60 font-sans">{img.alt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Telegram CTA */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-2xl bg-gradient-to-r from-[#f5f0eb] to-[#fdf0f0] border border-[#e8e4de] p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="font-serif text-xl sm:text-2xl text-[#2d2d2d] mb-2">
              Больше о жизни мастерской можно узнать из нашего{' '}
              <span className="text-[#e8b4b8]">Telegram</span> канала.
            </h3>
          </div>
          <Link
            href="https://t.me/fleur_flowers"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#2d2d2d] text-white rounded-xl px-6 py-3.5 font-sans text-sm hover:bg-[#1a1a1a] transition-colors group shrink-0"
          >
            <Send className="h-4 w-4" />
            Telegram канал
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  title: 'О нас — FLEUR',
  description:
    'FLEUR — премиальная доставка цветов в Москве. Узнайте нашу историю, ценности и миссию.',
  openGraph: mergeOpenGraph({
    title: 'О нас — FLEUR',
    url: '/about',
  }),
}
