'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { toast } from 'sonner'
import { cn } from '@/utilities/cn'
import { MOBILE_SCROLL_ID } from '@/components/MobileScrollContainer'

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(price)
}

export type VariantPill = {
  /** Variant id (used for add-to-cart and selection) */
  id: number
  /** Option id within the visible variant type */
  optionId: number
  label: string
  available: boolean
}

type Props = {
  productId: number
  pills: VariantPill[]
  selectedVariantId: number | undefined
  onSelectVariant: (optionId: number) => void
  price: number
  inStock: boolean
}

/**
 * Floating inverted-L element for mobile product pages.
 *
 * Right column: vertical stack of variant pills (size / quantity).
 * Bottom row: cart button with price, joined seamlessly to the column.
 *
 * Hides when the inline variant selector scrolls into view.
 * md:hidden — desktop never sees this.
 */
export function FloatingCartL({
  productId,
  pills,
  selectedVariantId,
  onSelectVariant,
  price,
  inStock,
}: Props) {
  const { addItem, isLoading } = useCart()
  const [visible, setVisible] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Hide when inline variant selector is visible
  useEffect(() => {
    const sentinel = document.getElementById('variant-selector-section')
    if (!sentinel) {
      // No variant section exists — observe the add-to-cart button instead
      const fallback = document.getElementById('product-add-to-cart')
      if (!fallback) return
      const scrollContainer = document.getElementById(MOBILE_SCROLL_ID) || null
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry) setVisible(!entry.isIntersecting)
        },
        { root: scrollContainer, threshold: 0 },
      )
      observerRef.current.observe(fallback)
      return () => { observerRef.current?.disconnect() }
    }

    const scrollContainer = document.getElementById(MOBILE_SCROLL_ID) || null
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry) setVisible(!entry.isIntersecting)
      },
      { root: scrollContainer, threshold: 0 },
    )
    observerRef.current.observe(sentinel)
    return () => { observerRef.current?.disconnect() }
  }, [])

  const handleAddToCart = useCallback(async () => {
    if (!inStock || isLoading) return
    try {
      await addItem({
        product: productId,
        variant: selectedVariantId ?? undefined,
      })
      toast.success('Добавлено в корзину')
    } catch {
      toast.error('Ошибка при добавлении')
    }
  }, [addItem, productId, selectedVariantId, inStock, isLoading])

  // Debug: remove after verifying pills work
  useEffect(() => {
    console.log('[FloatingCartL] pills:', JSON.stringify(pills, null, 2))
    console.log('[FloatingCartL] selectedVariantId:', selectedVariantId)
    console.log('[FloatingCartL] price:', price, 'inStock:', inStock)
  }, [pills, selectedVariantId, price, inStock])

  const hasPills = pills.length > 1

  return (
    <div
      className={cn(
        'fixed z-[55] transition-all duration-300 ease-in-out md:hidden',
        'right-4 bottom-[80px]',
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-6 opacity-0',
      )}
    >
      {/* Unified rounded shape: pills column + cart button */}
      <div className="flex flex-col items-end">
        <div
          className={cn(
            'flex flex-col',
            hasPills ? 'overflow-hidden rounded-[16px] shadow-xl' : '',
          )}
        >
          {/* ── Vertical pill column ── */}
          {hasPills && (
            <div
              className="flex max-h-[260px] flex-col items-center gap-1 overflow-y-auto py-2 scrollbar-hide"
              style={{ backgroundColor: '#3d3d3d' }}
            >
              {pills.map((pill) => {
                const isActive = pill.id === selectedVariantId
                return (
                  <button
                    key={pill.optionId}
                    onClick={() => onSelectVariant(pill.id)}
                    disabled={!pill.available}
                    className="group flex h-[44px] w-[44px] shrink-0 items-center justify-center"
                  >
                    <span
                      className={cn(
                        'flex h-[40px] w-[40px] items-center justify-center rounded-full font-sans text-[12px] font-semibold transition-all duration-150',
                        isActive
                          ? 'bg-[#faf5f0] text-[#2d2d2d]'
                          : pill.available
                            ? 'bg-[rgba(250,245,240,0.15)] text-[#faf5f0] group-active:bg-[rgba(250,245,240,0.3)] group-active:scale-95'
                            : 'bg-[rgba(250,245,240,0.08)] text-[rgba(250,245,240,0.3)] cursor-not-allowed',
                      )}
                    >
                      {pill.label}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* ── Cart button ── */}
          <button
            onClick={handleAddToCart}
            disabled={isLoading || !inStock}
            className={cn(
              'flex items-center justify-center gap-2 px-5 py-[14px] font-sans text-[14px] font-medium transition-all duration-200',
              !hasPills && 'rounded-2xl shadow-xl',
              inStock
                ? 'bg-[#2d2d2d] text-[#faf5f0] active:scale-[0.97]'
                : 'cursor-not-allowed bg-[#e8e4de] text-[#b0a99e]',
              isLoading && 'opacity-70',
            )}
          >
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
            <span className="whitespace-nowrap">
              {inStock ? `${formatPrice(price)} ₽` : 'Нет'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
