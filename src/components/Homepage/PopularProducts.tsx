import Link from 'next/link'
import { ProductCardShop } from '@/components/shop/ProductCardShop'

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
  variantDisplayType?: string | null
  inventory?: number | null
  gallery?: Array<{
    image: {
      url: string
      alt?: string | null
      width?: number | null
      height?: number | null
    }
    variantOption?: { id: number } | number | null
  }> | null
  variants?: ProductVariant[]
  meta?: {
    image?: { url: string; alt?: string | null } | null
  } | null
}

type Props = {
  products: ProductCardData[]
}

export function PopularProducts({ products }: Props) {
  if (products.length === 0) return null

  return (
    <section className="bg-white py-10 lg:py-14">
      <div className="mx-auto max-w-7xl px-4">
      <div className="mb-6 flex items-end justify-between lg:mb-8">
        <h2 className="font-serif text-xl text-[#2d2d2d] lg:text-2xl">
          Популярные букеты
        </h2>
        <Link
          href="/shop"
          className="font-sans text-[13px] text-[#8a8a8a] transition-colors hover:text-[#2d2d2d]"
        >
          Смотреть все
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:gap-3 lg:grid-cols-4 lg:gap-5">
        {products.map((product, i) => (
          <ProductCardShop key={product.id} product={product as Parameters<typeof ProductCardShop>[0]['product']} index={i} />
        ))}
      </div>
      </div>
    </section>
  )
}
