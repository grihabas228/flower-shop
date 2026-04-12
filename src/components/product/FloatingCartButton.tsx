'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { toast } from 'sonner'
import { cn } from '@/utilities/cn'
import { MOBILE_SCROLL_ID } from '@/components/MobileScrollContainer'

type Props = {
  productId: number
  variantId?: number
  price: number
  inStock: boolean
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(price)
}

/**
 * Floating "В корзину" button that appears at the bottom of the screen
 * on mobile when the user scrolls past the inline add-to-cart button.
 * Sits above the MobileBottomNav (z-[55]).
 */
export function FloatingCartButton({ productId, variantId, price, inStock }: Props) {
  const { addItem, isLoading } = useCart()
  const [visible, setVisible] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Observe the inline "В корзину" button — when it goes off-screen, show floating
  useEffect(() => {
    const inlineButton = document.getElementById('product-add-to-cart')
    if (!inlineButton) return

    // Use the mobile scroll container as root if available
    const scrollContainer = document.getElementById(MOBILE_SCROLL_ID) || null

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setVisible(!entry.isIntersecting)
        }
      },
      {
        root: scrollContainer,
        threshold: 0,
        rootMargin: '0px 0px 0px 0px',
      },
    )

    observerRef.current.observe(inlineButton)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  const handleClick = useCallback(async () => {
    if (!inStock || isLoading) return
    try {
      await addItem({
        product: productId,
        variant: variantId ?? undefined,
      })
      toast.success('Добавлено в корзину')
    } catch {
      toast.error('Ошибка при добавлении')
    }
  }, [addItem, productId, variantId, inStock, isLoading])

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-[55] flex justify-center px-4 transition-all duration-300 md:hidden',
        // Position above bottom nav with breathing room
        'bottom-[84px]',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none',
      )}
    >
      <button
        onClick={handleClick}
        disabled={isLoading || !inStock}
        className={cn(
          'flex w-[78%] max-w-[320px] items-center justify-center gap-2 rounded-2xl py-3.5 font-sans text-[14px] font-semibold shadow-lg transition-all duration-200',
          inStock
            ? 'bg-[#2d2d2d] text-[#faf5f0] active:scale-[0.98]'
            : 'bg-[#e8e4de] text-[#b0a99e] cursor-not-allowed',
          isLoading && 'opacity-70',
        )}
      >
        <ShoppingBag className="h-4.5 w-4.5" strokeWidth={1.5} />
        {inStock ? (
          <span>
            В корзину&nbsp;&nbsp;·&nbsp;&nbsp;{formatPrice(price)}&nbsp;&#8381;
          </span>
        ) : (
          <span>Нет в наличии</span>
        )}
      </button>
    </div>
  )
}
