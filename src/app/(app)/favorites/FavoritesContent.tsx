'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import Link from 'next/link'
import { ProductCardShop } from '@/components/shop/ProductCardShop'
import { useFavorites } from '@/providers/FavoritesProvider'
import type { Product, Media, Variant, VariantOption } from '@/payload-types'

type ProductCardData = {
  id: number
  title: string
  slug: string
  priceInUSD?: number | null
  enableVariants?: boolean | null
  variantDisplayType?: 'size' | 'quantity' | null
  inventory?: number | null
  gallery?: {
    image: { url: string; alt?: string | null; width?: number | null; height?: number | null }
    variantOption?: { id: number } | number | null
  }[]
  variants?: {
    id: number
    priceInUSD?: number | null
    inventory?: number | null
    options: { id: number; label: string }[]
  }[]
  meta?: { image?: { url: string; alt?: string | null } | null } | null
}

function transformProduct(product: Product): ProductCardData {
  const gallery =
    product.gallery
      ?.filter((item) => typeof item.image === 'object' && item.image !== null)
      .map((item) => ({
        image: {
          url: (item.image as Media).url || '',
          alt: (item.image as Media).alt || null,
          width: (item.image as Media).width || null,
          height: (item.image as Media).height || null,
        },
        variantOption: item.variantOption
          ? typeof item.variantOption === 'object'
            ? { id: (item.variantOption as VariantOption).id }
            : item.variantOption
          : null,
      })) || []

  const variants =
    product.variants?.docs
      ?.filter((v): v is Variant => typeof v === 'object' && v !== null)
      .map((v) => ({
        id: v.id,
        priceInUSD: v.priceInUSD ?? null,
        inventory: v.inventory ?? null,
        options: (v.options || [])
          .filter((o): o is VariantOption => typeof o === 'object' && o !== null)
          .map((o) => ({ id: o.id, label: o.label })),
      })) || []

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    priceInUSD: product.priceInUSD ?? null,
    enableVariants: product.enableVariants ?? null,
    variantDisplayType: product.variantDisplayType ?? null,
    inventory: product.inventory ?? null,
    gallery,
    variants,
    meta: product.meta
      ? {
          image:
            typeof product.meta.image === 'object' && product.meta.image
              ? { url: product.meta.image.url || '', alt: product.meta.image.alt || null }
              : null,
        }
      : null,
  }
}

export function FavoritesContent() {
  const { favorites } = useFavorites()
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (favorites.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchProducts() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('depth', '2')
        params.set('limit', '50')
        // Payload REST API: where[id][in]=1,2,3
        params.set('where[id][in]', favorites.join(','))

        const res = await fetch(`/api/products?${params.toString()}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()

        if (!cancelled) {
          const transformed = (data.docs || []).map((p: Product) => transformProduct(p))
          setProducts(transformed)
        }
      } catch {
        if (!cancelled) setProducts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchProducts()
    return () => {
      cancelled = true
    }
  }, [favorites])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[3/4] w-full rounded-xl bg-[#f0ebe3]" />
            <div className="mt-3 space-y-2">
              <div className="h-4 w-3/4 rounded bg-[#f0ebe3]" />
              <div className="h-4 w-1/2 rounded bg-[#f0ebe3]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (favorites.length === 0 || products.length === 0) {
    return <EmptyFavorites />
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCardShop key={product.id} product={product} />
      ))}
    </div>
  )
}

function EmptyFavorites() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#f5f0ea]">
        <Heart className="h-10 w-10 text-[#e8b4b8]" strokeWidth={1} />
      </div>
      <h2 className="mb-2 font-[family-name:var(--font-playfair)] text-xl text-[#2d2d2d]">
        В избранном пока пусто
      </h2>
      <p className="mb-8 max-w-sm font-sans text-[14px] text-[#8a8a8a]">
        Нажмите на сердечко на карточке букета, чтобы добавить его в избранное
      </p>
      <Link
        href="/shop"
        className="inline-flex h-11 items-center rounded-full bg-[#e8b4b8] px-8 font-sans text-[14px] font-medium text-white transition-all duration-300 hover:bg-[#d9a0a5] hover:shadow-lg hover:shadow-[#e8b4b8]/25"
      >
        Перейти в каталог
      </Link>
    </div>
  )
}
