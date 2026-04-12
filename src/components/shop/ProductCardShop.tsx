'use client'

import { useState, useCallback, useMemo } from 'react'
import { Heart, ShoppingBag, Clock, Star } from 'lucide-react'
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

/**
 * Derive a compact label from the full variant options label.
 *
 * For "size" display: try to abbreviate ("Large" → "L", "Medium" → "M", "Small" → "S")
 * or use the first word if it's already short.
 *
 * For "quantity" display: extract the leading number ("25 роз" → "25", "51 шт" → "51")
 * or fall back to the raw label.
 */
function compactLabel(raw: string, displayType: 'size' | 'quantity'): string {
  const trimmed = raw.trim()

  if (displayType === 'quantity') {
    // Try to extract leading number
    const numMatch = trimmed.match(/^(\d+)/)
    if (numMatch) return numMatch[1]!
    return trimmed
  }

  // "size" mode — abbreviate known size words, else use first letter
  const lower = trimmed.toLowerCase()
  const abbreviations: Record<string, string> = {
    small: 'S',
    medium: 'M',
    large: 'L',
    'x-large': 'XL',
    'extra large': 'XL',
    xl: 'XL',
    xs: 'XS',
    'x-small': 'XS',
    маленький: 'S',
    средний: 'M',
    большой: 'L',
  }

  for (const [key, abbr] of Object.entries(abbreviations)) {
    if (lower.includes(key)) return abbr
  }

  // Already short (<=3 chars) — use as-is
  if (trimmed.length <= 3) return trimmed

  // Fall back to first word (truncated to 4 chars)
  const firstWord = trimmed.split(/[\s,]+/)[0] || trimmed
  return firstWord.length <= 4 ? firstWord : firstWord.slice(0, 3)
}

export function ProductCardShop({ product, deliveryTime, bonusPoints }: Props) {
  const { addItem, isLoading } = useCart()
  const { estimatedTime } = useDelivery()
  const resolvedDeliveryTime = deliveryTime ?? estimatedTime
  const { isFavorite, toggleFavorite } = useFavorites()
  const isWishlisted = isFavorite(product.id)
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const variants = product.variants || []
  const hasVariants = product.enableVariants && variants.length > 0
  const displayType = product.variantDisplayType ?? 'size'

  const currentPrice = useMemo(() => {
    if (hasVariants && variants[selectedVariantIndex]) {
      return variants[selectedVariantIndex]!.priceInUSD ?? product.priceInUSD ?? 0
    }
    return product.priceInUSD ?? 0
  }, [hasVariants, variants, selectedVariantIndex, product.priceInUSD])

  const selectedVariant = hasVariants ? variants[selectedVariantIndex] : undefined

  // Resolve image: if selected variant has a matched gallery image, use it
  const { mainImage, hoverImage } = useMemo(() => {
    const gallery = product.gallery || []
    let main = gallery[0]?.image || product.meta?.image || null
    let hover = gallery.length > 1 ? gallery[1]?.image || null : null

    if (hasVariants && selectedVariant && gallery.length > 0) {
      // Find gallery image matching selected variant's first option
      const optionIds = selectedVariant.options.map((o) => o.id)
      const variantImage = gallery.find((item) => {
        if (!item.variantOption) return false
        const voId =
          typeof item.variantOption === 'object' && 'id' in item.variantOption
            ? item.variantOption.id
            : item.variantOption
        return optionIds.includes(voId as number)
      })
      if (variantImage?.image?.url) {
        main = variantImage.image
        // Find a different image for hover
        const otherImage = gallery.find(
          (item) => item.image?.url && item.image.url !== variantImage.image.url,
        )
        hover = otherImage?.image || null
      }
    }

    return { mainImage: main, hoverImage: hover }
  }, [product.gallery, product.meta, hasVariants, selectedVariant])

  // Compact labels for the switcher — deduplicated and sorted
  const { uniqueLabels, labelToVariantIndex } = useMemo(() => {
    const sizeOrder: Record<string, number> = { XS: 0, S: 1, M: 2, L: 3, XL: 4, XXL: 5 }
    const seen = new Map<string, number>() // label → first variant index
    for (let i = 0; i < variants.length; i++) {
      const fullLabel = variants[i]!.options.map((o) => o.label).join(', ')
      const label = compactLabel(fullLabel, displayType)
      if (!seen.has(label)) seen.set(label, i)
    }
    const entries = [...seen.entries()].sort((a, b) => {
      const aNum = parseFloat(a[0])
      const bNum = parseFloat(b[0])
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum
      return (sizeOrder[a[0].toUpperCase()] ?? 99) - (sizeOrder[b[0].toUpperCase()] ?? 99)
    })
    return {
      uniqueLabels: entries.map(([label]) => label),
      labelToVariantIndex: new Map(entries),
    }
  }, [variants, displayType])

  const computedBonus = bonusPoints ?? Math.round(currentPrice * 0.05)

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

  const handleWishlist = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      toggleFavorite(product.id)
    },
    [toggleFavorite, product.id],
  )

  const handleVariantClick = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedVariantIndex(index)
  }, [])

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#f5f0ea]">
        {mainImage?.url ? (
          <>
            <Image
              src={mainImage.url}
              alt={mainImage.alt || product.title}
              fill
              className={cn(
                'object-cover transition-all duration-700 ease-out',
                isHovered && hoverImage ? 'opacity-0 scale-[1.02]' : 'opacity-100 scale-100',
              )}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {hoverImage?.url && (
              <Image
                src={hoverImage.url}
                alt={hoverImage.alt || product.title}
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
          <span className="font-sans text-[11px] font-medium text-[#5a5a5a]">
            {resolvedDeliveryTime}
          </span>
        </div>
      </div>

      {/* Content — fixed zones for equal card heights in a row */}
      <div className="mt-3.5 flex flex-1 flex-col px-0.5">
        {/* Title — fixed zone: 2 lines max */}
        <h3 className="min-h-[40px] mb-2 line-clamp-2 font-sans text-[14px] leading-[1.4] text-[#2d2d2d] lg:text-[15px]">
          {product.title}
        </h3>

        {/* Variants — fixed zone: always reserves space */}
        <div className="min-h-[32px] mb-2.5">
          {hasVariants && uniqueLabels.length > 1 && (
            <div className="flex items-center gap-1 overflow-hidden">
              {uniqueLabels.map((label) => {
                const variantIdx = labelToVariantIndex.get(label)!
                return (
                  <button
                    key={label}
                    onClick={(e) => handleVariantClick(e, variantIdx)}
                    className={cn(
                      'shrink-0 cursor-pointer rounded-full px-2.5 py-1 font-sans text-[12px] font-medium tabular-nums transition-all duration-200',
                      variantIdx === selectedVariantIndex
                        ? 'bg-[#2d2d2d] text-[#faf5f0]'
                        : 'border border-[#e0dbd4] text-[#5a5a5a] hover:border-[#c8c3bb]',
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Bonus — fixed zone: always reserves space */}
        <div className="min-h-[20px] mb-2">
          {computedBonus > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-[#e8b4b8] text-[#e8b4b8]" />
              <span className="font-sans text-[11px] text-[#b0a99e]">+{computedBonus} баллов</span>
            </div>
          )}
        </div>

        {/* Price + Cart button — always at bottom */}
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
