'use client'

import { useMemo, useCallback } from 'react'
import { Heart, ShoppingBag, Clock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/utilities/cn'
import { useDelivery } from '@/providers/DeliveryProvider'
import { useFavorites } from '@/providers/FavoritesProvider'
import { useOptimisticCart } from '@/providers/OptimisticCartProvider'

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
  return price.toLocaleString('ru-RU')
}

export function ProductCardShop({ product }: Props) {
  const { addToCart, increment, decrement, getQty, isHydrated } = useOptimisticCart()
  const { estimatedTime, hasAddress } = useDelivery()
  const { isFavorite, toggleFavorite } = useFavorites()
  const isWishlisted = isFavorite(product.id)

  const variants = product.variants || []
  const hasVariants = product.enableVariants && variants.length > 0

  const displayPrice = useMemo(() => {
    if (hasVariants && variants.length > 0) {
      const prices = variants.map((v) => v.priceInUSD ?? 0).filter((p) => p > 0)
      return prices.length > 0 ? Math.min(...prices) : (product.priceInUSD ?? 0)
    }
    return product.priceInUSD ?? 0
  }, [hasVariants, variants, product.priceInUSD])

  const defaultVariantId = hasVariants ? variants[0]?.id : undefined

  const mainImage = useMemo(() => {
    const gallery = product.gallery || []
    return gallery[0]?.image || product.meta?.image || null
  }, [product.gallery, product.meta])

  const deliveryDisplay = hasAddress ? estimatedTime : 'от 2 ч'

  const orderCount = useMemo(() => {
    const seed = product.id * 7 + 13
    return 20 + (seed % 180)
  }, [product.id])

  // Instant from optimistic provider — no server wait
  const qty = getQty(product.id)
  const inCart = isHydrated && qty > 0

  const handleAdd = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product.id, defaultVariantId)
  }, [addToCart, product.id, defaultVariantId])

  const handleIncrement = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    increment(product.id)
  }, [increment, product.id])

  const handleDecrement = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    decrement(product.id)
  }, [decrement, product.id])

  const handleWishlist = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(product.id)
  }, [toggleFavorite, product.id])

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-[16px] bg-[#fffefa]',
        'border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
        'transition-[transform,box-shadow] duration-200 ease-out',
        'hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]',
      )}
    >
      {/* PHOTO */}
      <Link href={`/products/${product.slug}`} className="relative aspect-[3/4] w-full bg-[#f5f0ea]">
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

        <button
          onClick={handleWishlist}
          className={cn(
            'absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150',
            isWishlisted
              ? 'bg-[#e8b4b8] text-white'
              : 'bg-white/80 text-[#999] backdrop-blur-[4px] hover:text-[#e8b4b8]',
          )}
          aria-label="Добавить в избранное"
        >
          <Heart className="h-[14px] w-[14px]" strokeWidth={1.8} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>
      </Link>

      {/* Card body */}
      <div className="flex flex-1 flex-col">
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 px-3 pt-2.5 font-sans text-[13px] font-semibold leading-[1.3] text-[#2d2d2d]">
            {product.title}
          </h3>
        </Link>

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

        {/* BUTTON — instant state from OptimisticCartProvider */}
        <div className="mt-auto px-3 pb-3">
          {inCart ? (
            <div className="flex h-[42px] w-full items-center rounded-xl bg-[#2d2d2d] font-sans">
              <button
                onClick={handleDecrement}
                className="flex h-full w-11 shrink-0 items-center justify-center text-[#faf5f0]/70 hover:text-[#faf5f0]"
                aria-label="Уменьшить"
              >
                <span className="text-[20px] leading-none">−</span>
              </button>
              <span className="flex-1 text-center text-[15px] font-bold tabular-nums tracking-[0.5px] text-[#faf5f0]">
                {qty}
              </span>
              <button
                onClick={handleIncrement}
                className="flex h-full w-11 shrink-0 items-center justify-center text-[#faf5f0]/70 hover:text-[#faf5f0]"
                aria-label="Увеличить"
              >
                <span className="text-[20px] leading-none">+</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className={cn(
                'flex h-[42px] w-full items-center justify-between rounded-xl bg-[#2d2d2d] px-4 font-sans',
                'transition-colors duration-150 hover:bg-[#e8b4b8]',
              )}
            >
              <span className="text-[15px] font-bold tracking-[0.5px] text-[#faf5f0]">
                {formatPrice(displayPrice)}&nbsp;&#8381;
              </span>
              <ShoppingBag className="h-4 w-4 text-[#faf5f0]/70" strokeWidth={1.8} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
