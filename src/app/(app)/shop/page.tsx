import { ShopFilters } from '@/components/shop/ShopFilters'
import { ShopSearch } from '@/components/shop/ShopSearch'
import { ProductCardShop } from '@/components/shop/ProductCardShop'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React, { Suspense } from 'react'
import type { Product, Media, Variant, VariantOption } from '@/payload-types'

export const metadata = {
  title: 'Каталог — FLEUR',
  description: 'Премиальные букеты с доставкой. Каталог цветов FLEUR.',
}

type SearchParams = { [key: string]: string | string[] | undefined }

type Props = {
  searchParams: Promise<SearchParams>
}

function transformProductForCard(product: Partial<Product>) {
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
    id: product.id!,
    title: product.title!,
    slug: product.slug!,
    priceInUSD: product.priceInUSD ?? null,
    enableVariants: product.enableVariants ?? null,
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

export default async function ShopPage({ searchParams }: Props) {
  const {
    q: searchValue,
    sort,
    category,
    priceMin,
    priceMax,
  } = await searchParams
  const payload = await getPayload({ config: configPromise })

  // Fetch categories for filters
  const categoriesResult = await payload.find({
    collection: 'product-categories',
    sort: 'sortOrder',
    limit: 50,
  })

  const categories = categoriesResult.docs.map((cat) => ({
    id: cat.id,
    title: cat.title,
    slug: cat.slug,
  }))

  // Build product query
  const whereConditions: any[] = [{ _status: { equals: 'published' } }]

  if (searchValue) {
    whereConditions.push({
      or: [
        { title: { like: searchValue } },
        { description: { like: searchValue } },
      ],
    })
  }

  if (category) {
    // Find category by slug to get id
    const matchedCat = categoriesResult.docs.find((c) => c.slug === category)
    if (matchedCat) {
      whereConditions.push({
        categories: { contains: matchedCat.id },
      })
    }
  }

  // Price filtering
  if (priceMin) {
    whereConditions.push({
      priceInUSD: { greater_than_equal: Number(priceMin) },
    })
  }
  if (priceMax) {
    whereConditions.push({
      priceInUSD: { less_than_equal: Number(priceMax) },
    })
  }

  const products = await payload.find({
    collection: 'products',
    draft: false,
    overrideAccess: false,
    depth: 2,
    limit: 48,
    ...(sort ? { sort: sort as string } : { sort: '-createdAt' }),
    where: { and: whereConditions },
    populate: {
      variants: {
        title: true,
        priceInUSD: true,
        inventory: true,
        options: true,
      },
    },
  })

  return (
    <div className="space-y-8">
      {/* Page title + search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-medium tracking-tight text-[#2d2d2d] lg:text-4xl">
          Каталог
        </h1>
        <Suspense fallback={null}>
          <ShopSearch />
        </Suspense>
      </div>

      {/* Filters */}
      <Suspense fallback={<FiltersSkeleton />}>
        <ShopFilters categories={categories} totalProducts={products.totalDocs} />
      </Suspense>

      {/* Product grid */}
      {products.docs.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {products.docs.map((product) => (
            <ProductCardShop
              key={product.id}
              product={transformProductForCard(product)}
            />
          ))}
        </div>
      ) : (
        <EmptyState searchValue={searchValue as string | undefined} />
      )}
    </div>
  )
}

function EmptyState({ searchValue }: { searchValue?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#f5f0ea]">
        <svg
          className="h-10 w-10 text-[#e8b4b8]"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>
      </div>
      <h2 className="mb-2 font-[family-name:var(--font-playfair)] text-xl text-[#2d2d2d]">
        {searchValue ? 'Ничего не найдено' : 'Букеты скоро появятся'}
      </h2>
      <p className="max-w-sm font-sans text-[14px] text-[#8a8a8a]">
        {searchValue
          ? `По запросу "${searchValue}" ничего не найдено. Попробуйте изменить параметры поиска.`
          : 'Мы готовим для вас лучшие букеты. Загляните чуть позже.'}
      </p>
    </div>
  )
}

function FiltersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-24 animate-pulse rounded-full bg-[#f0ebe3]" />
        ))}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-28 animate-pulse rounded-full bg-[#f0ebe3]" />
        ))}
      </div>
    </div>
  )
}
