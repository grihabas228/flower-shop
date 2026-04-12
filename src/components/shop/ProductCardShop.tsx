'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Heart, ShoppingBag, Clock, Check, Minus, Plus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { toast } from 'sonner'
import { cn } from '@/utilities/cn'
import { useDelivery } from '@/providers/DeliveryProvider'
import { useFavorites } from '@/providers/FavoritesProvider'

type VariantOption = {
  id: number
  label: string
}

type ProductVariant = {
  id: number
  priceInUSD?: number | null
  inventory?: number | null
  options: VariantOption[]
}

type GalleryItem = {
  image: {
    url: string
    alt?: string | null
    width?: number | null
    height?: number | null
  }
  variantOption?: { id: number } | number | null
}

type ProductCardData = {
  id: number
  title: string
  slug: string
  priceInUSD?: number | null
  enableVariants?: boolean | null
  variantDisplayType?: 'size' | 'quantity' | null
  inventory?: number | null
  gallery?: GalleryItem[] | null
  variants?: ProductVariant[]
  meta?: {
    image?: { url: string; alt?: string | null } | null
  } | null
}

type Props = {
  product: ProductCardData
  deliveryTime?: string
  bonusPoints?: number
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(price)
}

export function ProductCardShop({ product }: Props) {
  const { addItem, cart, incrementItem, decrementItem, removeItem } = useCart()
  const { estimatedTime, hasAddress } = useDelivery()
  const { isFavorite, toggleFavorite } = useFavorites()
  const isWishlisted = isFavorite(product.id)

  // Local loading state — isolated per card
  const [isAdding, setIsAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  const variants = product.variants || []
  const hasVariants = product.enableVariants && variants.length > 0

  const { displayPrice, hasMultiplePrices } = useMemo(() => {
    if (!hasVariants || variants.length === 0) {
      return { displayPrice: product.priceInUSD ?? 0, hasMultiplePrices: false }
    }
    const prices = variants.map((v) => v.priceInUSD ?? 0).filter((p) => p > 0)
    if (prices.length === 0) return { displayPrice: product.priceInUSD ?? 0, hasMultiplePrices: false }
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    return { displayPrice: min, hasMultiplePrices: min !== max }
  }, [hasVariants, variants, product.priceInUSD])

  const defaultVariant = hasVariants ? variants[0] : undefined

  const mainImage = useMemo(() => {
    const gallery = product.gallery || []
    return gallery[0]?.image || product.meta?.image || null
  }, [product.gallery, product.meta])

  const deliveryDisplay = hasAddress ? estimatedTime : 'от 2 ч'

  const orderCount = useMemo(() => {
    const seed = product.id * 7 + 13
    return 20 + (seed % 180)
  }, [product.id])

  // Find this product in cart
  const cartItem = useMemo(() => {
    if (!cart?.items?.length) return null
    return cart.items.find((item) => {
      if (!item.product) return false
      const pid = typeof item.product === 'object' ? item.product.id : item.product
      return pid === product.id
    }) ?? null
  }, [cart, product.id])

  const inCart = !!cartItem && (cartItem.quantity || 0) > 0
  const cartQuantity = cartItem?.quantity || 0

  // Clear justAdded after 600ms
  useEffect(() => {
    if (!justAdded) return
    const timer = setTimeout(() => setJustAdded(false), 600)
    return () => clearTimeout(timer)
  }, [justAdded])

  const handleAddToCart = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (isAdding) return
      setIsAdding(true)
      try {
        await addItem({
          product: product.id,
          variant: defaultVariant?.id ?? undefined,
        })
        setJustAdded(true)
        toast.success('Добавлено в корзину')
      } catch {
        toast.error('Ошибка при добавлении')
      } finally {
        setIsAdding(false)
      }
    },
    [addItem, product.id, defaultVariant, isAdding],
  )

  const handleIncrement = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (cartItem?.id) incrementItem(cartItem.id)
    },
    [incrementItem, cartItem],
  )

  const handleDecrement = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!cartItem?.id) return
      if (cartQuantity <= 1) {
        removeItem(cartItem.id)
      } else {
        decrementItem(cartItem.id)
      }
    },
    [decrementItem, removeItem, cartItem, cartQuantity],
  )

  const handleWishlist = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      toggleFavorite(product.id)
    },
    [toggleFavorite, product.id],
  )

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-[16px] bg-[#fffefa] transition-all duration-250 ease-out',
        'border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
        'hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]',
      )}
    >
      {/* 1. PHOTO */}
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-[3/4] w-full bg-[#f5f0ea] active:scale-[0.97] transition-transform duration-150"
      >
        {mainImage?.url ? (
          <Image
            src={mainImage.url}
            alt={mainImage.alt || product.title}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-[#e8b4b8]/10" />
          </div>
        )}

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className={cn(
            'absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200',
            isWishlisted
              ? 'bg-[#e8b4b8] text-white'
              : 'bg-white/80 text-[#999] backdrop-blur-[4px] hover:text-[#e8b4b8]',
          )}
          aria-label="Добавить в избранное"
        >
          <Heart
            className="h-[14px] w-[14px]"
            strokeWidth={1.8}
            fill={isWishlisted ? 'currentColor' : 'none'}
          />
        </button>
      </Link>

      {/* Card body */}
      <div className="flex flex-1 flex-col">
        {/* 2. TITLE */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 px-3 pt-2.5 font-sans text-[13px] font-semibold leading-[1.3] text-[#2d2d2d]">
            {product.title}
          </h3>
        </Link>

        {/* 3. INFO ROW */}
        <div className="mx-3 mt-1.5 mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-[#aaa]" strokeWidth={1.5} />
            <span className="font-sans text-[11px] font-medium text-[#888]">{deliveryDisplay}</span>
          </span>
          <span className="flex items-center gap-1">
            <ShoppingBag className="h-3.5 w-3.5 text-[#aaa]" strokeWidth={1.5} />
            <span className="font-sans text-[11px] font-medium text-[#888]">{orderCount}</span>
          </span>
        </div>

        {/* 4. PRICE BUTTON / QUANTITY CONTROL */}
        <div className="mt-auto px-3 pb-3">
          {/* Just added — success flash */}
          {justAdded ? (
            <div className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#e8b4b8] font-sans transition-all duration-200 sm:h-10">
              <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
              <span className="text-[13px] font-semibold text-white">Добавлено</span>
            </div>
          ) : inCart ? (
            /* Quantity control */
            <div className="flex h-9 w-full items-center rounded-xl bg-[#2d2d2d] font-sans sm:h-10">
              <button
                onClick={handleDecrement}
                className="flex h-full w-10 shrink-0 items-center justify-center text-[#faf5f0] transition-opacity hover:opacity-70 active:scale-90 sm:w-11"
                aria-label="Уменьшить"
              >
                <Minus className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
              <span className="flex-1 text-center text-[14px] font-bold tabular-nums text-[#faf5f0] sm:text-[15px]">
                {cartQuantity}
              </span>
              <button
                onClick={handleIncrement}
                className="flex h-full w-10 shrink-0 items-center justify-center text-[#faf5f0] transition-opacity hover:opacity-70 active:scale-90 sm:w-11"
                aria-label="Увеличить"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          ) : (
            /* Default price button */
            <button
              onClick={handleAddToCart}
              disabled={isAdding}
              className={cn(
                'flex h-9 w-full items-center justify-between rounded-xl bg-[#2d2d2d] px-3.5 font-sans transition-all duration-250',
                'hover:bg-[#e8b4b8] active:scale-[0.98]',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                'sm:h-10',
              )}
            >
              <span className="text-[14px] font-bold text-[#faf5f0] sm:text-[15px]">
                {hasMultiplePrices && 'от '}
                {formatPrice(displayPrice)}&nbsp;&#8381;
              </span>
              <ShoppingBag className="h-4 w-4 text-[#faf5f0]" strokeWidth={1.8} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
