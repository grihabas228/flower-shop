'use client'

import { useState, useCallback, useMemo } from 'react'
import { Heart, ShoppingBag, Clock, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { toast } from 'sonner'
import { cn } from '@/utilities/cn'
import { useDelivery } from '@/providers/DeliveryProvider'

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

type ProductCardData = {
  id: number
  title: string
  slug: string
  priceInUSD?: number | null
  enableVariants?: boolean | null
  inventory?: number | null
  gallery?: Array<{
    image: {
      url: string
      alt?: string | null
      width?: number | null
      height?: number | null
    }
  }> | null
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

export function ProductCardShop({ product, deliveryTime, bonusPoints }: Props) {
  const { addItem, isLoading } = useCart()
  const { estimatedTime } = useDelivery()
  const resolvedDeliveryTime = deliveryTime ?? estimatedTime
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const variants = product.variants || []
  const hasVariants = product.enableVariants && variants.length > 0

  const currentPrice = useMemo(() => {
    if (hasVariants && variants[selectedVariantIndex]) {
      return variants[selectedVariantIndex]!.priceInUSD ?? product.priceInUSD ?? 0
    }
    return product.priceInUSD ?? 0
  }, [hasVariants, variants, selectedVariantIndex, product.priceInUSD])

  const selectedVariant = hasVariants ? variants[selectedVariantIndex] : undefined

  const image = useMemo(() => {
    const galleryImage = product.gallery?.[0]?.image
    if (galleryImage?.url) return galleryImage
    if (product.meta?.image?.url) return product.meta.image
    return null
  }, [product.gallery, product.meta])

  // Second image for hover effect
  const secondImage = useMemo(() => {
    if (product.gallery && product.gallery.length > 1) {
      return product.gallery[1]?.image || null
    }
    return null
  }, [product.gallery])

  const handleAddToCart = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      try {
        await addItem({
          product: product.id,
          variant: selectedVariant?.id ?? undefined,
        })
        toast.success('Добавлено в корзину')
      } catch {
        toast.error('Ошибка при добавлении')
      }
    },
    [addItem, product.id, selectedVariant],
  )

  const handleWishlist = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsWishlisted((prev) => !prev)
  }, [])

  const handleVariantClick = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedVariantIndex(index)
  }, [])

  // Variant pill labels
  const variantPills = useMemo(() => {
    return variants.map((v) => {
      const label = v.options.map((o) => o.label).join(', ')
      return label || `Вариант ${v.id}`
    })
  }, [variants])

  const computedBonus = bonusPoints ?? Math.round(currentPrice * 0.05)

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#f5f0ea]">
        {image ? (
          <>
            <Image
              src={image.url}
              alt={image.alt || product.title}
              fill
              className={cn(
                'object-cover transition-all duration-700 ease-out',
                isHovered && secondImage ? 'opacity-0 scale-[1.02]' : 'opacity-100 scale-100',
              )}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {secondImage && (
              <Image
                src={secondImage.url}
                alt={secondImage.alt || product.title}
                fill
                className={cn(
                  'object-cover transition-all duration-700 ease-out',
                  isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]',
                )}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-20 w-20 rounded-full bg-[#e8b4b8]/10" />
          </div>
        )}

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className={cn(
            'absolute right-3 top-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-all duration-200',
            isWishlisted
              ? 'bg-[#e8b4b8] text-white shadow-md'
              : 'bg-white/90 text-[#8a8a8a] shadow-sm backdrop-blur-sm hover:bg-white hover:text-[#e8b4b8]',
          )}
          aria-label="Добавить в избранное"
        >
          <Heart
            className="h-4 w-4"
            strokeWidth={1.5}
            fill={isWishlisted ? 'currentColor' : 'none'}
          />
        </button>

        {/* Delivery badge */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-sm">
          <Clock className="h-3.5 w-3.5 text-[#8a8a8a]" strokeWidth={1.5} />
          <span className="font-sans text-[11px] font-medium text-[#5a5a5a]">{resolvedDeliveryTime}</span>
        </div>
      </div>

      {/* Content */}
      <div className="mt-3.5 flex flex-1 flex-col px-0.5">
        {/* Title */}
        <h3 className="mb-2 line-clamp-2 font-sans text-[14px] leading-[1.4] text-[#2d2d2d] lg:text-[15px]">
          {product.title}
        </h3>

        {/* Variant pills — mobile: max 3 visible + "+ещё N" overflow badge */}
        {hasVariants && variantPills.length > 0 && (
          <VariantPillsRow
            pills={variantPills}
            variants={variants}
            selectedIndex={selectedVariantIndex}
            onSelect={handleVariantClick}
          />
        )}

        {/* Bonus points */}
        {computedBonus > 0 && (
          <div className="mb-2 flex items-center gap-1">
            <Star className="h-3 w-3 fill-[#e8b4b8] text-[#e8b4b8]" />
            <span className="font-sans text-[11px] text-[#b0a99e]">+{computedBonus} баллов</span>
          </div>
        )}

        {/* Price + Cart button */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="font-sans text-[17px] font-semibold tracking-tight text-[#2d2d2d] lg:text-[18px]">
            {formatPrice(currentPrice)}&nbsp;&#8381;
          </span>

          <button
            onClick={handleAddToCart}
            disabled={isLoading}
            className={cn(
              'flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-[#e8b4b8] px-4 font-sans text-[12px] font-medium text-white transition-all duration-300',
              'hover:bg-[#d9a0a5] hover:shadow-lg hover:shadow-[#e8b4b8]/25 active:scale-95',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="hidden sm:inline">В корзину</span>
          </button>
        </div>
      </div>
    </Link>
  )
}

// ─── Mobile-aware variant pills with overflow ───────────────────────────────

const MOBILE_MAX_PILLS = 3

type VariantPillsRowProps = {
  pills: string[]
  variants: Array<{ id: number }>
  selectedIndex: number
  onSelect: (e: React.MouseEvent, index: number) => void
}

function VariantPillsRow({ pills, variants, selectedIndex, onSelect }: VariantPillsRowProps) {
  const overflow = pills.length - MOBILE_MAX_PILLS

  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {pills.map((label, i) => {
        // On mobile (<sm) hide pills beyond MOBILE_MAX_PILLS
        // Exception: always show the selected pill
        const hiddenOnMobile = i >= MOBILE_MAX_PILLS && i !== selectedIndex
        return (
          <button
            key={variants[i]!.id}
            onClick={(e) => onSelect(e, i)}
            className={cn(
              'cursor-pointer rounded-full border px-3 py-1 font-sans text-[11px] font-medium transition-all duration-200',
              i === selectedIndex
                ? 'border-[#2d2d2d] bg-[#2d2d2d] text-white'
                : 'border-[#e0dbd4] bg-white text-[#5a5a5a] hover:border-[#c8c3bb]',
              hiddenOnMobile && 'hidden sm:inline-flex',
            )}
          >
            {label}
          </button>
        )
      })}
      {/* Overflow badge — mobile only */}
      {overflow > 0 && (
        <span className="inline-flex items-center rounded-full border border-[#e0dbd4] bg-[#faf5f0] px-2.5 py-1 font-sans text-[11px] text-[#8a8a8a] sm:hidden">
          +ещё&nbsp;{overflow}
        </span>
      )}
    </div>
  )
}
