import type { Media, Product } from '@/payload-types'

import { ProductGallery } from '@/components/product/ProductGallery'
import { ProductInfo } from '@/components/product/ProductInfo'
import { ProductCardShop } from '@/components/shop/ProductCardShop'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { ProductJsonLd } from '@/components/product/ProductJsonLd'
import { FloatingCartButton } from '@/components/product/FloatingCartButton'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React, { Suspense } from 'react'
import { Metadata } from 'next'
import { ChevronRight } from 'lucide-react'

type Args = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const product = await queryProductBySlug({ slug })

  if (!product) return notFound()

  const gallery = product.gallery?.filter((item) => typeof item.image === 'object') || []
  const metaImage = typeof product.meta?.image === 'object' ? product.meta?.image : undefined
  const canIndex = product._status === 'published'
  const seoImage = metaImage || (gallery.length ? (gallery[0]?.image as Media) : undefined)

  return {
    description: product.meta?.description || '',
    openGraph: seoImage?.url
      ? {
          images: [
            {
              alt: seoImage?.alt,
              height: seoImage.height!,
              url: seoImage?.url,
              width: seoImage.width!,
            },
          ],
        }
      : null,
    robots: {
      follow: canIndex,
      googleBot: { follow: canIndex, index: canIndex },
      index: canIndex,
    },
    title: `${product.meta?.title || product.title} — FLEUR`,
  }
}

export default async function ProductPage({ params }: Args) {
  const { slug } = await params
  const product = await queryProductBySlug({ slug })

  if (!product) return notFound()

  const gallery =
    product.gallery
      ?.filter((item) => typeof item.image === 'object')
      .map((item) => ({
        ...item,
        image: item.image as Media,
      })) || []

  const metaImage = typeof product.meta?.image === 'object' ? product.meta?.image : undefined
  const hasStock = product.enableVariants
    ? product?.variants?.docs?.some((variant) => {
        if (typeof variant !== 'object') return false
        return variant.inventory && variant?.inventory > 0
      })
    : product.inventory! > 0

  let price = product.priceInUSD
  if (product.enableVariants && product?.variants?.docs?.length) {
    price = product?.variants?.docs?.reduce((acc, variant) => {
      if (typeof variant === 'object' && variant?.priceInUSD && acc && variant?.priceInUSD > acc) {
        return variant.priceInUSD
      }
      return acc
    }, price)
  }

  const relatedProducts =
    product.relatedProducts?.filter((p) => typeof p === 'object') as Product[] ?? []

  return (
    <React.Fragment>
      <ProductJsonLd
        name={product.title}
        description=""
        imageUrl={metaImage?.url || ''}
        price={price || 0}
        inStock={!!hasStock}
      />

      <div className="min-h-screen bg-[#faf5f0]">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="mb-6 flex items-center gap-1.5 font-sans text-[13px] text-[#8a8a8a]">
            <Link href="/" className="transition-colors hover:text-[#2d2d2d]">
              Главная
            </Link>
            <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
            <Link href="/shop" className="transition-colors hover:text-[#2d2d2d]">
              Каталог
            </Link>
            <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
            <span className="text-[#2d2d2d]">{product.title}</span>
          </nav>

          {/* Main content: Gallery + Info */}
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-12 xl:gap-16">
            {/* Left: Gallery */}
            <div className="w-full lg:w-[55%] xl:w-[58%]">
              <Suspense
                fallback={
                  <div className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-[#f0ebe3]" />
                }
              >
                {gallery.length > 0 && <ProductGallery gallery={gallery} />}
              </Suspense>
            </div>

            {/* Right: Product info */}
            <div className="w-full lg:w-[45%] xl:w-[42%]">
              <div className="lg:sticky lg:top-24">
                <Suspense fallback={<ProductInfoSkeleton />}>
                  <ProductInfo product={product} />
                </Suspense>
              </div>
            </div>
          </div>

          {/* Layout blocks */}
          {product.layout?.length ? (
            <div className="mt-16">
              <RenderBlocks blocks={product.layout} />
            </div>
          ) : null}

          {/* Related products */}
          {relatedProducts.length > 0 && (
            <RelatedProducts products={relatedProducts} />
          )}
        </div>
      </div>

      {/* Mobile floating add-to-cart — appears when inline button scrolls off */}
      <Suspense fallback={null}>
        <FloatingCartButton
          productId={product.id}
          price={price || 0}
          inStock={!!hasStock}
        />
      </Suspense>
    </React.Fragment>
  )
}

function RelatedProducts({ products }: { products: Product[] }) {
  return (
    <div className="mt-16 border-t border-[#e8e4de] pt-12">
      <h2 className="mb-8 font-[family-name:var(--font-playfair)] text-2xl font-medium text-[#2d2d2d] lg:text-[28px]">
        Вам также понравится
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {products.slice(0, 4).map((product) => {
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
                    ? { id: (item.variantOption as any).id }
                    : item.variantOption
                  : null,
              })) || []

          return (
            <ProductCardShop
              key={product.id}
              product={{
                id: product.id,
                title: product.title,
                slug: product.slug,
                priceInUSD: product.priceInUSD ?? null,
                enableVariants: product.enableVariants ?? null,
                variantDisplayType: product.variantDisplayType ?? null,
                inventory: product.inventory ?? null,
                gallery,
                variants: [],
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

function ProductInfoSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-3/4 animate-pulse rounded-lg bg-[#f0ebe3]" />
      <div className="h-8 w-40 animate-pulse rounded-lg bg-[#f0ebe3]" />
      <div className="h-12 w-full animate-pulse rounded-lg bg-[#f0ebe3]" />
      <div className="h-10 w-48 animate-pulse rounded-lg bg-[#f0ebe3]" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-16 animate-pulse rounded-full bg-[#f0ebe3]" />
        ))}
      </div>
      <div className="flex gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-10 animate-pulse rounded-full bg-[#f0ebe3]" />
        ))}
      </div>
      <div className="h-14 w-full animate-pulse rounded-full bg-[#f0ebe3]" />
    </div>
  )
}

const queryProductBySlug = async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'products',
    depth: 3,
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      and: [
        { slug: { equals: slug } },
        ...(draft ? [] : [{ _status: { equals: 'published' } }]),
      ],
    },
    populate: {
      variants: {
        title: true,
        priceInUSD: true,
        inventory: true,
        options: true,
      },
    },
  })

  return result.docs?.[0] || null
}
