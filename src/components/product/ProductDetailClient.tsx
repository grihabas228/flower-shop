'use client'

import type { Product, Variant, VariantOption, VariantType } from '@/payload-types'
import { useState, useMemo, useCallback } from 'react'
import { ProductInfo, compactLabel } from './ProductInfo'
import { FloatingCartL, type VariantPill } from './FloatingCartL'

/** Variant type names to hide (color is chosen via wrapper, not variants) */
const HIDDEN_TYPE_NAMES = new Set(['color', 'colour', 'цвет'])

type Props = {
  product: Product
}

/**
 * Client-side wrapper that owns the selected-variant state
 * and passes it down to both ProductInfo and FloatingCartL.
 * Keeps them in sync without any URL navigation.
 */
export function ProductDetailClient({ product }: Props) {
  const variants = useMemo(
    () =>
      (product.variants?.docs || []).filter(
        (v): v is Variant => typeof v === 'object' && v !== null,
      ),
    [product],
  )

  const variantTypes = useMemo(
    () =>
      (product.variantTypes || []).filter(
        (t): t is VariantType => typeof t === 'object' && t !== null,
      ),
    [product],
  )

  const hasVariants = product.enableVariants && variants.length > 0

  const visibleVariantTypes = useMemo(
    () => variantTypes.filter((t) => !HIDDEN_TYPE_NAMES.has(t.name.toLowerCase())),
    [variantTypes],
  )

  const displayType = product.variantDisplayType ?? 'size'

  // ── Shared variant state ──
  const [selectedVariantId, setSelectedVariantId] = useState<number | undefined>(() => {
    if (!hasVariants || !variants.length) return undefined
    return variants[0]?.id
  })

  const selectedVariant = useMemo<Variant | undefined>(() => {
    if (!hasVariants) return undefined
    return variants.find((v) => v.id === selectedVariantId) || variants[0]
  }, [hasVariants, selectedVariantId, variants])

  // Called from both ProductInfo pills AND FloatingCartL pills
  const handleVariantChange = useCallback(
    (variantId: number) => {
      setSelectedVariantId(variantId)
    },
    [],
  )

  // Current price from selected variant
  const currentPrice = useMemo(() => {
    if (hasVariants && selectedVariant?.priceInUSD) {
      return selectedVariant.priceInUSD
    }
    return product.priceInUSD || 0
  }, [hasVariants, selectedVariant, product.priceInUSD])

  const inStock = useMemo(() => {
    if (hasVariants && selectedVariant) {
      return (selectedVariant.inventory || 0) > 0
    }
    return (product.inventory || 0) > 0
  }, [hasVariants, selectedVariant, product.inventory])

  // Build pills for FloatingCartL — one per variant, using compactLabel
  const pills = useMemo<VariantPill[]>(() => {
    if (!hasVariants || visibleVariantTypes.length === 0) return []

    return variants.map((variant) => {
      // Get the label from the first visible-type option
      const variantOpts = (variant.options || []).filter(
        (o): o is VariantOption => typeof o === 'object' && o !== null,
      )

      // Find the option that belongs to a visible type
      let label = ''
      for (const opt of variantOpts) {
        const optType = typeof opt.variantType === 'object' ? opt.variantType : null
        if (optType && !HIDDEN_TYPE_NAMES.has(optType.name.toLowerCase())) {
          label = compactLabel(opt.label, displayType)
          break
        }
      }

      if (!label) {
        // Fallback — use variant title or index
        label = variant.title || '?'
      }

      return {
        id: variant.id,
        label,
        available: (variant.inventory || 0) > 0,
      }
    })
  }, [hasVariants, variants, visibleVariantTypes, displayType])

  return (
    <>
      <ProductInfo
        product={product}
        selectedVariantId={selectedVariantId}
        onVariantChange={handleVariantChange}
      />

      <FloatingCartL
        productId={product.id}
        pills={pills}
        selectedVariantId={selectedVariantId}
        onSelectVariant={handleVariantChange}
        price={currentPrice}
        inStock={inStock}
      />
    </>
  )
}
