import { getPayload } from 'payload'
import configPromise from '@payload-config'

type ZoneMapping = {
  maxDistance: number
  zoneName: string
}

const OUT_MKAD_ZONES: ZoneMapping[] = [
  { maxDistance: 5, zoneName: 'За МКАД до 5 км' },
  { maxDistance: 10, zoneName: 'За МКАД 5-10 км' },
  { maxDistance: 15, zoneName: 'За МКАД 10-15 км' },
  { maxDistance: 30, zoneName: 'За МКАД 15-30 км' },
  { maxDistance: 50, zoneName: 'За МКАД 30-50 км' },
]

function getZoneName(beltwayHit: string | null, beltwayDistance: number | null): string | null {
  if (beltwayHit === 'IN_MKAD') return 'Внутри МКАД'

  if (beltwayHit === 'OUT_MKAD' && beltwayDistance != null) {
    for (const zone of OUT_MKAD_ZONES) {
      if (beltwayDistance <= zone.maxDistance) return zone.zoneName
    }
    return null // > 50 km — unavailable
  }

  return null
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    const { beltway_hit, beltway_distance, cartTotal = 0 } = body

    const dist = beltway_distance != null ? Number(beltway_distance) : null
    const zoneName = getZoneName(
      beltway_hit ?? null,
      dist != null && !isNaN(dist) ? dist : null,
    )

    if (!zoneName) {
      return Response.json({
        unavailable: true,
        message: 'Доставка в этот район пока недоступна',
      })
    }

    const payload = await getPayload({ config: configPromise })

    const { docs } = await payload.find({
      collection: 'delivery-zones',
      where: {
        zoneName: { equals: zoneName },
        active: { equals: true },
      },
      limit: 1,
    })

    if (!docs.length) {
      return Response.json({
        unavailable: true,
        message: 'Зона доставки не настроена',
      })
    }

    const zone = docs[0]!
    const isFree = zone.freeFrom != null && cartTotal >= zone.freeFrom

    return Response.json({
      unavailable: false,
      zone: {
        id: zone.id,
        zoneName: zone.zoneName,
        price: zone.price,
        freeFrom: zone.freeFrom ?? null,
        estimatedTime: zone.estimatedTime ?? null,
      },
      isFree,
    })
  } catch {
    return Response.json(
      { error: 'Ошибка сервера' },
      { status: 500 },
    )
  }
}
