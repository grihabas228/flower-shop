'use client'

import { Media } from '@/components/Media'
import { useAuth } from '@/providers/Auth'
import { calculateDiscount } from '@/utilities/promo'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import {
  Gift,
  ChevronRight,
  ChevronDown,
  MapPin,
  User,
  FileText,
  MessageSquare,
  Check,
  X,
  AlertCircle,
  CreditCard,
  Wallet,
  Sparkles,
  Store,
  Truck,
} from 'lucide-react'
import { AddressInput, type DaDataSuggestion } from '@/components/AddressInput'
import { YandexMap } from '@/components/YandexMap'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SavedAddressesDropdown } from '@/components/checkout/SavedAddressesDropdown'
import { useSavedAddresses } from '@/hooks/useSavedAddresses'
import type { SavedAddress } from '@/utilities/savedAddresses'

// ─── Constants ───────────────────────────────────────────────────────────────

const SHOP_ADDRESS = 'Москва, Семёновский пер., д. 6'
const SHOP_COORDS: [number, number] = [55.781, 37.717]

const SLOTS_3H = [
  '9:00 — 12:00',
  '12:00 — 15:00',
  '15:00 — 18:00',
  '18:00 — 21:00',
]

const SLOTS_1H = Array.from({ length: 11 }, (_, i) => {
  const start = 10 + i
  return `${start}:00 — ${start + 1}:00`
})

const SLOTS_EXACT = Array.from({ length: 12 }, (_, i) => `${10 + i}:00`)

// ─── Types ───────────────────────────────────────────────────────────────────

type IntervalType = '3h' | '1h' | 'exact'

type PromoState = {
  valid: boolean
  discountType: 'percentage' | 'fixed'
  discountValue: number
  code: string
} | null

type PromoApiResponse = {
  valid: boolean
  discountType?: 'percentage' | 'fixed'
  discountValue?: number
  message?: string
}

type DeliveryZoneInfo = {
  id: number
  zoneType: string
  price3h: number
  price1h: number | null
  priceExact: number | null
  availableIntervals: IntervalType[]
  freeFrom: number | null
  estimatedTime: string | null
} | null

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatRub = (n: number) => `${n.toLocaleString('ru-RU')} ₽`

const formatPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (!digits) return ''
  const d = digits.startsWith('8') || digits.startsWith('7') ? digits : '7' + digits
  const p = d.padEnd(11, '_')
  return `+7 (${p.slice(1, 4)}) ${p.slice(4, 7)}-${p.slice(7, 9)}-${p.slice(9, 11)}`
    .replace(/_/g, '')
    .replace(/[\s\-()]+$/, '')
}

const isPhoneValid = (raw: string) => raw.replace(/\D/g, '').length === 11

// ─── Section header w/ check mark when complete ──────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  complete,
  rightSlot,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  complete: boolean
  rightSlot?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#e8b4b8]/15 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-[#e8b4b8]" />
        </div>
        <h2 className="font-serif text-xl md:text-[1.4rem] text-[#2d2d2d] leading-none">
          {title}
        </h2>
        {complete && (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#b5c7a3]/25">
            <Check className="w-3 h-3 text-[#5a7a45]" strokeWidth={3} />
          </span>
        )}
      </div>
      {rightSlot}
    </div>
  )
}

// ─── Field components ───────────────────────────────────────────────────────

const inputCls =
  'w-full bg-white border border-[#e8e4de] rounded-xl px-4 py-3.5 text-sm text-[#2d2d2d] placeholder:text-[#8a8a8a]/50 focus:outline-none focus:ring-2 focus:ring-[#e8b4b8]/40 focus:border-[#e8b4b8] transition-all'

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="block text-[11px] tracking-[0.12em] uppercase text-[#8a8a8a] mb-2 font-medium">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
    </div>
  )
}

function Toggle({
  active,
  onChange,
}: {
  active: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#e8b4b8]/40 ${
        active ? 'bg-[#e8b4b8]' : 'bg-[#e8e4de]'
      }`}
      aria-pressed={active}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
          active ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

// ─── Interval card ──────────────────────────────────────────────────────────

function IntervalCard({
  label,
  description,
  price,
  selected,
  disabled,
  onClick,
  children,
}: {
  label: string
  description?: string
  price: number
  selected: boolean
  disabled?: boolean
  onClick: () => void
  children?: React.ReactNode
}) {
  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${
        disabled
          ? 'border-[#e8e4de]/60 bg-[#faf5f0]/40 opacity-60 pointer-events-none'
          : selected
            ? 'border-[#e8b4b8] bg-[#e8b4b8]/8 shadow-[0_2px_12px_-4px_rgba(232,180,184,0.3)]'
            : 'border-[#e8e4de] bg-white hover:border-[#e8b4b8]/60'
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full text-left p-4 sm:p-5 flex items-center gap-4"
      >
        <div
          className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            selected ? 'border-[#e8b4b8] bg-[#e8b4b8]' : 'border-[#d0c8be] bg-white'
          }`}
        >
          {selected && <span className="w-2 h-2 rounded-full bg-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-sans text-[15px] font-medium text-[#2d2d2d]">{label}</div>
          {description && (
            <div className="text-xs text-[#8a8a8a] mt-0.5">{description}</div>
          )}
        </div>
        <div className="font-sans text-sm font-medium text-[#2d2d2d] tabular-nums shrink-0">
          {price > 0 ? `+${formatRub(price)}` : 'Бесплатно'}
        </div>
      </button>
      {selected && children && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
          <div className="border-t border-[#e8b4b8]/20 pt-4">{children}</div>
        </div>
      )}
    </div>
  )
}

// ─── Slot picker (for 3h and 1h) ────────────────────────────────────────────

