'use client'

import type { Product, Variant, VariantOption, VariantType } from '@/payload-types'
import { useState, useMemo, useCallback, useEffect } from 'react'
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

  // Set of visible (non-color) variant type IDs for fast lookup.
  // Handles both populated objects and raw number IDs.
  const visibleTypeIds = useMemo(
    () => new Set(visibleVariantTypes.map((t) => t.id)),
    [visibleVariantTypes],
  )

  // Set of hidden variant type IDs
  const hiddenTypeIds = useMemo(
    () => new Set(
      variantTypes
        .filter((t) => HIDDEN_TYPE_NAMES.has(t.name.toLowerCase()))
        .map((t) => t.id),
    ),
    [variantTypes],
  )

  // Build pills for FloatingCartL — one per UNIQUE option from visible types.
  // E.g. if variants are [Large+Black, Large+White, Medium+Black, Medium+White]
  // we show only [L, M] — deduplicated by option id.
  // Each pill maps to the first variant that contains that option.
  const pills = useMemo<VariantPill[]>(() => {
    if (!hasVariants || visibleTypeIds.size === 0) return []

    const seen = new Set<number>()
    const result: VariantPill[] = []

    for (const variant of variants) {
      const variantOpts = (variant.options || []).filter(
        (o): o is VariantOption => typeof o === 'object' && o !== null,
      )
      for (const opt of variantOpts) {
        // Resolve variantType id — works whether populated as object or raw number
        const optTypeId = typeof opt.variantType === 'object'
          ? (opt.variantType as VariantType).id
          : opt.variantType

        // Skip if this option belongs to a hidden type (color) or unknown type
        if (hiddenTypeIds.has(optTypeId as number)) continue
        // If we can't determine the type but have visible types, accept it
        // (covers edge case where variantType is unpopulated number not in either set)
        if (optTypeId && !visibleTypeIds.has(optTypeId as number) && hiddenTypeIds.size > 0) continue

        if (seen.has(opt.id)) continue
        seen.add(opt.id)

        const available = variants.some((v) => {
          const vOpts = (v.options || []).filter(
            (o): o is VariantOption => typeof o === 'object' && o !== null,
          )
          return vOpts.some((o) => o.id === opt.id) && (v.inventory || 0) > 0
        })

        result.push({
          id: variant.id,
          optionId: opt.id,
          label: compactLabel(opt.label, displayType),
          available,
        })
      }
    }

    return result
  }, [hasVariants, variants, visibleTypeIds, hiddenTypeIds, displayType])

  // Debug: remove after verifying
  useEffect(() => {
    console.log('[ProductDetailClient] hasVariants:', hasVariants)
    console.log('[ProductDetailClient] variants count:', variants.length)
    console.log('[ProductDetailClient] variantTypes:', variantTypes.map(t => ({ id: t.id, name: t.name })))
    console.log('[ProductDetailClient] visibleVariantTypes:', visibleVariantTypes.map(t => ({ id: t.id, name: t.name })))
    console.log('[ProductDetailClient] visibleTypeIds:', [...visibleTypeIds])
    console.log('[ProductDetailClient] hiddenTypeIds:', [...hiddenTypeIds])
    console.log('[ProductDetailClient] pills:', pills)
    if (variants.length > 0) {
      const firstVariant = variants[0]
      const opts = (firstVariant.options || []).filter((o): o is VariantOption => typeof o === 'object')
      console.log('[ProductDetailClient] first variant options:', opts.map(o => ({
        id: o.id,
        label: o.label,
        variantType: o.variantType,
        variantTypeType: typeof o.variantType,
      })))
    }
  }, [hasVariants, variants, variantTypes, visibleVariantTypes, visibleTypeIds, hiddenTypeIds, pills])

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
