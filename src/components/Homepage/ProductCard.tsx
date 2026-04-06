'use client'

import { useState, useCallback, useMemo } from 'react'
import { Heart, ShoppingBag, Clock } from 'lucide-react'
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
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(price)
}

export function ProductCard({ product, deliveryTime }: Props) {
  const { addItem, isLoading } = useCart()
  const { estimatedTime } = useDelivery()
  const resolvedDeliveryTime = deliveryTime ?? estimatedTime
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)

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

  // Extract pill labels from variant options
  const variantPills = useMemo(() => {
    return variants.map((v) => {
      const label = v.options.map((o) => o.label).join(', ')
      return label || `Вариант ${v.id}`
    })
  }, [variants])

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#f5f0ea]">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt || product.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-20 w-20 rounded-full bg-[#e8b4b8]/10" />
          </div>
        )}

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className={cn(
            'absolute right-3 top-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-all duration-200',
            isWishlisted
              ? 'bg-[#e8b4b8] text-white shadow-md'
              : 'bg-white/80 text-[#8a8a8a] shadow-sm backdrop-blur-sm hover:bg-white hover:text-[#e8b4b8]',
          )}
          aria-label="Добавить в избранное"
        >
          <Heart
            className="h-4 w-4"
            strokeWidth={1.5}
            fill={isWishlisted ? 'currentColor' : 'none'}
          />
        </button>

        {/* Delivery time badge */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 shadow-sm backdrop-blur-sm">
          <Clock className="h-3 w-3 text-[#8a8a8a]" strokeWidth={1.5} />
          <span className="font-sans text-[11px] text-[#5a5a5a]">{resolvedDeliveryTime}</span>
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 flex flex-1 flex-col px-0.5">
        {/* Title */}
        <h3 className="mb-2 line-clamp-2 font-sans text-[14px] leading-snug text-[#2d2d2d] lg:text-[15px]">
          {product.title}
        </h3>

        {/* Variant pills */}
        {hasVariants && variantPills.length > 0 && (
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {variantPills.map((label, i) => (
              <button
                key={variants[i]!.id}
                onClick={(e) => handleVariantClick(e, i)}
                className={cn(
                  'cursor-pointer rounded-full px-3 py-1 font-sans text-[11px] transition-all duration-200',
                  i === selectedVariantIndex
                    ? 'bg-[#2d2d2d] text-white'
                    : 'bg-[#f0ebe3] text-[#5a5a5a] hover:bg-[#e8e4de]',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Price + Add to cart */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="font-sans text-[16px] font-semibold text-[#2d2d2d] lg:text-[17px]">
            {formatPrice(currentPrice)} &#8381;
          </span>

          <button
            onClick={handleAddToCart}
            disabled={isLoading}
            className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-[#e8b4b8] px-4 font-sans text-[12px] font-medium text-white transition-all duration-200 hover:bg-[#d9a0a5] hover:shadow-md hover:shadow-[#e8b4b8]/20 disabled:opacity-50"
          >
            <ShoppingBag className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="hidden sm:inline">В корзину</span>
          </button>
        </div>
      </div>
    </Link>
  )
}
