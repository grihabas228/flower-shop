import { getPayload } from 'payload'
import configPromise from '@payload-config'

type ZoneMapping = {
  maxDistance: number
  zoneType: string
}

const OUT_MKAD_ZONES: ZoneMapping[] = [
  { maxDistance: 5, zoneType: 'OUT_MKAD_5' },
  { maxDistance: 10, zoneType: 'OUT_MKAD_10' },
  { maxDistance: 15, zoneType: 'OUT_MKAD_15' },
  { maxDistance: 30, zoneType: 'OUT_MKAD_30' },
  { maxDistance: 50, zoneType: 'OUT_MKAD_50' },
]

function getZoneType(beltwayHit: string | null, beltwayDistance: number | null): string | null {
  if (beltwayHit === 'IN_MKAD') return 'IN_MKAD'

  if (beltwayHit === 'OUT_MKAD' && beltwayDistance != null) {
    for (const zone of OUT_MKAD_ZONES) {
      if (beltwayDistance <= zone.maxDistance) return zone.zoneType
    }
    return null // > 50 km
  }

  return null
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    const { beltway_hit, beltway_distance, cartTotal = 0 } = body

    const dist = beltway_distance != null ? Number(beltway_distance) : null
    const zoneType = getZoneType(
      beltway_hit ?? null,
      dist != null && !isNaN(dist) ? dist : null,
    )

    if (!zoneType) {
      return Response.json({
        unavailable: true,
        message: 'Доставка в этот район пока недоступна',
      })
    }

    const payload = await getPayload({ config: configPromise })

    const { docs } = await payload.find({
      collection: 'delivery-zones',
      where: {
        zoneType: { equals: zoneType },
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
        zoneType: zone.zoneType,
        price3h: zone.price3h ?? 0,
        price1h: zone.price1h ?? null,
        priceExact: zone.priceExact ?? null,
        availableIntervals: zone.availableIntervals ?? ['3h'],
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
