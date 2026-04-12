'use client'

import type { Product, Variant, VariantOption, VariantType } from '@/payload-types'
import { useCallback, useMemo, useState } from 'react'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { cn } from '@/utilities/cn'
import { toast } from 'sonner'
import { Clock, Star, ShoppingBag, ChevronDown, Shield, Truck, ArrowRight } from 'lucide-react'
import { useDelivery } from '@/providers/DeliveryProvider'

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(price)
}

/**
 * Compact label — same logic as ProductCardShop.
 * "size" → abbreviate (Large→L, Medium→M, Small→S)
 * "quantity" → extract leading number ("25 роз"→"25")
 */
export function compactLabel(raw: string, displayType: 'size' | 'quantity'): string {
  const trimmed = raw.trim()

  if (displayType === 'quantity') {
    const numMatch = trimmed.match(/^(\d+)/)
    if (numMatch) return numMatch[1]!
    return trimmed
  }

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

  if (trimmed.length <= 3) return trimmed
  const firstWord = trimmed.split(/[\s,]+/)[0] || trimmed
  return firstWord.length <= 4 ? firstWord : firstWord.slice(0, 3)
}

/** Variant type names to hide — color is chosen via wrapper picker, not variants */
const HIDDEN_TYPE_NAMES = new Set(['color', 'colour', 'цвет'])

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
  /** Externally-controlled selected variant id (from ProductDetailClient) */
  selectedVariantId?: number
  /** Callback when user picks a different variant */
  onVariantChange?: (variantId: number) => void
}

