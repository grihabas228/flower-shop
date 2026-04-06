const CLEAN_URL = 'https://cleaner.dadata.ru/api/v1/clean/address'

export async function POST(request: Request): Promise<Response> {
  try {
    const { address } = await request.json()

    if (!address || typeof address !== 'string') {
      return Response.json({ error: 'Укажите адрес' }, { status: 400 })
    }

    const token = process.env.NEXT_PUBLIC_DADATA_TOKEN
    const secret = process.env.DADATA_SECRET_KEY

    if (!token || !secret) {
      return Response.json({ error: 'DaData не настроена' }, { status: 500 })
    }

    const res = await fetch(CLEAN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
        'X-Secret': secret,
      },
      body: JSON.stringify([address]),
    })

    if (!res.ok) {
      return Response.json({ error: 'Ошибка DaData' }, { status: 502 })
    }

    const data = await res.json()
    const result = data[0]

    if (!result) {
      return Response.json({ error: 'Адрес не распознан' }, { status: 404 })
    }

    return Response.json({
      beltway_hit: result.beltway_hit ?? null,
      beltway_distance: result.beltway_distance ?? null,
      geo_lat: result.geo_lat ?? null,
      geo_lon: result.geo_lon ?? null,
      result: result.result,
    })
  } catch {
    return Response.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
