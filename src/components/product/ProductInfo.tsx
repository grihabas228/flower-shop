'use client'

import type { Product, Variant, VariantOption, VariantType } from '@/payload-types'
import { useCallback, useMemo, useState, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { MOBILE_SCROLL_ID } from '@/components/MobileScrollContainer'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { createUrl } from '@/utilities/createUrl'
import { cn } from '@/utilities/cn'
import { toast } from 'sonner'
import { Clock, Star, ShoppingBag, ChevronDown, Shield, Truck } from 'lucide-react'

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(price)
}

// Wrapper color options
const wrapperColors = [
  { name: 'Белая', color: '#faf5f0', border: '#e0dbd4' },
  { name: 'Крафт', color: '#c4a882', border: '#b5975f' },
  { name: 'Розовая', color: '#e8b4b8', border: '#d9a0a5' },
  { name: 'Чёрная', color: '#2d2d2d', border: '#1a1a1a' },
  { name: 'Сиреневая', color: '#c8a2c8', border: '#b88eb8' },
  { name: 'Зелёная', color: '#b5c7a3', border: '#a0b58e' },
]

type Props = {
  product: Product
}

export function ProductInfo({ product }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { addItem, isLoading } = useCart()
  const [selectedWrapper, setSelectedWrapper] = useState(0)
  const [compositionOpen, setCompositionOpen] = useState(false)

  const variants = (product.variants?.docs || []).filter(
    (v): v is Variant => typeof v === 'object' && v !== null,
  )
  const variantTypes = (product.variantTypes || []).filter(
    (t): t is VariantType => typeof t === 'object' && t !== null,
  )
  const hasVariants = product.enableVariants && variants.length > 0

  // Find selected variant from URL params
  const selectedVariant = useMemo<Variant | undefined>(() => {
    if (!hasVariants) return undefined
    const variantId = searchParams.get('variant')
    if (variantId) {
      return variants.find((v) => String(v.id) === variantId)
    }
    // Default to first variant
    return variants[0]
  }, [hasVariants, searchParams, variants])

  // Price logic
  const currentPrice = useMemo(() => {
    if (hasVariants && selectedVariant?.priceInUSD) {
      return selectedVariant.priceInUSD
    }
    return product.priceInUSD || 0
  }, [hasVariants, selectedVariant, product.priceInUSD])

  // Simulated old price (15% higher)
  const oldPrice = useMemo(() => {
    return Math.round(currentPrice * 1.15)
  }, [currentPrice])

  const bonusPoints = Math.round(currentPrice * 0.05)

  // Handle variant option selection
  const selectOption = useCallback(
    (typeName: string, optionId: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('variant')
      params.delete('image')
      params.set(typeName, String(optionId))

      // Find matching variant
      const currentOptions = new Map<string, string>()
      variantTypes.forEach((type) => {
        const val = typeName === type.name ? String(optionId) : params.get(type.name)
        if (val) currentOptions.set(type.name, val)
      })

      const matchingVariant = variants.find((variant) => {
        const variantOpts = (variant.options || []).filter(
          (o): o is VariantOption => typeof o === 'object' && o !== null,
        )
        return variantOpts.every((opt) => {
          const variantType = typeof opt.variantType === 'object' ? opt.variantType : null
          if (!variantType) return true
          const expectedValue = currentOptions.get(variantType.name)
          return !expectedValue || expectedValue === String(opt.id)
        })
      })

      if (matchingVariant) {
        params.set('variant', String(matchingVariant.id))
      }

      // Save mobile scroll position before navigation — router.replace
      // can reset MobileScrollContainer scrollTop even with scroll: false
      const scrollEl = document.getElementById(MOBILE_SCROLL_ID)
      const savedScroll = scrollEl?.scrollTop ?? 0

      router.replace(createUrl(pathname, params), { scroll: false })

      // Restore scroll position after React re-render
      requestAnimationFrame(() => {
        if (scrollEl) scrollEl.scrollTop = savedScroll
      })
    },
    [router, pathname, searchParams, variants, variantTypes],
  )

  // Add to cart handler
  const handleAddToCart = useCallback(async () => {
    try {
      await addItem({
        product: product.id,
        variant: selectedVariant?.id ?? undefined,
      })
      toast.success('Добавлено в корзину')
    } catch {
      toast.error('Ошибка при добавлении')
    }
  }, [addItem, product.id, selectedVariant])

  // Stock check
  const inStock = useMemo(() => {
    if (hasVariants && selectedVariant) {
      return (selectedVariant.inventory || 0) > 0
    }
    return (product.inventory || 0) > 0
  }, [hasVariants, selectedVariant, product.inventory])

  return (
    <div className="flex flex-col gap-6 lg:gap-7">
      {/* Title */}
      <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-medium leading-tight text-[#2d2d2d] lg:text-3xl xl:text-[34px]">
        {product.title}
      </h1>

      {/* Price block */}
      <div className="flex items-baseline gap-3">
        <span className="font-sans text-[28px] font-bold tracking-tight text-[#2d2d2d] lg:text-[32px]">
          {formatPrice(currentPrice)}&nbsp;&#8381;
        </span>
        {oldPrice > currentPrice && (
          <span className="font-sans text-[16px] text-[#b0a99e] line-through">
            {formatPrice(oldPrice)}&nbsp;&#8381;
          </span>
        )}
      </div>

      {/* Bonus points */}
      <div className="flex items-center gap-2 rounded-lg bg-[#f5f0ea] px-4 py-2.5">
        <Star className="h-4 w-4 fill-[#e8b4b8] text-[#e8b4b8]" />
        <span className="font-sans text-[13px] text-[#5a5a5a]">
          +{bonusPoints} бонусных баллов за покупку
        </span>
      </div>

      {/* Delivery info */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#b5c7a3]/15">
          <Clock className="h-4 w-4 text-[#7a9968]" strokeWidth={1.5} />
        </div>
        <div>
          <p className="font-sans text-[14px] font-medium text-[#2d2d2d]">Доставим за 90 минут</p>
          <p className="font-sans text-[12px] text-[#8a8a8a]">Бесплатно от 5 000 ₽</p>
        </div>
      </div>

      <div className="h-px bg-[#e8e4de]" />

      {/* Variant selector */}
      {hasVariants && variantTypes.length > 0 && (
        <div className="space-y-5">
          {variantTypes.map((type) => {
            const options = type.options?.docs?.filter(
              (o): o is VariantOption => typeof o === 'object' && o !== null,
            )
            if (!options?.length) return null

            const activeOptionId = searchParams.get(type.name)

            return (
              <div key={type.id}>
                <p className="mb-3 font-sans text-[13px] font-medium uppercase tracking-wide text-[#8a8a8a]">
                  {type.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {options.map((option) => {
                    const isActive =
                      activeOptionId === String(option.id) ||
                      (!activeOptionId && selectedVariant?.options?.some(
                        (o) => (typeof o === 'object' ? o.id : o) === option.id,
                      ))

                    // Check availability
                    const isAvailable = variants.some((variant) => {
                      const variantOpts = (variant.options || []).filter(
                        (o): o is VariantOption => typeof o === 'object',
                      )
                      const hasOption = variantOpts.some((o) => o.id === option.id)
                      return hasOption && (variant.inventory || 0) > 0
                    })

                    return (
                      <button
                        key={option.id}
                        onClick={() => selectOption(type.name, option.id)}
                        disabled={!isAvailable}
                        className={cn(
                          'cursor-pointer rounded-full border px-5 py-2.5 font-sans text-[13px] font-medium transition-all duration-200',
                          isActive
                            ? 'border-[#2d2d2d] bg-[#2d2d2d] text-white'
                            : isAvailable
                              ? 'border-[#e0dbd4] bg-white text-[#5a5a5a] hover:border-[#c8c3bb]'
                              : 'border-[#e8e4de] bg-[#f5f0ea] text-[#c8c3bb] cursor-not-allowed',
                        )}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Wrapper color selector */}
      <div>
        <p className="mb-3 font-sans text-[13px] font-medium uppercase tracking-wide text-[#8a8a8a]">
          Цвет упаковки
        </p>
        <div className="flex flex-wrap gap-3">
          {wrapperColors.map((wrap, i) => (
            <button
              key={wrap.name}
              onClick={() => setSelectedWrapper(i)}
              className={cn(
                'group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-all duration-200',
                i === selectedWrapper
                  ? 'ring-2 ring-[#2d2d2d] ring-offset-2 ring-offset-[#faf5f0]'
                  : 'hover:ring-2 hover:ring-[#d5d0c9] hover:ring-offset-2 hover:ring-offset-[#faf5f0]',
              )}
              title={wrap.name}
            >
              <span
                className="h-full w-full rounded-full border"
                style={{ backgroundColor: wrap.color, borderColor: wrap.border }}
              />
            </button>
          ))}
        </div>
        <p className="mt-2 font-sans text-[12px] text-[#8a8a8a]">
          {wrapperColors[selectedWrapper]?.name}
        </p>
      </div>

      <div className="h-px bg-[#e8e4de]" />

      {/* Add to cart button — id used by FloatingCartButton intersection observer */}
      <button
        id="product-add-to-cart"
        onClick={handleAddToCart}
        disabled={isLoading || !inStock}
        className={cn(
          'flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full py-4 font-sans text-[15px] font-semibold transition-all duration-300',
          inStock
            ? 'bg-[#e8b4b8] text-white hover:bg-[#d9a0a5] hover:shadow-xl hover:shadow-[#e8b4b8]/25 active:scale-[0.98]'
            : 'bg-[#e8e4de] text-[#b0a99e] cursor-not-allowed',
          isLoading && 'opacity-70',
        )}
      >
        <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
        {inStock ? (
          <span>
            В корзину&nbsp;&nbsp;·&nbsp;&nbsp;{formatPrice(currentPrice)}&nbsp;&#8381;
          </span>
        ) : (
          <span>Нет в наличии</span>
        )}
      </button>

      {/* Trust badges */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#b5c7a3]" strokeWidth={1.5} />
          <span className="font-sans text-[12px] text-[#8a8a8a]">Гарантия свежести</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-[#b5c7a3]" strokeWidth={1.5} />
          <span className="font-sans text-[12px] text-[#8a8a8a]">Бережная доставка</span>
        </div>
      </div>

      {/* Composition (expandable) */}
      {product.description && (
        <div className="border-t border-[#e8e4de] pt-4">
          <button
            onClick={() => setCompositionOpen(!compositionOpen)}
            className="flex w-full cursor-pointer items-center justify-between py-2"
          >
            <span className="font-sans text-[14px] font-medium text-[#2d2d2d]">
              Состав букета
            </span>
            <ChevronDown
              className={cn(
                'h-5 w-5 text-[#8a8a8a] transition-transform duration-300',
                compositionOpen && 'rotate-180',
              )}
              strokeWidth={1.5}
            />
          </button>
          <div
            className={cn(
              'overflow-hidden transition-all duration-300',
              compositionOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0',
            )}
          >
            <div className="pb-2 pt-2 font-sans text-[14px] leading-relaxed text-[#5a5a5a]">
              {/* Rich text description rendered as simple text fallback */}
              <ProductDescriptionText description={product.description} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Simple rich text extraction for composition section
function ProductDescriptionText({ description }: { description: any }) {
  if (!description?.root?.children) return null

  function extractText(node: any): string {
    if (node.text) return node.text
    if (node.children) {
      return node.children.map(extractText).join('')
    }
    return ''
  }

  const paragraphs = description.root.children
    .map((child: any) => extractText(child))
    .filter(Boolean)

  return (
    <div className="space-y-2">
      {paragraphs.map((text: string, i: number) => (
        <p key={i}>{text}</p>
      ))}
    </div>
  )
}
