import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { HeroSection } from '@/components/Homepage/HeroSection'
import { CategoriesSection } from '@/components/Homepage/CategoriesSection'
import { PopularProducts } from '@/components/Homepage/PopularProducts'
import { BenefitsSection } from '@/components/Homepage/BenefitsSection'
import { ConstructorBanner } from '@/components/Homepage/ConstructorBanner'
import { ReviewsCarousel } from '@/components/Homepage/ReviewsCarousel'

export const metadata: Metadata = {
  title: 'FLEUR — Доставка изысканных букетов по Москве',
  description:
    'Премиальная доставка цветов по Москве. Свежие букеты, бесплатная открытка, доставка от 2 часов. Собери свой идеальный букет.',
  openGraph: {
    title: 'FLEUR — Доставка изысканных букетов по Москве',
    description:
      'Премиальная доставка цветов по Москве. Свежие букеты, бесплатная открытка, доставка от 2 часов.',
  },
}

export default async function HomePage() {
  const payload = await getPayload({ config: configPromise })

  // Fetch all data in parallel
  const [promoSlidesResult, categoriesResult, productsResult, reviewsResult] = await Promise.all([
    payload.find({
      collection: 'promo-slides',
      where: { active: { equals: true } },
      sort: 'sortOrder',
      limit: 10,
    }),
    payload.find({
      collection: 'product-categories',
      sort: 'sortOrder',
      limit: 10,
    }),
    payload.find({
      collection: 'products',
      limit: 8,
      sort: '-createdAt',
      where: {
        _status: { equals: 'published' },
      },
      depth: 2,
    }),
    payload.find({
      collection: 'reviews',
      where: { approved: { equals: true } },
      sort: '-createdAt',
      limit: 12,
    }),
  ])

  // Transform PromoSlides for client component
  const slides = promoSlidesResult.docs.map((slide) => ({
    id: slide.id,
    title: slide.title,
    subtitle: slide.subtitle ?? null,
    image:
      slide.image && typeof slide.image === 'object'
        ? { url: slide.image.url ?? '', alt: slide.image.alt ?? null }
        : null,
    buttonText: slide.buttonText ?? null,
    buttonLink: slide.buttonLink ?? null,
  }))

  // Transform Categories
  const categories = categoriesResult.docs.map((cat) => ({
    id: cat.id,
    title: cat.title,
    slug: cat.slug ?? '',
    image:
      cat.image && typeof cat.image === 'object'
        ? { url: cat.image.url ?? '', alt: cat.image.alt ?? null }
        : null,
    description: cat.description ?? null,
  }))

  // Transform Products for client ProductCard
  const products = productsResult.docs.map((product) => {
    const gallery = (product.gallery ?? [])
      .filter((item) => item.image && typeof item.image === 'object')
      .map((item) => ({
        image: {
          url: (item.image as { url?: string }).url ?? '',
          alt: (item.image as { alt?: string | null }).alt ?? null,
        },
      }))

    const variants = (product.variants?.docs ?? [])
      .filter((v): v is Exclude<typeof v, number> => typeof v === 'object' && v !== null)
      .map((v) => ({
        id: v.id,
        priceInUSD: v.priceInUSD ?? null,
        inventory: v.inventory ?? null,
        options: (v.options ?? [])
          .filter((o): o is Exclude<typeof o, number> => typeof o === 'object' && o !== null)
          .map((o) => ({
            id: o.id,
            label: (o as { label?: string }).label ?? '',
          })),
      }))

    const metaImage =
      product.meta?.image && typeof product.meta.image === 'object'
        ? { url: product.meta.image.url ?? '', alt: product.meta.image.alt ?? null }
        : null

    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      priceInUSD: product.priceInUSD ?? null,
      enableVariants: product.enableVariants ?? null,
      inventory: product.inventory ?? null,
      gallery,
      variants,
      meta: metaImage ? { image: metaImage } : null,
    }
  })

  // Transform Reviews
  const reviews = reviewsResult.docs.map((review) => ({
    id: review.id,
    customer: review.customer,
    rating: review.rating,
    text: review.text,
  }))

  return (
    <div className="min-h-screen">
      <HeroSection slides={slides} />
      <CategoriesSection categories={categories} />
      <PopularProducts products={products} />
      <BenefitsSection />
      <ConstructorBanner />
      <ReviewsCarousel reviews={reviews} />
    </div>
  )
}
