import Image from 'next/image'
import Link from 'next/link'

type Category = {
  id: number | string
  title: string
  slug: string
  image?: { url: string; alt?: string | null } | null
  description?: string | null
}

type Props = {
  categories: Category[]
}

export function CategoriesSection({ categories }: Props) {
  if (categories.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 lg:py-12">
      <div className="mb-6 flex items-end justify-between lg:mb-8">
        <h2 className="font-serif text-xl text-[#2d2d2d] lg:text-2xl">Каталог</h2>
        <Link
          href="/shop"
          className="font-sans text-[13px] text-[#8a8a8a] transition-colors hover:text-[#2d2d2d]"
        >
          Смотреть все
        </Link>
      </div>

      {/* Scrollable on mobile, grid on desktop */}
      <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible lg:px-0">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/shop?category=${category.slug}`}
            className="group flex min-w-[140px] flex-shrink-0 flex-col items-center lg:min-w-0"
          >
            <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-2xl border border-[#e8e4de]/60 bg-[#f5f0ea] transition-all duration-300 group-hover:border-[#e8b4b8]/40 group-hover:shadow-md group-hover:shadow-[#e8b4b8]/5">
              {category.image?.url ? (
                <Image
                  src={category.image.url}
                  alt={category.image.alt || category.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 140px, 20vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-[#e8b4b8]/15" />
                </div>
              )}
            </div>
            <p className="text-center font-sans text-[13px] text-[#2d2d2d] transition-colors group-hover:text-[#e8b4b8] lg:text-[14px]">
              {category.title}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