function SlotPicker({
  slots,
  value,
  onChange,
}: {
  slots: string[]
  value: string
  onChange: (s: string) => void
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {slots.map((slot) => (
        <button
          key={slot}
          type="button"
          onClick={() => onChange(slot)}
          className={`px-3 py-2.5 rounded-xl text-xs sm:text-[13px] font-medium tabular-nums transition-all ${
            value === slot
              ? 'bg-[#2d2d2d] text-[#faf5f0]'
              : 'bg-white border border-[#e8e4de] text-[#5a5a5a] hover:border-[#e8b4b8]'
          }`}
        >
          {slot}
        </button>
      ))}
    </div>
  )
}

// ─── Order summary (right column) ───────────────────────────────────────────

type OrderSummaryProps = {
  cart: ReturnType<typeof useCart>['cart']
  removeItem: ReturnType<typeof useCart>['removeItem']
  isLoading: boolean
  subtotal: number
  discount: number
  deliveryCost: number
  intervalCost: number
  isFreeDelivery: boolean
  addressSelected: boolean
  pickupMode: boolean
  total: number
  promo: PromoState
  promoCode: string
  setPromoCode: (v: string) => void
  applyPromo: () => void
  promoLoading: boolean
  promoMessage: string | null
  bonusInput: string
  setBonusInput: (v: string) => void
  applyAllBonus: () => void
  paymentMethod: 'online' | 'cod'
  setPaymentMethod: (m: 'online' | 'cod') => void
  canPay: boolean
  payLabel: string
}

