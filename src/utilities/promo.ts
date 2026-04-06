export type PromoDiscount = {
  discountType: 'percentage' | 'fixed'
  discountValue: number
}

export function calculateDiscount(promo: PromoDiscount | null, subtotal: number): number {
  if (!promo) return 0
  if (promo.discountType === 'percentage') {
    return Math.min(Math.round((subtotal * promo.discountValue) / 100), subtotal)
  }
  return Math.min(promo.discountValue, subtotal)
}
