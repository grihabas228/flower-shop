import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { PromoCode } from '@/payload-types'

export async function POST(request: Request): Promise<Response> {
  try {
    const { code, cartTotal } = await request.json()

    if (!code || typeof code !== 'string') {
      return Response.json(
        { valid: false, message: 'Введите промокод' },
        { status: 400 },
      )
    }

    if (typeof cartTotal !== 'number' || cartTotal < 0) {
      return Response.json(
        { valid: false, message: 'Некорректная сумма корзины' },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config: configPromise })

    const { docs } = await payload.find({
      collection: 'promo-codes',
      where: {
        code: { equals: code.toUpperCase().trim() },
      },
      limit: 1,
    })

    if (!docs.length) {
      return Response.json({ valid: false, message: 'Промокод не найден' })
    }

    const promo: PromoCode = docs[0]

    if (!promo.active) {
      return Response.json({ valid: false, message: 'Промокод неактивен' })
    }

    const now = new Date()

    if (promo.validFrom && new Date(promo.validFrom) > now) {
      return Response.json({ valid: false, message: 'Промокод ещё не активен' })
    }

    if (promo.validUntil && new Date(promo.validUntil) < now) {
      return Response.json({ valid: false, message: 'Срок действия промокода истёк' })
    }

    if (
      promo.usageLimit != null &&
      promo.usageCount != null &&
      promo.usageCount >= promo.usageLimit
    ) {
      return Response.json({ valid: false, message: 'Лимит использований промокода исчерпан' })
    }

    if (promo.minimumOrder != null && cartTotal < promo.minimumOrder) {
      return Response.json({
        valid: false,
        message: `Минимальная сумма заказа для этого промокода: ${promo.minimumOrder} ₽`,
      })
    }

    return Response.json({
      valid: true,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      message: 'Промокод применён',
    })
  } catch {
    return Response.json(
      { valid: false, message: 'Ошибка сервера' },
      { status: 500 },
    )
  }
}