function OrderSummary({
  cart,
  removeItem,
  isLoading,
  subtotal,
  discount,
  deliveryCost,
  intervalCost,
  isFreeDelivery,
  addressSelected,
  pickupMode,
  total,
  promo,
  promoCode,
  setPromoCode,
  applyPromo,
  promoLoading,
  promoMessage,
  bonusInput,
  setBonusInput,
  applyAllBonus,
  paymentMethod,
  setPaymentMethod,
  canPay,
  payLabel,
}: OrderSummaryProps) {
  const itemsCount = cart?.items?.reduce((acc, i) => acc + (i.quantity || 0), 0) || 0
  const baseDelivery = pickupMode
    ? 0
    : !addressSelected
      ? null
      : isFreeDelivery
        ? 0
        : deliveryCost

  return (
    <div className="bg-white border border-[#e8e4de] rounded-2xl p-5 md:p-6 space-y-5 shadow-[0_4px_24px_-12px_rgba(45,45,45,0.08)]">
      <div className="flex items-baseline justify-between">
        <h3 className="font-serif text-xl text-[#2d2d2d]">Ваш заказ</h3>
        <span className="text-xs text-[#8a8a8a]">{itemsCount} тов.</span>
      </div>

      {/* Cart items */}
      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 -mr-1">
        {cart?.items?.map((item, index) => {
          if (typeof item.product !== 'object' || !item.product) return null
          const { product, product: { meta, title, gallery }, quantity, variant } = item
          if (!quantity) return null

          let image = gallery?.[0]?.image || meta?.image
          let price = product?.priceInUSD

          const isVariant = Boolean(variant) && typeof variant === 'object'
          if (isVariant) {
            price = variant?.priceInUSD
            const imageVariant = product.gallery?.find((g: any) => {
              if (!g.variantOption) return false
              const variantOptionID =
                typeof g.variantOption === 'object' ? g.variantOption.id : g.variantOption
              return variant?.options?.some((o: any) =>
                typeof o === 'object' ? o.id === variantOptionID : o === variantOptionID,
              )
            })
            if (imageVariant && typeof imageVariant.image !== 'string') {
              image = imageVariant.image
            }
          }

          return (
            <div className="flex items-start gap-3" key={index}>
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#faf5f0] shrink-0">
                {image && typeof image !== 'string' && (
                  <div className="relative w-full h-full">
                    <Media fill imgClassName="object-cover" resource={image} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#2d2d2d] line-clamp-2 leading-snug">{title}</p>
                <p className="text-xs text-[#8a8a8a] mt-1">×{quantity}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {typeof price === 'number' && (
                  <span className="text-sm font-medium text-[#2d2d2d] tabular-nums">
                    {formatRub(price * quantity)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => item.id && removeItem(item.id)}
                  disabled={!item.id || isLoading}
                  className="text-[#8a8a8a]/60 hover:text-[#2d2d2d] transition-colors disabled:opacity-40"
                  aria-label="Удалить"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Promo */}
      <div>
        <label className="block text-[11px] tracking-[0.12em] uppercase text-[#8a8a8a] mb-2 font-medium">
          Промокод
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="Введите промокод"
            disabled={!!promo}
            className={`flex-1 bg-[#faf5f0] border border-[#e8e4de] rounded-full px-4 py-2.5 text-sm placeholder:text-[#8a8a8a]/50 focus:outline-none focus:ring-2 focus:ring-[#e8b4b8]/40 focus:border-[#e8b4b8] transition-all ${
              promo ? 'opacity-60' : ''
            }`}
          />
          <button
            type="button"
            onClick={applyPromo}
            disabled={!promoCode.trim() || promoLoading || !!promo}
            className="px-5 py-2.5 rounded-full text-sm font-medium bg-[#2d2d2d] text-[#faf5f0] hover:bg-[#2d2d2d]/90 transition-colors disabled:opacity-40 shrink-0"
          >
            {promo ? <Check className="w-4 h-4" /> : 'Применить'}
          </button>
        </div>
        {promoMessage && !promo && (
          <p className="text-[11px] text-red-500 mt-1.5 ml-1">{promoMessage}</p>
        )}
      </div>

      {/* Bonus */}
      <div>
        <label className="block text-[11px] tracking-[0.12em] uppercase text-[#8a8a8a] mb-2 font-medium">
          Бонусы
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            value={bonusInput}
            onChange={(e) => setBonusInput(e.target.value)}
            placeholder="0"
            className="flex-1 bg-[#faf5f0] border border-[#e8e4de] rounded-full px-4 py-2.5 text-sm placeholder:text-[#8a8a8a]/50 focus:outline-none focus:ring-2 focus:ring-[#e8b4b8]/40 focus:border-[#e8b4b8] transition-all tabular-nums"
          />
          <button
            type="button"
            onClick={applyAllBonus}
            className="px-5 py-2.5 rounded-full text-sm font-medium border border-[#e8e4de] text-[#5a5a5a] hover:border-[#e8b4b8] hover:text-[#2d2d2d] transition-colors shrink-0"
          >
            Исп. все
          </button>
        </div>
      </div>

      <div className="border-t border-[#e8e4de]" />

      {/* Summary lines */}
      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between text-[#5a5a5a]">
          <span>Товары</span>
          <span className="text-[#2d2d2d] tabular-nums">{formatRub(subtotal)}</span>
        </div>
        <div className="flex justify-between text-[#5a5a5a]">
          <span>{pickupMode ? 'Самовывоз' : 'Доставка'}</span>
          {pickupMode ? (
            <span className="text-[#5a7a45] font-medium">Бесплатно</span>
          ) : baseDelivery == null ? (
            <span className="text-[#8a8a8a]/60 text-xs">укажите адрес</span>
          ) : baseDelivery === 0 ? (
            <span className="text-[#5a7a45] font-medium">Бесплатно</span>
          ) : (
            <span className="text-[#2d2d2d] tabular-nums">{formatRub(baseDelivery)}</span>
          )}
        </div>
        {!pickupMode && intervalCost > 0 && addressSelected && (
          <div className="flex justify-between text-[#5a5a5a]">
            <span>Интервал</span>
            <span className="text-[#2d2d2d] tabular-nums">+{formatRub(intervalCost)}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between text-[#5a5a5a]">
            <span className="flex items-center gap-1.5">
              Промокод
              <Check className="w-3.5 h-3.5 text-[#5a7a45]" />
            </span>
            <span className="text-[#5a7a45] font-medium tabular-nums">−{formatRub(discount)}</span>
          </div>
        )}
      </div>

      <div className="border-t border-[#e8e4de]" />

      {/* Total */}
      <div className="flex items-baseline justify-between">
        <span className="text-xs tracking-[0.12em] uppercase text-[#8a8a8a] font-medium">
          Итого
        </span>
        <span className="font-serif text-3xl text-[#2d2d2d] tabular-nums">
          {formatRub(total)}
        </span>
      </div>

      {/* Payment method */}
      <div>
        <label className="block text-[11px] tracking-[0.12em] uppercase text-[#8a8a8a] mb-2 font-medium">
          Способ оплаты
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPaymentMethod('online')}
            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center transition-all ${
              paymentMethod === 'online'
                ? 'border-[#e8b4b8] bg-[#e8b4b8]/8 text-[#2d2d2d]'
                : 'border-[#e8e4de] bg-white text-[#8a8a8a] hover:border-[#e8b4b8]/60'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-[11px] font-medium leading-tight">Онлайн оплата</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('cod')}
            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center transition-all ${
              paymentMethod === 'cod'
                ? 'border-[#e8b4b8] bg-[#e8b4b8]/8 text-[#2d2d2d]'
                : 'border-[#e8e4de] bg-white text-[#8a8a8a] hover:border-[#e8b4b8]/60'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[11px] font-medium leading-tight">При получении</span>
          </button>
        </div>
      </div>

      {/* Pay button */}
      <button
        type="button"
        disabled={!canPay}
        className={`w-full py-4 rounded-full text-sm font-medium tracking-wide transition-all ${
          canPay
            ? 'bg-[#2d2d2d] text-[#faf5f0] hover:bg-[#2d2d2d]/90 hover:shadow-lg active:scale-[0.98]'
            : 'bg-[#e8b4b8]/30 text-[#8a8a8a] cursor-not-allowed'
        }`}
      >
        {payLabel}
      </button>

      {/* Note */}
      <p className="text-[11px] text-[#8a8a8a]/80 text-center leading-relaxed px-2">
        Оплата через ЮKassa. Подтверждение придёт на телефон.
      </p>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export const CheckoutPage: React.FC = () => {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const { cart, removeItem, isLoading } = useCart()

  // Buyer
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')

  // Recipient
  const [recipientDifferent, setRecipientDifferent] = useState(false)
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [surprise, setSurprise] = useState(false)

  // Mode: delivery / pickup
  const [mode, setMode] = useState<'delivery' | 'pickup'>('delivery')

  // Delivery
  const [addressValue, setAddressValue] = useState('')
  const [addressSelected, setAddressSelected] = useState(false)
  const [addressUnavailable, setAddressUnavailable] = useState(false)
  const [zoneInfo, setZoneInfo] = useState<DeliveryZoneInfo>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>(SHOP_COORDS)
  const [mapMarker, setMapMarker] = useState<[number, number]>(SHOP_COORDS)
  const [mapZoom, setMapZoom] = useState(12)
  const [markerTitle, setMarkerTitle] = useState('FLEUR')
  const [markerBody, setMarkerBody] = useState(SHOP_ADDRESS)
  const [apartment, setApartment] = useState('')
  const [entrance, setEntrance] = useState('')
  const [floor, setFloor] = useState('')
  const [intercom, setIntercom] = useState('')

  // Saved addresses
  const {
    addresses: savedAddresses,
    hydrated: savedHydrated,
    add: addSavedAddress,
    update: updateSavedAddress,
    remove: removeSavedAddress,
  } = useSavedAddresses()
  const [addressMode, setAddressMode] = useState<'pick' | 'add' | 'edit'>('add')
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null)
  // Track latest beltway data so we can save the address after a successful lookup
  const lastBeltwayRef = useRef<{
    geo_lat: string
    geo_lon: string
    beltway_hit: string | null
    beltway_distance: string | null
  } | null>(null)
  // Skip auto-save when the lookup was triggered by picking a saved address
  const skipAutoSaveRef = useRef(false)

  // Interval
  const [interval, setInterval] = useState<IntervalType | null>(null)
  const [slot3h, setSlot3h] = useState('')
  const [slot1h, setSlot1h] = useState('')
  const [slotExact, setSlotExact] = useState('')

  // Date
  const today = new Date().toISOString().split('T')[0]
  const [deliveryDate, setDeliveryDate] = useState(today)

  // Pickup
  const [pickupTime, setPickupTime] = useState('')

  // Card + comment
  const [showCard, setShowCard] = useState(false)
  const [cardText, setCardText] = useState('')
  const [comment, setComment] = useState('')

  // Promo
  const [promo, setPromo] = useState<PromoState>(null)
  const [promoCode, setPromoCode] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoMessage, setPromoMessage] = useState<string | null>(null)

  // Bonus (placeholder)
  const [bonusInput, setBonusInput] = useState('')

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online')

  // Mobile sticky summary
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false)

  const cartIsEmpty = !cart || !cart.items || !cart.items.length
  const subtotal = cart?.subtotal || 0
  const promoParam = searchParams.get('promo')

  // Prefill from user
  useEffect(() => {
    if (user?.email && !buyerName) {
      // payload user has no name field — leave blank but keep email-derived if present
    }
  }, [user, buyerName])

  // Pre-apply promo from URL
  useEffect(() => {
    if (!promoParam || subtotal === 0 || promo) return
    let cancelled = false
    fetch('/api/promo/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: promoParam, cartTotal: subtotal }),
    })
      .then((r) => r.json())
      .then((data: PromoApiResponse) => {
        if (cancelled) return
        if (data.valid && data.discountType && data.discountValue != null) {
          setPromo({
            valid: true,
            discountType: data.discountType,
            discountValue: data.discountValue,
            code: promoParam,
          })
          setPromoCode(promoParam)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [promoParam, subtotal, promo])

  // Address handler
  const handleAddressSelect = useCallback(
    async (suggestion: DaDataSuggestion) => {
      setAddressSelected(true)
      setAddressUnavailable(false)
      setMarkerTitle(suggestion.value)
      setMarkerBody('')

      // Update map from suggestion coords (free, immediate)
      if (suggestion.data.geo_lat && suggestion.data.geo_lon) {
        const lat = parseFloat(suggestion.data.geo_lat)
        const lon = parseFloat(suggestion.data.geo_lon)
        setMapCenter([lat, lon])
        setMapMarker([lat, lon])
        setMapZoom(15)
      }

      try {
        const cleanRes = await fetch('/api/dadata/clean', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: suggestion.value }),
        })
        const cleanData = await cleanRes.json()
        if (cleanData.error) return

        // Cache beltway data so auto-save (or "save on order") can persist it
        lastBeltwayRef.current = {
          geo_lat: suggestion.data.geo_lat ?? cleanData.geo_lat ?? '',
          geo_lon: suggestion.data.geo_lon ?? cleanData.geo_lon ?? '',
          beltway_hit: cleanData.beltway_hit ?? null,
          beltway_distance: cleanData.beltway_distance ?? null,
        }

        const zoneRes = await fetch('/api/delivery/zone-by-address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            beltway_hit: cleanData.beltway_hit,
            beltway_distance: cleanData.beltway_distance,
            cartTotal: subtotal,
          }),
        })
        const info = await zoneRes.json()

        if (info.unavailable) {
          setAddressUnavailable(true)
          setZoneInfo(null)
          setInterval(null)
          return
        }

        if (info.zone) {
          const zone: DeliveryZoneInfo = {
            id: info.zone.id,
            zoneType: info.zone.zoneType,
            price3h: info.zone.price3h ?? 0,
            price1h: info.zone.price1h ?? null,
            priceExact: info.zone.priceExact ?? null,
            availableIntervals: (info.zone.availableIntervals ?? ['3h']) as IntervalType[],
            freeFrom: info.zone.freeFrom ?? null,
            estimatedTime: info.zone.estimatedTime ?? null,
          }
          setZoneInfo(zone)

          // Auto-select default interval
          const intervals = zone.availableIntervals
          if (intervals.length === 1) {
            setInterval(intervals[0]!)
          } else if (intervals.includes('3h')) {
            setInterval('3h')
          } else {
            setInterval(intervals[0]!)
          }

          // Auto-save: persist freshly entered address (skip if just picked from history)
          if (!skipAutoSaveRef.current && lastBeltwayRef.current) {
            const id = addSavedAddress({
              address: suggestion.value,
              apartment,
              entrance,
              floor,
              intercom,
              geo_lat: lastBeltwayRef.current.geo_lat,
              geo_lon: lastBeltwayRef.current.geo_lon,
              beltway_hit: lastBeltwayRef.current.beltway_hit,
              beltway_distance: lastBeltwayRef.current.beltway_distance,
            })
            setSelectedSavedId(id)
            setAddressMode('pick')
          }
          skipAutoSaveRef.current = false
        }
      } catch {
        // keep state on error
      }
    },
    [subtotal, addSavedAddress, apartment, entrance, floor, intercom],
  )

  // Apply a saved address: fill all fields, update map, look up zone using cached beltway data
  const applySavedAddress = useCallback(
    async (addr: SavedAddress) => {
      skipAutoSaveRef.current = true
      setSelectedSavedId(addr.id)
      setAddressMode('pick')
      setAddressValue(addr.address)
      setApartment(addr.apartment)
      setEntrance(addr.entrance)
      setFloor(addr.floor)
      setIntercom(addr.intercom)
      setAddressSelected(true)
      setAddressUnavailable(false)
      setMarkerTitle(addr.address)
      setMarkerBody('')

      if (addr.geo_lat && addr.geo_lon) {
        const lat = parseFloat(addr.geo_lat)
        const lon = parseFloat(addr.geo_lon)
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
          setMapCenter([lat, lon])
          setMapMarker([lat, lon])
          setMapZoom(15)
        }
      }

      lastBeltwayRef.current = {
        geo_lat: addr.geo_lat,
        geo_lon: addr.geo_lon,
        beltway_hit: addr.beltway_hit,
        beltway_distance: addr.beltway_distance,
      }

      // Re-determine zone using cached beltway data (no /api/dadata/clean call needed)
      try {
        const zoneRes = await fetch('/api/delivery/zone-by-address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            beltway_hit: addr.beltway_hit,
            beltway_distance: addr.beltway_distance,
            cartTotal: subtotal,
          }),
        })
        const info = await zoneRes.json()

        if (info.unavailable) {
          setAddressUnavailable(true)
          setZoneInfo(null)
          setInterval(null)
          return
        }

        if (info.zone) {
          const zone: DeliveryZoneInfo = {
            id: info.zone.id,
            zoneType: info.zone.zoneType,
            price3h: info.zone.price3h ?? 0,
            price1h: info.zone.price1h ?? null,
            priceExact: info.zone.priceExact ?? null,
            availableIntervals: (info.zone.availableIntervals ?? ['3h']) as IntervalType[],
            freeFrom: info.zone.freeFrom ?? null,
            estimatedTime: info.zone.estimatedTime ?? null,
          }
          setZoneInfo(zone)
          const intervals = zone.availableIntervals
          if (intervals.length === 1) setInterval(intervals[0]!)
          else if (intervals.includes('3h')) setInterval('3h')
          else setInterval(intervals[0]!)
        }
      } catch {
        // ignore network errors
      } finally {
        skipAutoSaveRef.current = false
      }
    },
    [subtotal],
  )

  // On first load (after hydration), auto-apply the default saved address
  const didAutoApplyRef = useRef(false)
  useEffect(() => {
    if (!savedHydrated || didAutoApplyRef.current) return
    if (savedAddresses.length === 0) {
      setAddressMode('add')
      didAutoApplyRef.current = true
      return
    }
    const def = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0]
    if (def) {
      didAutoApplyRef.current = true
      void applySavedAddress(def)
    }
  }, [savedHydrated, savedAddresses, applySavedAddress])

  // Handlers for the dropdown action icons
  const handleAddNewAddress = useCallback(() => {
    setAddressMode('add')
    setSelectedSavedId(null)
    setAddressValue('')
    setApartment('')
    setEntrance('')
    setFloor('')
    setIntercom('')
    setAddressSelected(false)
    setAddressUnavailable(false)
    setZoneInfo(null)
    setInterval(null)
    lastBeltwayRef.current = null
  }, [])

  const handleEditSelectedAddress = useCallback((addr: SavedAddress) => {
    setAddressMode('edit')
    setSelectedSavedId(addr.id)
    // Fields stay populated; they become editable thanks to addressMode === 'edit'
  }, [])

  const handleDeleteSelectedAddress = useCallback(
    (id: string) => {
      removeSavedAddress(id)
      // If we just deleted the active one, clear and switch to add mode
      if (selectedSavedId === id) {
        handleAddNewAddress()
      }
    },
    [removeSavedAddress, selectedSavedId, handleAddNewAddress],
  )

  // Persist additional-field edits while in 'edit' mode
  const handleAdditionalFieldChange = useCallback(
    (field: 'apartment' | 'entrance' | 'floor' | 'intercom', value: string) => {
      if (field === 'apartment') setApartment(value)
      if (field === 'entrance') setEntrance(value)
      if (field === 'floor') setFloor(value)
      if (field === 'intercom') setIntercom(value)
      if (addressMode === 'edit' && selectedSavedId) {
        updateSavedAddress(selectedSavedId, { [field]: value })
      }
    },
    [addressMode, selectedSavedId, updateSavedAddress],
  )

  // Promo apply
  const applyPromo = useCallback(async () => {
    const trimmed = promoCode.trim()
    if (!trimmed) return
    setPromoLoading(true)
    setPromoMessage(null)
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed, cartTotal: subtotal }),
      })
      const data: PromoApiResponse = await res.json()
      if (data.valid && data.discountType && data.discountValue != null) {
        setPromo({
          valid: true,
          discountType: data.discountType,
          discountValue: data.discountValue,
          code: trimmed,
        })
        setPromoMessage(null)
      } else {
        setPromoMessage(data.message || 'Промокод не действителен')
      }
    } catch {
      setPromoMessage('Ошибка соединения')
    } finally {
      setPromoLoading(false)
    }
  }, [promoCode, subtotal])

  // Bonus placeholder
  const applyAllBonus = useCallback(() => {
    setBonusInput('0') // placeholder — wired up later
  }, [])

  // Computations
  const discount = useMemo(() => calculateDiscount(promo, subtotal), [promo, subtotal])

  const isFreeDelivery =
    !!zoneInfo && zoneInfo.freeFrom != null && subtotal >= zoneInfo.freeFrom

  const baseDeliveryCost = useMemo(() => {
    if (mode === 'pickup') return 0
    if (!zoneInfo) return 0
    if (isFreeDelivery) return 0
    return zoneInfo.price3h
  }, [mode, zoneInfo, isFreeDelivery])

  const intervalCost = useMemo(() => {
    if (mode === 'pickup' || !zoneInfo || !interval) return 0
    if (interval === '3h') return 0 // 3h is the base — no extra
    if (interval === '1h' && zoneInfo.price1h != null && zoneInfo.price3h != null) {
      return Math.max(0, zoneInfo.price1h - zoneInfo.price3h)
    }
    if (interval === 'exact' && zoneInfo.priceExact != null && zoneInfo.price3h != null) {
      return Math.max(0, zoneInfo.priceExact - zoneInfo.price3h)
    }
    return 0
  }, [mode, zoneInfo, interval])

  const total = useMemo(
    () => Math.max(0, subtotal - discount + baseDeliveryCost + intervalCost),
    [subtotal, discount, baseDeliveryCost, intervalCost],
  )

  // Section completion
  const buyerComplete = buyerName.trim().length > 0 && isPhoneValid(buyerPhone)
  const recipientComplete =
    !recipientDifferent ||
    (recipientName.trim().length > 0 && isPhoneValid(recipientPhone))

  const intervalSlotComplete =
    !interval ||
    (interval === '3h' && !!slot3h) ||
    (interval === '1h' && !!slot1h) ||
    (interval === 'exact' && !!slotExact)

  const deliveryComplete =
    mode === 'pickup'
      ? !!pickupTime && !!deliveryDate
      : addressSelected &&
        !addressUnavailable &&
        !!zoneInfo &&
        !!interval &&
        intervalSlotComplete &&
        !!deliveryDate

  const canPay = buyerComplete && recipientComplete && deliveryComplete && !cartIsEmpty

  const payLabel = !buyerComplete
    ? 'Заполните контакты'
    : !recipientComplete
      ? 'Укажите получателя'
      : mode === 'delivery' && !addressSelected
        ? 'Укажите адрес доставки'
        : mode === 'delivery' && addressUnavailable
          ? 'Доставка недоступна'
          : !deliveryComplete
            ? 'Выберите время'
            : `Оплатить — ${formatRub(total)}`

  if (cartIsEmpty) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-serif text-3xl text-[#2d2d2d] mb-4">Корзина пуста</h1>
          <p className="text-[#8a8a8a] mb-8 text-sm">
            Добавьте товары для оформления заказа
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-[#e8b4b8] text-[#2d2d2d] px-8 py-3.5 rounded-full text-sm font-medium tracking-wide hover:bg-[#e8b4b8]/90 transition-colors"
          >
            Перейти в каталог
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  // Determine which interval is the "base" displayed if pickup
  const pickupTimeSlots = SLOTS_EXACT

  return (
    <div className="bg-[#faf5f0]/30 min-h-screen">
      <div className="container py-8 md:py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs tracking-wider uppercase text-[#8a8a8a] mb-6">
          <Link href="/" className="hover:text-[#2d2d2d] transition-colors">
            Главная
          </Link>
          <span className="text-[#e8e4de]">/</span>
          <Link href="/cart" className="hover:text-[#2d2d2d] transition-colors">
            Корзина
          </Link>
          <span className="text-[#e8e4de]">/</span>
          <span className="text-[#2d2d2d]">Оформление</span>
        </nav>

        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#2d2d2d] mb-8 md:mb-10">
          Оформление заказа
        </h1>

        {/* Mobile collapsible summary */}
        <div className="lg:hidden mb-6">
          <button
            type="button"
            onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
            className="w-full flex items-center justify-between bg-white border border-[#e8e4de] rounded-2xl px-5 py-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#e8b4b8]/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#e8b4b8]" />
              </div>
              <div className="text-left">
                <p className="text-[11px] tracking-[0.12em] uppercase text-[#8a8a8a]">
                  Итого
                </p>
                <p className="font-serif text-xl text-[#2d2d2d] tabular-nums">
                  {formatRub(total)}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-[#5a5a5a] transition-transform ${
                mobileSummaryOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          {mobileSummaryOpen && (
            <div className="mt-4">
              <OrderSummary
                cart={cart}
                removeItem={removeItem}
                isLoading={isLoading}
                subtotal={subtotal}
                discount={discount}
                deliveryCost={baseDeliveryCost}
                intervalCost={intervalCost}
                isFreeDelivery={isFreeDelivery}
                addressSelected={addressSelected}
                pickupMode={mode === 'pickup'}
                total={total}
                promo={promo}
                promoCode={promoCode}
                setPromoCode={setPromoCode}
                applyPromo={applyPromo}
                promoLoading={promoLoading}
                promoMessage={promoMessage}
                bonusInput={bonusInput}
                setBonusInput={setBonusInput}
                applyAllBonus={applyAllBonus}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                canPay={canPay}
                payLabel={payLabel}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* LEFT — Form */}
          <div className="flex-1 lg:basis-[60%] space-y-8 md:space-y-10">
            {/* 1. Buyer */}
            <section>
              <SectionHeader icon={User} title="Ваши данные" complete={buyerComplete} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Имя"
                  value={buyerName}
                  onChange={setBuyerName}
                  placeholder="Ваше имя"
                />
                <TextField
                  label="Телефон"
                  value={buyerPhone}
                  onChange={(v) => setBuyerPhone(formatPhone(v))}
                  placeholder="+7 (___) ___-__-__"
                  type="tel"
                />
              </div>
            </section>

            <div className="border-t border-[#e8e4de]" />

            {/* 2. Recipient */}
            <section>
              <SectionHeader
                icon={Gift}
                title="Получатель"
                complete={recipientComplete}
                rightSlot={
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-[#5a5a5a] hidden sm:inline">
                      Доставка другому человеку
                    </span>
                    <Toggle active={recipientDifferent} onChange={setRecipientDifferent} />
                  </div>
                }
              />

              {!recipientDifferent ? (
                <div className="rounded-2xl bg-[#faf5f0] border border-[#e8e4de] px-5 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-[#5a5a5a]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#2d2d2d]">Я сам(а) получу заказ</p>
                    <p className="text-xs text-[#8a8a8a] mt-0.5">
                      Используем данные из «Ваши данные»
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      label="Имя получателя"
                      value={recipientName}
                      onChange={setRecipientName}
                      placeholder="Имя"
                    />
                    <TextField
                      label="Телефон получателя"
                      value={recipientPhone}
                      onChange={(v) => setRecipientPhone(formatPhone(v))}
                      placeholder="+7 (___) ___-__-__"
                      type="tel"
                    />
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div
                      className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                        surprise
                          ? 'border-[#e8b4b8] bg-[#e8b4b8]'
                          : 'border-[#d0c8be] bg-white group-hover:border-[#e8b4b8]/60'
                      }`}
                      onClick={() => setSurprise(!surprise)}
                    >
                      {surprise && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </div>
                    <input
                      type="checkbox"
                      checked={surprise}
                      onChange={(e) => setSurprise(e.target.checked)}
                      className="sr-only"
                    />
                    <span className="text-sm text-[#5a5a5a] leading-snug">
                      Не звонить получателю заранее{' '}
                      <span className="text-[#8a8a8a]">— сюрприз</span>
                    </span>
                  </label>
                </div>
              )}
            </section>

            <div className="border-t border-[#e8e4de]" />

            {/* 3. Delivery / Pickup */}
            <section>
              <SectionHeader
                icon={MapPin}
                title="Доставка"
                complete={deliveryComplete}
              />

              <Tabs value={mode} onValueChange={(v) => setMode(v as 'delivery' | 'pickup')}>
                <TabsList className="bg-[#faf5f0] rounded-full p-1 border-0 gap-0 inline-flex">
                  <TabsTrigger
                    value="delivery"
                    className="rounded-full border-0 px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-0"
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Доставка
                  </TabsTrigger>
                  <TabsTrigger
                    value="pickup"
                    className="rounded-full border-0 px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-0"
                  >
                    <Store className="w-4 h-4 mr-2" />
                    Самовывоз
                  </TabsTrigger>
                </TabsList>

                {/* Delivery tab */}
                <TabsContent value="delivery" className="space-y-5">
                  {/* Saved addresses dropdown — only when there's history */}
                  {savedHydrated && savedAddresses.length > 0 && (
                    <div>
                      <label className="block text-[11px] tracking-[0.12em] uppercase text-[#8a8a8a] mb-2 font-medium">
                        Выбрать адрес из истории
                      </label>
                      <SavedAddressesDropdown
                        addresses={savedAddresses}
                        selectedId={selectedSavedId}
                        onSelect={(addr) => void applySavedAddress(addr)}
                        onAddNew={handleAddNewAddress}
                        onEdit={handleEditSelectedAddress}
                        onDelete={handleDeleteSelectedAddress}
                      />
                    </div>
                  )}

                  {/* AddressInput — shown in add/edit mode, or always if no saved addresses */}
                  {(addressMode !== 'pick' || savedAddresses.length === 0) && (
                    <div>
                      <label className="block text-[11px] tracking-[0.12em] uppercase text-[#8a8a8a] mb-2 font-medium">
                        {addressMode === 'edit' ? 'Изменить адрес' : 'Адрес доставки'}
                      </label>
                      <AddressInput
                        value={addressValue}
                        onChange={(val) => {
                          setAddressValue(val)
                          if (addressSelected) {
                            setAddressSelected(false)
                            setZoneInfo(null)
                            setInterval(null)
                            setAddressUnavailable(false)
                          }
                        }}
                        onSelect={handleAddressSelect}
                        placeholder="Укажите улицу и дом"
                        hint="*Смена адреса может повлиять на стоимость доставки"
                      />
                    </div>
                  )}

                  {addressUnavailable && (
                    <div className="flex items-center gap-2 text-red-500">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <p className="text-xs">Доставка в этот район пока недоступна</p>
                    </div>
                  )}

                  {/* Map */}
                  <div className="h-[220px] rounded-2xl overflow-hidden border border-[#e8e4de]">
                    <YandexMap
                      center={mapCenter}
                      zoom={mapZoom}
                      markerCoords={mapMarker}
                      markerTitle={markerTitle}
                      markerBody={markerBody}
                    />
                  </div>

                  {/* Apt / entrance / floor / intercom — read-only in pick mode */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={apartment}
                      onChange={(e) => handleAdditionalFieldChange('apartment', e.target.value)}
                      placeholder="Кв/Офис"
                      readOnly={addressMode === 'pick'}
                      className={`${inputCls} ${
                        addressMode === 'pick' ? 'bg-[#faf5f0] cursor-default' : ''
                      }`}
                    />
                    <input
                      type="text"
                      value={entrance}
                      onChange={(e) => handleAdditionalFieldChange('entrance', e.target.value)}
                      placeholder="Подъезд"
                      readOnly={addressMode === 'pick'}
                      className={`${inputCls} ${
                        addressMode === 'pick' ? 'bg-[#faf5f0] cursor-default' : ''
                      }`}
                    />
                    <input
                      type="text"
                      value={floor}
                      onChange={(e) => handleAdditionalFieldChange('floor', e.target.value)}
                      placeholder="Этаж"
                      readOnly={addressMode === 'pick'}
                      className={`${inputCls} ${
                        addressMode === 'pick' ? 'bg-[#faf5f0] cursor-default' : ''
                      }`}
                    />
                    <input
                      type="text"
                      value={intercom}
                      onChange={(e) => handleAdditionalFieldChange('intercom', e.target.value)}
                      placeholder="Домофон"
                      readOnly={addressMode === 'pick'}
                      className={`${inputCls} ${
                        addressMode === 'pick' ? 'bg-[#faf5f0] cursor-default' : ''
                      }`}
                    />
                  </div>

                  {/* Interval cards */}
                  <div className="space-y-3 pt-2">
                    <p className="text-[11px] tracking-[0.12em] uppercase text-[#8a8a8a] font-medium">
                      Интервал доставки
                    </p>
                    {!zoneInfo ? (
                      <div className="rounded-2xl bg-[#faf5f0] border border-dashed border-[#e8e4de] px-5 py-6 text-center">
                        <p className="text-sm text-[#8a8a8a]">
                          Укажите адрес для расчёта доставки
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {zoneInfo.availableIntervals.includes('3h') && (
                          <IntervalCard
                            label="3-часовой интервал"
                            description={zoneInfo.estimatedTime ?? undefined}
                            price={
                              isFreeDelivery
                                ? 0
                                : zoneInfo.price3h ?? 0
                            }
                            selected={interval === '3h'}
                            onClick={() => setInterval('3h')}
                          >
                            <SlotPicker slots={SLOTS_3H} value={slot3h} onChange={setSlot3h} />
                          </IntervalCard>
                        )}
                        {zoneInfo.availableIntervals.includes('1h') &&
                          zoneInfo.price1h != null && (
                            <IntervalCard
                              label="Часовой интервал"
                              description="Узкое окно доставки"
                              price={
                                isFreeDelivery
                                  ? Math.max(0, zoneInfo.price1h - zoneInfo.price3h)
                                  : zoneInfo.price1h
                              }
                              selected={interval === '1h'}
                              onClick={() => setInterval('1h')}
                            >
                              <SlotPicker slots={SLOTS_1H} value={slot1h} onChange={setSlot1h} />
                            </IntervalCard>
                          )}
                        {zoneInfo.availableIntervals.includes('exact') &&
                          zoneInfo.priceExact != null && (
                            <IntervalCard
                              label="К точному времени"
                              description="Букет приедет минута в минуту"
                              price={
                                isFreeDelivery
                                  ? Math.max(0, zoneInfo.priceExact - zoneInfo.price3h)
                                  : zoneInfo.priceExact
                              }
                              selected={interval === 'exact'}
                              onClick={() => setInterval('exact')}
                            >
                              <div>
                                <select
                                  value={slotExact}
                                  onChange={(e) => setSlotExact(e.target.value)}
                                  className={`${inputCls} max-w-[200px]`}
                                >
                                  <option value="">Выберите время</option>
                                  {SLOTS_EXACT.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </IntervalCard>
                          )}
                      </div>
                    )}
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-[11px] tracking-[0.12em] uppercase text-[#8a8a8a] mb-2 font-medium">
                      Дата доставки
                    </label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      min={today}
                      className={`${inputCls} max-w-[260px] [color-scheme:light]`}
                    />
                  </div>
                </TabsContent>

                {/* Pickup tab */}
                <TabsContent value="pickup" className="space-y-5">
                  <div className="rounded-2xl bg-white border border-[#e8e4de] px-5 py-4 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#e8b4b8]/15 flex items-center justify-center shrink-0 mt-0.5">
                      <Store className="w-4 h-4 text-[#e8b4b8]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] tracking-[0.12em] uppercase text-[#8a8a8a] mb-1">
                        Адрес магазина
                      </p>
                      <p className="text-sm text-[#2d2d2d] font-medium">{SHOP_ADDRESS}</p>
                      <p className="text-xs text-[#8a8a8a] mt-1">Ежедневно с 9:00 до 21:00</p>
                    </div>
                  </div>

                  <div className="h-[220px] rounded-2xl overflow-hidden border border-[#e8e4de]">
                    <YandexMap
                      center={SHOP_COORDS}
                      zoom={15}
                      markerCoords={SHOP_COORDS}
                      markerTitle="FLEUR"
                      markerBody={SHOP_ADDRESS}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] tracking-[0.12em] uppercase text-[#8a8a8a] mb-2 font-medium">
                        Дата самовывоза
                      </label>
                      <input
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        min={today}
                        className={`${inputCls} [color-scheme:light]`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] tracking-[0.12em] uppercase text-[#8a8a8a] mb-2 font-medium">
                        Время самовывоза
                      </label>
                      <select
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className={inputCls}
                      >
                        <option value="">Выберите время</option>
                        {pickupTimeSlots.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </section>

            <div className="border-t border-[#e8e4de]" />

            {/* 4. Card */}
            <section>
              <SectionHeader
                icon={FileText}
                title="Открытка"
                complete={!showCard || cardText.trim().length > 0}
                rightSlot={<Toggle active={showCard} onChange={setShowCard} />}
              />
              {showCard ? (
                <div>
                  <textarea
                    value={cardText}
                    onChange={(e) => setCardText(e.target.value)}
                    placeholder="Текст поздравления для получателя…"
                    rows={4}
                    maxLength={500}
                    className={`${inputCls} resize-none`}
                  />
                  <p className="text-[11px] text-[#8a8a8a] mt-1.5 text-right">
                    {cardText.length}/500
                  </p>
                </div>
              ) : (
                <p className="text-sm text-[#8a8a8a]">
                  Бесплатная открытка — мы вложим её в букет
                </p>
              )}
            </section>

            <div className="border-t border-[#e8e4de]" />

            {/* 5. Comment */}
            <section>
              <SectionHeader
                icon={MessageSquare}
                title="Комментарий к заказу"
                complete={true}
              />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Напишите ваши пожелания"
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </section>
          </div>

          {/* RIGHT — Sticky summary (desktop only) */}
          <aside className="hidden lg:block lg:basis-[40%] lg:shrink-0">
            <div className="lg:sticky lg:top-8">
              <OrderSummary
                cart={cart}
                removeItem={removeItem}
                isLoading={isLoading}
                subtotal={subtotal}
                discount={discount}
                deliveryCost={baseDeliveryCost}
                intervalCost={intervalCost}
                isFreeDelivery={isFreeDelivery}
                addressSelected={addressSelected}
                pickupMode={mode === 'pickup'}
                total={total}
                promo={promo}
                promoCode={promoCode}
                setPromoCode={setPromoCode}
                applyPromo={applyPromo}
                promoLoading={promoLoading}
                promoMessage={promoMessage}
                bonusInput={bonusInput}
                setBonusInput={setBonusInput}
                applyAllBonus={applyAllBonus}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                canPay={canPay}
                payLabel={payLabel}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