export function ProductInfo({ product, selectedVariantId: externalVariantId, onVariantChange }: Props) {
  const { addItem, isLoading } = useCart()
  const { zone, hasAddress } = useDelivery()
  const [selectedWrapper, setSelectedWrapper] = useState(0)
  const [compositionOpen, setCompositionOpen] = useState(false)

  const variants = (product.variants?.docs || []).filter(
    (v): v is Variant => typeof v === 'object' && v !== null,
  )
  const variantTypes = (product.variantTypes || []).filter(
    (t): t is VariantType => typeof t === 'object' && t !== null,
  )
  const hasVariants = product.enableVariants && variants.length > 0

  // Filter out COLOR variant types — only show size/quantity
  const visibleVariantTypes = useMemo(
    () => variantTypes.filter((t) => !HIDDEN_TYPE_NAMES.has(t.name.toLowerCase())),
    [variantTypes],
  )

  const displayType = product.variantDisplayType ?? 'size'
  const variantLabel = displayType === 'quantity' ? 'Количество' : 'Размер'

  // ── Variant selection ──
  // Use external state if provided, otherwise local state
  const [localVariantId, setLocalVariantId] = useState<number | undefined>(() => {
    if (!hasVariants || !variants.length) return undefined
    return variants[0]?.id
  })

  const activeVariantId = externalVariantId ?? localVariantId

  const selectedVariant = useMemo<Variant | undefined>(() => {
    if (!hasVariants) return undefined
    if (activeVariantId) {
      return variants.find((v) => v.id === activeVariantId) || variants[0]
    }
    return variants[0]
  }, [hasVariants, activeVariantId, variants])

  // Select option → find matching variant → update state (no navigation)
  const selectOption = useCallback(
    (optionId: number) => {
      const matchingVariant = variants.find((variant) => {
        const variantOpts = (variant.options || []).filter(
          (o): o is VariantOption => typeof o === 'object' && o !== null,
        )
        return variantOpts.some((o) => o.id === optionId)
      })
      if (matchingVariant) {
        if (onVariantChange) {
          onVariantChange(matchingVariant.id)
        } else {
          setLocalVariantId(matchingVariant.id)
        }
      }
    },
    [variants, onVariantChange],
  )

  // Price logic
  const currentPrice = useMemo(() => {
    if (hasVariants && selectedVariant?.priceInUSD) {
      return selectedVariant.priceInUSD
    }
    return product.priceInUSD || 0
  }, [hasVariants, selectedVariant, product.priceInUSD])

  const oldPrice = useMemo(() => Math.round(currentPrice * 1.15), [currentPrice])
  const bonusPoints = Math.round(currentPrice * 0.05)

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

      {/* Delivery info — fixed height to prevent layout shifts */}
      <div className="flex min-h-[52px] items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#b5c7a3]/15">
          <Clock className="h-4 w-4 text-[#7a9968]" strokeWidth={1.5} />
        </div>
        {hasAddress && zone ? (
          <div>
            <p className="font-sans text-[14px] font-medium text-[#2d2d2d]">
              Доставим за {zone.estimatedTime ?? '120 мин'}
              {' · '}
              {(() => {
                const isFree = zone.freeFrom !== null && zone.freeFrom > 0 && currentPrice >= zone.freeFrom
                if (isFree) return 'Бесплатно'
                return `${new Intl.NumberFormat('ru-RU').format(zone.price3h)} ₽`
              })()}
            </p>
            <p className="font-sans text-[12px] text-[#8a8a8a]">
              {zone.address}
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('fleur:open-address-sheet'))}
            className="flex items-center gap-1 font-sans text-[14px] font-medium text-[#c4787e] underline decoration-[#c4787e]/50 underline-offset-2 transition-colors duration-150 hover:text-[#a8616a]"
          >
            <span>Укажите адрес для расчёта доставки</span>
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        )}
      </div>

      <div className="h-px bg-[#e8e4de]" />

      {/* Variant selector — sentinel for FloatingCartL IntersectionObserver */}
      {hasVariants && visibleVariantTypes.length > 0 && (
        <div id="variant-selector-section" className="space-y-5">
          {visibleVariantTypes.map((type) => {
            const rawOptions = type.options?.docs?.filter(
              (o): o is VariantOption => typeof o === 'object' && o !== null,
            )
            if (!rawOptions?.length) return null

            // Deduplicate by compact label and sort (same logic as FloatingCartL pills)
            const sizeOrder: Record<string, number> = { XS: 0, S: 1, M: 2, L: 3, XL: 4, XXL: 5 }
            const seenLabels = new Set<string>()
            const dedupedOptions = rawOptions.filter((option) => {
              const label = compactLabel(option.label, displayType)
              if (seenLabels.has(label)) return false
              seenLabels.add(label)
              return true
            }).sort((a, b) => {
              const aLabel = compactLabel(a.label, displayType)
              const bLabel = compactLabel(b.label, displayType)
              const aNum = parseFloat(aLabel)
              const bNum = parseFloat(bLabel)
              if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum
              const aOrder = sizeOrder[aLabel.toUpperCase()] ?? 99
              const bOrder = sizeOrder[bLabel.toUpperCase()] ?? 99
              return aOrder - bOrder
            })

            return (
              <div key={type.id}>
                <p className="mb-3 font-sans text-[12px] font-medium uppercase tracking-[1px] text-[#8a8a8a]">
                  {variantLabel}
                </p>
                <div className="flex flex-wrap gap-2">
                  {dedupedOptions.map((option) => {
                    const isActive = selectedVariant?.options?.some(
                      (o) => (typeof o === 'object' ? o.id : o) === option.id,
                    )

                    const isAvailable = variants.some((variant) => {
                      const variantOpts = (variant.options || []).filter(
                        (o): o is VariantOption => typeof o === 'object',
                      )
                      const hasOption = variantOpts.some((o) => o.id === option.id)
                      return hasOption && (variant.inventory || 0) > 0
                    })

                    const label = compactLabel(option.label, displayType)

                    return (
                      <button
                        key={option.id}
                        onClick={() => selectOption(option.id)}
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
                        {label}
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
        <p className="mb-3 font-sans text-[12px] font-medium uppercase tracking-[1px] text-[#8a8a8a]">
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

      {/* Add to cart button */}
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
          <span>В корзину&nbsp;&nbsp;·&nbsp;&nbsp;{formatPrice(currentPrice)}&nbsp;&#8381;</span>
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
            <span className="font-sans text-[14px] font-medium text-[#2d2d2d]">Состав букета</span>
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
              <ProductDescriptionText description={product.description} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductDescriptionText({ description }: { description: any }) {
  if (!description?.root?.children) return null

  function extractText(node: any): string {
    if (node.text) return node.text
    if (node.children) return node.children.map(extractText).join('')
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
