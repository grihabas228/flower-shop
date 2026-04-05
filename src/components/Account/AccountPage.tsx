'use client'

import React, { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import {
  ChevronDown,
  Copy,
  Check,
  LogOut,
  RefreshCw,
  Package,
  Calendar,
  Settings,
  Gift,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type OrderItemType = {
  id: string
  orderNumber: string
  date: string
  status: 'delivered' | 'processing' | 'cancelled'
  total: number
  items?: { title: string; quantity: number; price: number }[]
}

type AccountPageProps = {
  user: {
    id: string
    email: string
    name?: string
  }
  orders: OrderItemType[]
  bonusPoints?: number
  referralCode?: string
}

const statusLabels: Record<string, { text: string; className: string }> = {
  delivered: { text: 'ДОСТАВЛЕНО', className: 'text-[#b5c7a3]' },
  processing: { text: 'В ОБРАБОТКЕ', className: 'text-[#f0c987]' },
  cancelled: { text: 'ОТМЕНЁН', className: 'text-[#e57373]' },
}

function OrderCard({ order }: { order: OrderItemType }) {
  const [expanded, setExpanded] = useState(false)
  const status = statusLabels[order.status] || statusLabels.processing

  return (
    <div className="rounded-xl border border-[#e8e4de] bg-white p-5 sm:p-6 transition-shadow hover:shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h3 className="font-sans text-base font-medium text-[#2d2d2d]">
              Заказ №{order.orderNumber}
            </h3>
            <span className="font-sans text-sm text-[#8a8a8a]">{order.date}</span>
          </div>
          <span className={`text-xs font-medium tracking-wide uppercase ${status.className}`}>
            {status.text}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-[#e8b4b8] text-[#e8b4b8] hover:bg-[#e8b4b8]/10 hover:text-[#d4949a] self-start sm:self-center"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Повторить заказ
        </Button>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-4 flex items-center gap-2 text-sm text-[#8a8a8a] hover:text-[#2d2d2d] transition-colors cursor-pointer"
      >
        Подробности заказа
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && order.items && (
        <div className="mt-3 border-t border-[#e8e4de] pt-3 space-y-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm text-[#5a5a5a]">
              <span>
                {item.title} x{item.quantity}
              </span>
              <span>{item.price.toLocaleString('ru-RU')} &#8381;</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-end border-t border-[#e8e4de] pt-3">
        <div className="text-sm font-sans">
          <span className="text-[#8a8a8a]">Сумма заказа: </span>
          <span className="font-medium text-[#2d2d2d]">
            {order.total.toLocaleString('ru-RU')} &#8381;
          </span>
        </div>
      </div>
    </div>
  )
}

export function AccountPage({ user, orders, bonusPoints = 0, referralCode }: AccountPageProps) {
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const code = referralCode || 'FLEUR' + user.id.slice(0, 6).toUpperCase()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumbs
        items={[
          { label: 'Главная', href: '/' },
          { label: 'Личный кабинет' },
        ]}
      />

      <h1 className="font-serif text-3xl sm:text-4xl text-[#2d2d2d] mb-8">Личный кабинет</h1>

      {/* Bonuses + Partner Program */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {/* Bonuses */}
        <div className="rounded-xl bg-gradient-to-br from-[#fdf0f0] to-[#faf5f0] border border-[#f0dfe0] p-6 relative overflow-hidden">
          <div className="absolute top-4 right-4 opacity-10">
            <Gift className="h-20 w-20 text-[#e8b4b8]" />
          </div>
          <p className="font-sans text-sm text-[#5a5a5a] mb-2">Ваши бонусы</p>
          <p className="font-serif text-5xl sm:text-6xl text-[#e8b4b8] tracking-tight">
            {bonusPoints.toLocaleString('ru-RU')}
          </p>
        </div>

        {/* Partner Program */}
        <div className="rounded-xl bg-gradient-to-br from-[#f5f0eb] to-[#faf5f0] border border-[#e8e4de] p-6 relative overflow-hidden">
          <div className="absolute top-4 right-4 opacity-10">
            <Users className="h-20 w-20 text-[#b5c7a3]" />
          </div>
          <p className="font-sans text-sm font-medium text-[#2d2d2d] mb-2">
            Партнёрская программа
          </p>
          <p className="font-sans text-sm text-[#5a5a5a] mb-4 leading-relaxed">
            10% скидка вашим друзьям,
            <br />
            10% от их покупок бонусами вам.
          </p>
          <div className="flex items-center gap-2">
            <code className="bg-white/80 border border-[#e8e4de] rounded-lg px-3 py-1.5 text-sm font-mono text-[#2d2d2d] tracking-wide">
              {code}
            </code>
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg bg-white/80 border border-[#e8e4de] hover:bg-white transition-colors cursor-pointer"
              title="Скопировать код"
            >
              {copied ? (
                <Check className="h-4 w-4 text-[#b5c7a3]" />
              ) : (
                <Copy className="h-4 w-4 text-[#8a8a8a]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="orders">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="orders" className="gap-2">
            <Package className="h-4 w-4" />
            История заказов
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            Календарь
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Настройки
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <h2 className="font-serif text-xl sm:text-2xl text-[#2d2d2d] mb-6">
            Ваши прошлые заказы
          </h2>

          {orders.length === 0 ? (
            <div className="rounded-xl border border-[#e8e4de] bg-white p-8 text-center">
              <Package className="h-12 w-12 text-[#e8e4de] mx-auto mb-3" />
              <p className="text-[#8a8a8a] font-sans">У вас пока нет заказов</p>
              <Button asChild className="mt-4 bg-[#e8b4b8] hover:bg-[#d4949a] text-white">
                <Link href="/shop">Перейти в каталог</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <div className="rounded-xl border border-[#e8e4de] bg-white p-8 text-center">
            <Calendar className="h-12 w-12 text-[#e8e4de] mx-auto mb-3" />
            <p className="font-sans text-[#5a5a5a] mb-2">Календарь важных дат</p>
            <p className="font-sans text-sm text-[#8a8a8a]">
              Добавляйте даты рождения и праздники, чтобы мы напомнили вам о подарках
            </p>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            <div className="rounded-xl border border-[#e8e4de] bg-white p-6">
              <h3 className="font-sans font-medium text-[#2d2d2d] mb-4">Личные данные</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#8a8a8a] mb-1">Имя</label>
                  <p className="text-[#2d2d2d] font-sans">{user.name || 'Не указано'}</p>
                </div>
                <div>
                  <label className="block text-sm text-[#8a8a8a] mb-1">Email</label>
                  <p className="text-[#2d2d2d] font-sans">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#e8e4de] bg-white p-6">
              <h3 className="font-sans font-medium text-[#2d2d2d] mb-4">Адреса доставки</h3>
              <Button asChild variant="outline" size="sm">
                <Link href="/account/addresses">Управление адресами</Link>
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Logout */}
      <div className="mt-12 pt-6 border-t border-[#e8e4de]">
        <Button
          asChild
          variant="outline"
          className="gap-2 text-[#8a8a8a] border-[#e8e4de] hover:text-[#e57373] hover:border-[#e57373]/30"
        >
          <Link href="/logout">
            <LogOut className="h-4 w-4" />
            Выйти
          </Link>
        </Button>
      </div>
    </div>
  )
}
