import type { Payload } from 'payload'
import type { PromoCode } from '@/payload-types'

/**
 * Increment usageCount for a promo code after successful payment.
 * Call this from the ЮKassa payment webhook when order is confirmed.
 */
export async function incrementPromoUsage(payload: Payload, code: string): Promise<void> {
  const { docs } = await payload.find({
    collection: 'promo-codes',
    where: {
      code: { equals: code.toUpperCase().trim() },
    },
    limit: 1,
  })

  if (!docs.length) return

  const promo = docs[0] as PromoCode

  await payload.update({
    collection: 'promo-codes',
    id: promo.id,
    data: {
      usageCount: (promo.usageCount || 0) + 1,
    },
  })
}
