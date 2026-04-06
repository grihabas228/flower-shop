import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(request: Request): Promise<Response> {
  try {
    const { zoneId, cartTotal } = await request.json()

    if (zoneId == null || (typeof zoneId !== 'number' && typeof zoneId !== 'string')) {
      return Response.json(
        { error: 'Укажите зону доставки' },
        { status: 400 },
      )
    }

    if (typeof cartTotal !== 'number' || cartTotal < 0) {
      return Response.json(
        { error: 'Некорректная сумма корзины' },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config: configPromise })

    let zone
    try {
      zone = await payload.findByID({
        collection: 'delivery-zones',
        id: zoneId,
      })
    } catch {
      return Response.json(
        { error: 'Зона доставки не найдена' },
        { status: 404 },
      )
    }

    if (!zone.active) {
      return Response.json(
        { error: 'Зона доставки не найдена' },
        { status: 404 },
      )
    }

    const isFree = zone.freeFrom != null && cartTotal >= zone.freeFrom

    return Response.json({
      price: zone.price,
      freeFrom: zone.freeFrom ?? null,
      estimatedTime: zone.estimatedTime ?? null,
      isFree,
    })
  } catch {
    return Response.json(
      { error: 'Ошибка сервера' },
      { status: 500 },
    )
  }
}
