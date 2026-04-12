'use client'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Plus, X, Gift, ChevronRight, Check, Loader2 } from 'lucide-react'
import { Product } from '@/payload-types'
import { AuthModal } from '@/components/AuthModal'
import { calculateDiscount } from '@/utilities/promo'
import { useOptimisticCart } from '@/providers/OptimisticCartProvider'

type PromoResult = {
  valid: boolean
  discountType?: 'percentage' | 'fixed'
  discountValue?: number
  message: string
}

function formatRub(n: number): string {
  return n.toLocaleString('ru-RU') + ' ₽'
}

export function CartPage() {
  // Server cart for product details (title, image, variants)
  const { cart } = useCart()
  // Optimistic cart for quantities and actions
  const { getQty, increment, decrement, removeFromCart, clearAllItems, totalItems } = useOptimisticCart()

  const [promoCode, setPromoCode] = useState('')
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [appliedCode, setAppliedCode] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Server cart not loaded yet — show skeleton, NOT "Корзина пуста"
  const serverLoading = cart === undefined || cart === null

  // Build items list: server cart items with optimistic quantities
  const items = useMemo(() => {
    if (!cart?.items?.length) return []
    return cart.items
      .map((item: any) => {
        const product = item.product
        if (typeof product !== 'object' || !product?.slug) return null
        const pid = product.id as number
        const qty = getQty(pid)
        if (qty <= 0) return null // optimistically removed
        return { ...item, product, optimisticQty: qty }
      })
      .filter(Boolean) as any[]
  }, [cart, getQty])

  // Only show "empty" when we're sure — server loaded AND nothing in optimistic
  const cartIsEmpty = !serverLoading && totalItems === 0 && items.length === 0

  // Compute subtotal from optimistic quantities
  const subtotal = useMemo(() => {
    let total = 0
    for (const item of items) {
      const variant = item.variant
      const isVariant = Boolean(variant) && typeof variant === 'object'
      const price = isVariant ? (variant?.priceInUSD ?? item.product.priceInUSD ?? 0) : (item.product.priceInUSD ?? 0)
      total += price * item.optimisticQty
    }
    return Math.round(total)
  }, [items])

  const discount = useMemo(() => {
    if (!promoResult?.valid || !promoResult.discountType || !promoResult.discountValue) return 0
    return calculateDiscount(promoResult as { discountType: 'percentage' | 'fixed'; discountValue: number }, subtotal)
  }, [promoResult, subtotal])

  const prevSubtotal = useRef(subtotal)
  useEffect(() => {
    if (prevSubtotal.current !== subtotal && appliedCode) {
      setPromoResult(null)
      setAppliedCode('')
      setPromoCode('')
    }
    prevSubtotal.current = subtotal
  }, [subtotal, appliedCode])

  const handleApplyPromo = useCallback(async () => {
    const trimmed = promoCode.trim()
    if (!trimmed) return

    setPromoLoading(true)
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed, cartTotal: subtotal }),
      })
      const data: PromoResult = await res.json()
      setPromoResult(data)
      if (data.valid) setAppliedCode(trimmed)
    } catch {
      setPromoResult({ valid: false, message: 'Ошибка соединения' })
    } finally {
      setPromoLoading(false)
    }
  }, [promoCode, subtotal])

  const handleCheckout = useCallback(() => {
    setShowAuthModal(true)
  }, [])

  const checkoutUrl = appliedCode ? `/checkout?promo=${encodeURIComponent(appliedCode)}` : '/checkout'

  // Skeleton while server cart is loading (prevents "Корзина пуста" flash)
  if (serverLoading && totalItems > 0) {
    return (
      <div className="container py-8 md:py-12">
        <div className="h-8 w-48 rounded bg-[#f0ebe3] mb-10 animate-pulse" />
        <div className="space-y-6">
          {Array.from({ length: Math.min(totalItems, 3) }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-[100px] h-[100px] rounded-xl bg-[#f0ebe3] animate-pulse shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-3/4 rounded bg-[#f0ebe3] animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-[#f0ebe3] animate-pulse" />
                <div className="h-9 w-32 rounded-full bg-[#f0ebe3] animate-pulse mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (cartIsEmpty) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-secondary flex items-center justify-center">
            <svg className="w-10 h-10 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-4">Корзина пуста</h1>
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
            Добавьте букеты и подарки, чтобы порадовать близких
          </p>
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

  return (
    <>
      <div className="container overflow-x-hidden py-8 md:py-12">
        <nav className="flex items-center gap-2 text-xs tracking-wider uppercase text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground transition-colors">Главная</Link>
          <span className="text-border">/</span>
          <span className="text-foreground">Корзина</span>
        </nav>

        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground mb-10">Корзина</h1>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left column — Cart items */}
          <div className="flex-1 lg:basis-[65%]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <p className="text-sm tracking-wider uppercase text-muted-foreground">
                Добавленные товары
                <span className="ml-2 text-foreground font-medium">{totalItems}</span>
              </p>
              <button
                onClick={() => clearAllItems()}
                className="text-sm text-accent hover:text-accent/70 transition-colors tracking-wide"
              >
                Очистить все
              </button>
            </div>

            <ul className="divide-y divide-border">
              {items.map((item: any, i: number) => {
                const product = item.product as Product
                const variant = item.variant
                const pid = product.id as number
                const qty = item.optimisticQty as number

                const metaImage = product.meta?.image && typeof product.meta?.image === 'object' ? product.meta.image : undefined
                const firstGalleryImage = typeof product.gallery?.[0]?.image === 'object' ? product.gallery?.[0]?.image : undefined
                let image = firstGalleryImage || metaImage
                let price = product.priceInUSD ?? 0

                const isVariant = Boolean(variant) && typeof variant === 'object'

                if (isVariant) {
                  price = variant?.priceInUSD ?? price

                  const imageVariant = product.gallery?.find((galleryItem: any) => {
                    if (!galleryItem.variantOption) return false
                    const variantOptionID = typeof galleryItem.variantOption === 'object' ? galleryItem.variantOption.id : galleryItem.variantOption
                    return variant?.options?.some((option: any) => (typeof option === 'object' ? option.id : option) === variantOptionID)
                  })
                  if (imageVariant && typeof imageVariant.image === 'object') image = imageVariant.image
                }

                return (
                  <li key={i} className="py-6 first:pt-0">
                    <div className="flex gap-4 md:gap-6">
                      <Link href={`/products/${product.slug}`} className="shrink-0">
                        <div className="relative w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-xl overflow-hidden bg-secondary">
                          {image?.url && (
                            <Image alt={image?.alt || product?.title || ''} className="object-cover" fill sizes="120px" src={image.url} />
                          )}
                        </div>
                      </Link>

                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link href={`/products/${product.slug}`} className="hover:text-accent transition-colors">
                              <h3 className="font-serif text-base md:text-lg text-foreground leading-tight truncate">
                                {product?.title}
                              </h3>
                            </Link>
                            {isVariant && variant && typeof variant === 'object' ? (
                              <p className="text-xs text-muted-foreground mt-1 tracking-wide uppercase">
                                {variant.options?.map((option: any) => typeof option === 'object' ? option.label : null).join(' / ')}
                              </p>
                            ) : null}
                            <div className="flex items-center gap-1.5 mt-2">
                              <Gift className="w-3.5 h-3.5 text-accent" />
                              <span className="text-xs text-accent font-medium">
                                +{Math.round(price * qty * 0.05)} бонусов
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => removeFromCart(pid)}
                            className="p-1.5 text-muted-foreground/40 hover:text-foreground transition-colors shrink-0"
                            aria-label="Удалить товар"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-3">
                          <div className="flex items-center border border-border rounded-full overflow-hidden">
                            <button
                              onClick={() => decrement(pid)}
                              className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                              aria-label="Уменьшить"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium tabular-nums">{qty}</span>
                            <button
                              onClick={() => increment(pid)}
                              className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                              aria-label="Увеличить"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="text-lg md:text-xl font-serif text-foreground">
                            {formatRub(Math.round(price * qty))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Right column — Sidebar */}
          <div className="lg:basis-[35%] lg:shrink-0">
            <div className="lg:sticky lg:top-8 space-y-6">
              {/* Promo */}
              <div className="bg-secondary/50 rounded-2xl p-6">
                <h3 className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-4 font-medium">Промокод</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); if (promoResult && !promoResult.valid) setPromoResult(null) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyPromo() }}
                    placeholder="Введите промокод"
                    disabled={promoLoading || (promoResult?.valid === true)}
                    className="min-w-0 flex-1 bg-background border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors disabled:opacity-60"
                  />
                  {promoResult?.valid ? (
                    <button onClick={() => { setPromoCode(''); setPromoResult(null); setAppliedCode('') }} className="px-5 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors whitespace-nowrap text-muted-foreground">
                      Убрать
                    </button>
                  ) : (
                    <button onClick={handleApplyPromo} disabled={promoLoading || !promoCode.trim()} className="px-5 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors whitespace-nowrap disabled:opacity-50">
                      {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Применить'}
                    </button>
                  )}
                </div>
                {promoResult && (
                  <p className={`text-xs mt-3 flex items-center gap-1.5 ${promoResult.valid ? 'text-green-600' : 'text-red-500'}`}>
                    {promoResult.valid && <Check className="w-3.5 h-3.5" />}
                    {promoResult.message}
                  </p>
                )}
                {discount > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Скидка: <span className="text-green-600 font-medium">-{formatRub(discount)}</span>
                  </p>
                )}
              </div>

              {/* Bonus */}
              <div className="flex items-center gap-3 bg-accent/10 rounded-xl px-5 py-3.5">
                <Gift className="w-5 h-5 text-accent shrink-0" />
                <p className="text-sm text-accent">
                  За заказ вам будет начислено{' '}
                  <span className="font-semibold">{Math.round(subtotal * 0.05)} бонусов</span>
                </p>
              </div>

              {/* Checkout — desktop */}
              <button
                onClick={handleCheckout}
                className="hidden lg:block w-full bg-accent text-accent-foreground py-4 rounded-full text-base font-medium tracking-wide hover:bg-accent/90 transition-all hover:shadow-lg"
              >
                Оформить заказ <span className="mx-1.5 opacity-60">·</span> {formatRub(subtotal - discount)}
              </button>

              <div className="text-xs text-muted-foreground leading-relaxed space-y-1.5 px-1">
                <p>Мы обрабатываем заказы с 9:00 до 21:00.</p>
                <p>При оформлении в ночное время букет может быть доставлен не ранее 11:00 следующего дня.</p>
                <p>Сезонные товары со временем могут быть убраны из каталога.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gift suggestions */}
        <section className="mt-16 mb-8">
          <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-8">Добавим подарок?</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            {giftSuggestions.map((gift, index) => (
              <div key={index} className="shrink-0 w-[180px] md:w-[200px] group cursor-pointer">
                <div className="relative rounded-xl overflow-hidden bg-secondary aspect-square mb-3">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent z-10" />
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-full px-2.5 py-1">
                    <Gift className="w-3 h-3 text-accent" />
                    <span className="text-[10px] font-medium text-accent">+{gift.bonus}</span>
                  </div>
                  <div className="w-full h-full bg-secondary flex items-center justify-center">
                    <span className="text-4xl opacity-30">{gift.emoji}</span>
                  </div>
                </div>
                <h3 className="text-sm text-foreground leading-snug group-hover:text-accent transition-colors">{gift.name}</h3>
                <p className="text-sm font-serif text-foreground mt-1">{formatRub(gift.price)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Mobile sticky checkout */}
      <div className="fixed bottom-16 left-0 right-0 z-40 lg:hidden bg-background/95 backdrop-blur-md border-t border-border px-4 py-3 md:bottom-0">
        <button
          onClick={handleCheckout}
          className="w-full bg-accent text-accent-foreground py-3.5 rounded-full text-sm font-medium tracking-wide hover:bg-accent/90 transition-all"
        >
          Оформить заказ <span className="mx-1 opacity-60">·</span> {formatRub(subtotal - discount)}
        </button>
      </div>

      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} redirectUrl={checkoutUrl} />
    </>
  )
}

const giftSuggestions = [
  { name: 'Крепление на дверь', price: 350, bonus: 18, emoji: '🎀' },
  { name: 'Открытка ручной работы', price: 290, bonus: 15, emoji: '💌' },
  { name: 'Сертификат на 3000 ₽', price: 3000, bonus: 150, emoji: '🎁' },
  { name: 'Шоколад ручной работы', price: 890, bonus: 45, emoji: '🍫' },
  { name: 'Ароматическая свеча', price: 1200, bonus: 60, emoji: '🕯️' },
  { name: 'Мягкая игрушка', price: 1500, bonus: 75, emoji: '🧸' },
]
