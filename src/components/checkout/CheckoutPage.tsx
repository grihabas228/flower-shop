'use client'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { useAuth } from '@/providers/Auth'
import { calculateDiscount } from '@/utilities/promo'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { Gift, ChevronRight, Clock, MapPin, User, Mail, Phone, FileText, Check, Truck, Store } from 'lucide-react'
import type { DeliveryZone } from '@/payload-types'

const timeSlots = [
  { id: 'morning', label: 'Утро', time: '9:00 — 12:00' },
  { id: 'day', label: 'День', time: '12:00 — 18:00' },
  { id: 'evening', label: 'Вечер', time: '18:00 — 22:00' },
]

type PromoState = {
  valid: boolean
  discountType: 'percentage' | 'fixed'
  discountValue: number
  code: string
} | null

type DeliveryResult = {
  price: number
  freeFrom: number | null
  estimatedTime: string | null
  isFree: boolean
} | null

export const CheckoutPage: React.FC = () => {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const { cart } = useCart()

  const [promo, setPromo] = useState<PromoState>(null)
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([])
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null)
  const [deliveryResult, setDeliveryResult] = useState<DeliveryResult>(null)
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [city] = useState('Москва')
  const [street, setStreet] = useState('')
  const [house, setHouse] = useState('')
  const [apartment, setApartment] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [timeSlot, setTimeSlot] = useState('day')
  const [greeting, setGreeting] = useState('')
  const [showGreeting, setShowGreeting] = useState(false)

  const cartIsEmpty = !cart || !cart.items || !cart.items.length
  const subtotal = cart?.subtotal || 0
  const promoParam = searchParams.get('promo')

  useEffect(() => {
    if (user?.email) {
      setRecipientEmail(user.email)
    }
  }, [user])

  // Fetch delivery zones on mount
  useEffect(() => {
    let cancelled = false
    fetch('/api/delivery-zones?where[active][equals]=true&sort=price&limit=20')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (data.docs) {
          setDeliveryZones(data.docs)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Calculate delivery cost when zone or subtotal changes
  useEffect(() => {
    if (selectedZoneId == null || subtotal === 0) {
      setDeliveryResult(null)
      return
    }
    let cancelled = false
    fetch('/api/delivery/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zoneId: selectedZoneId, cartTotal: subtotal }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (data.price != null) {
          setDeliveryResult(data)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [selectedZoneId, subtotal])

  const selectedZone = useMemo(
    () => deliveryZones.find((z) => z.id === selectedZoneId) ?? null,
    [deliveryZones, selectedZoneId],
  )
  const isPickup = selectedZone?.price === 0

  useEffect(() => {
    if (!promoParam || subtotal === 0) return
    let cancelled = false

    fetch('/api/promo/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: promoParam, cartTotal: subtotal }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (data.valid) {
          setPromo({
            valid: true,
            discountType: data.discountType,
            discountValue: data.discountValue,
            code: promoParam,
          })
        }
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [promoParam, subtotal])

  const discount = useMemo(() => calculateDiscount(promo, subtotal), [promo, subtotal])

  const deliveryCost = deliveryResult ? (deliveryResult.isFree ? 0 : deliveryResult.price) : 0
  const total = subtotal - discount + deliveryCost
  const bonusPoints = Math.round(total * 0.05)

  if (cartIsEmpty) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-serif text-3xl text-foreground mb-4">Корзина пуста</h1>
          <p className="text-muted-foreground mb-8 text-sm">Добавьте товары для оформления заказа</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-8 py-3.5 rounded-full text-sm font-medium tracking-wide hover:bg-accent/90 transition-colors"
          >
            Перейти в каталог
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  // Get today's date as min for date picker
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="container py-8 md:py-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs tracking-wider uppercase text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground transition-colors">
          Главная
        </Link>
        <span className="text-border">/</span>
        <Link href="/cart" className="hover:text-foreground transition-colors">
          Корзина
        </Link>
        <span className="text-border">/</span>
        <span className="text-foreground">Оформление</span>
      </nav>

      <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground mb-10">
        Оформление заказа
      </h1>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Left column — Form sections */}
        <div className="flex-1 lg:basis-[65%] space-y-10">
          {/* Section 1: Recipient */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center">
                <User className="w-4 h-4 text-accent" />
              </div>
              <h2 className="font-serif text-xl md:text-2xl text-foreground">Получатель</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] tracking-[0.12em] uppercase text-muted-foreground mb-2 font-medium">
                  Имя
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Имя получателя"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] tracking-[0.12em] uppercase text-muted-foreground mb-2 font-medium">
                  Телефон
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+7 (___) ___-__-__"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] tracking-[0.12em] uppercase text-muted-foreground mb-2 font-medium">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Section 2: Delivery */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-accent" />
              </div>
              <h2 className="font-serif text-xl md:text-2xl text-foreground">Доставка</h2>
            </div>

            {/* Zone selector */}
            <div className="mb-6">
              <label className="block text-[11px] tracking-[0.12em] uppercase text-muted-foreground mb-3 font-medium">
                Зона доставки
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {deliveryZones.map((zone) => {
                  const isSelected = selectedZoneId === zone.id
                  const zoneIsFree = zone.freeFrom != null && subtotal >= zone.freeFrom
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => setSelectedZoneId(zone.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                          : 'border-border hover:border-foreground/20'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-accent/15' : 'bg-secondary'
                      }`}>
                        {zone.zoneName === 'Самовывоз' ? (
                          <Store className={`w-4 h-4 ${isSelected ? 'text-accent' : 'text-muted-foreground'}`} />
                        ) : (
                          <Truck className={`w-4 h-4 ${isSelected ? 'text-accent' : 'text-muted-foreground'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>
                          {zone.zoneName}
                        </p>
                        {zone.estimatedTime && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {zone.estimatedTime}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        {zone.price === 0 ? (
                          <span className="text-sm font-medium text-green-600">Бесплатно</span>
                        ) : zoneIsFree ? (
                          <div>
                            <span className="text-sm font-medium text-green-600">Бесплатно</span>
                            <p className="text-[10px] text-muted-foreground line-through">{zone.price} &#8381;</p>
                          </div>
                        ) : (
                          <div>
                            <span className="text-sm font-medium text-foreground">{zone.price} &#8381;</span>
                            {zone.freeFrom && (
                              <p className="text-[10px] text-muted-foreground">
                                бесплатно от {zone.freeFrom.toLocaleString('ru-RU')} &#8381;
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Pickup info */}
            {isPickup && (
              <div className="flex items-start gap-3 bg-accent/5 border border-accent/20 rounded-xl p-4 mb-6">
                <Store className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Пункт самовывоза</p>
                  <p className="text-sm text-muted-foreground mt-1">Москва, ул. Цветочная, д. 12</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Ежедневно с 9:00 до 21:00</p>
                </div>
              </div>
            )}

            {/* Address fields — hidden for pickup */}
            {!isPickup && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div className="md:col-span-2">
                  <label className="block text-[11px] tracking-[0.12em] uppercase text-muted-foreground mb-2 font-medium">
                    Город
                  </label>
                  <input
                    type="text"
                    value={city}
                    disabled
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3.5 text-sm text-muted-foreground cursor-not-allowed"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] tracking-[0.12em] uppercase text-muted-foreground mb-2 font-medium">
                    Улица
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Название улицы"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] tracking-[0.12em] uppercase text-muted-foreground mb-2 font-medium">
                    Дом
                  </label>
                  <input
                    type="text"
                    value={house}
                    onChange={(e) => setHouse(e.target.value)}
                    placeholder="Номер дома"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] tracking-[0.12em] uppercase text-muted-foreground mb-2 font-medium">
                    Квартира / Офис
                  </label>
                  <input
                    type="text"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    placeholder="Номер"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] tracking-[0.12em] uppercase text-muted-foreground mb-2 font-medium">
                  Дата доставки
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  min={today}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all [color-scheme:light]"
                />
              </div>

              <div>
                <label className="block text-[11px] tracking-[0.12em] uppercase text-muted-foreground mb-2 font-medium">
                  Время доставки
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setTimeSlot(slot.id)}
                      className={`flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl border text-center transition-all ${
                        timeSlot === slot.id
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border text-muted-foreground hover:border-foreground/20'
                      }`}
                    >
                      <span className="text-xs font-medium">{slot.label}</span>
                      <span className="text-[10px] opacity-70">{slot.time}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Section 3: Greeting card */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-accent" />
                </div>
                <h2 className="font-serif text-xl md:text-2xl text-foreground">Открытка</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowGreeting(!showGreeting)}
                className="text-sm text-accent hover:text-accent/80 transition-colors"
              >
                {showGreeting ? 'Убрать' : 'Добавить'}
              </button>
            </div>

            {showGreeting && (
              <div>
                <label className="block text-[11px] tracking-[0.12em] uppercase text-muted-foreground mb-2 font-medium">
                  Текст поздравления
                </label>
                <textarea
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  placeholder="Напишите пожелание для получателя..."
                  rows={4}
                  maxLength={500}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
                />
                <p className="text-[11px] text-muted-foreground mt-2 text-right">
                  {greeting.length}/500
                </p>
              </div>
            )}

            {!showGreeting && (
              <p className="text-sm text-muted-foreground">
                Добавьте поздравление — мы вложим открытку в букет
              </p>
            )}
          </section>
        </div>

        {/* Right column — Order summary sidebar */}
        <div className="lg:basis-[35%] lg:shrink-0">
          <div className="lg:sticky lg:top-8 space-y-6">
            <div className="bg-secondary/50 rounded-2xl p-6 space-y-5">
              <h3 className="font-serif text-lg text-foreground">Ваш заказ</h3>

              {/* Cart items */}
              <div className="space-y-4">
                {cart?.items?.map((item, index) => {
                  if (typeof item.product === 'object' && item.product) {
                    const {
                      product,
                      product: { meta, title, gallery },
                      quantity,
                      variant,
                    } = item

                    if (!quantity) return null

                    let image = gallery?.[0]?.image || meta?.image
                    let price = product?.priceInUSD

                    const isVariant = Boolean(variant) && typeof variant === 'object'

                    if (isVariant) {
                      price = variant?.priceInUSD

                      const imageVariant = product.gallery?.find((galleryItem: any) => {
                        if (!galleryItem.variantOption) return false
                        const variantOptionID =
                          typeof galleryItem.variantOption === 'object'
                            ? galleryItem.variantOption.id
                            : galleryItem.variantOption

                        const hasMatch = variant?.options?.some((option: any) => {
                          if (typeof option === 'object') return option.id === variantOptionID
                          else return option === variantOptionID
                        })

                        return hasMatch
                      })

                      if (imageVariant && typeof imageVariant.image !== 'string') {
                        image = imageVariant.image
                      }
                    }

                    return (
                      <div className="flex items-center gap-3" key={index}>
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-background shrink-0">
                          {image && typeof image !== 'string' && (
                            <div className="relative w-full h-full">
                              <Media fill imgClassName="rounded-lg object-cover" resource={image} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{title}</p>
                          <p className="text-xs text-muted-foreground">x{quantity}</p>
                        </div>
                        {typeof price === 'number' && (
                          <Price
                            amount={price * quantity}
                            className="text-sm font-medium text-foreground shrink-0"
                          />
                        )}
                      </div>
                    )
                  }
                  return null
                })}
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Summary lines */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Товары</span>
                  <Price amount={subtotal} className="text-foreground" />
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Доставка</span>
                  {selectedZoneId == null ? (
                    <span className="text-muted-foreground/60 text-xs">выберите зону</span>
                  ) : deliveryResult?.isFree || deliveryCost === 0 ? (
                    <span className="text-green-600 font-medium">Бесплатно</span>
                  ) : (
                    <span className="text-foreground">{deliveryCost} &#8381;</span>
                  )}
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    Промокод
                    {promo && <Check className="w-3.5 h-3.5 text-green-600" />}
                  </span>
                  {discount > 0 ? (
                    <span className="text-green-600 font-medium">-{discount} &#8381;</span>
                  ) : (
                    <span className="text-foreground">—</span>
                  )}
                </div>
              </div>

              {/* Bonus points */}
              <div className="flex items-center gap-2 bg-accent/10 rounded-lg px-4 py-2.5">
                <Gift className="w-4 h-4 text-accent shrink-0" />
                <p className="text-xs text-accent">
                  Будет начислено <span className="font-semibold">{bonusPoints} бонусов</span>
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-xs tracking-[0.12em] uppercase text-muted-foreground font-medium">
                  Итого
                </span>
                <Price
                  amount={total}
                  className="font-serif text-2xl text-foreground"
                />
              </div>
            </div>

            {/* Pay button */}
            <button
              disabled={selectedZoneId == null}
              className="w-full bg-accent text-accent-foreground py-4 rounded-full text-base font-medium tracking-wide hover:bg-accent/90 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100"
            >
              {selectedZoneId == null ? 'Выберите зону доставки' : (
                <>
                  ОПЛАТИТЬ{' '}
                  <Price amount={total} as="span" className="inline" />
                </>
              )}
            </button>

            {/* Delivery info */}
            <div className="flex items-start gap-2.5 text-xs text-muted-foreground px-1">
              <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <p className="leading-relaxed">
                Оплата через ЮKassa. После оплаты вы получите подтверждение на email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
