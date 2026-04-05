import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import { AccountPage as AccountPageClient } from '@/components/Account/AccountPage'

export default async function AccountPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent('/account')}`)
  }

  let orders: any[] = []

  try {
    const ordersResult = await payload.find({
      collection: 'orders',
      limit: 20,
      user,
      overrideAccess: false,
      pagination: false,
      sort: '-createdAt',
      where: {
        customer: {
          equals: user.id,
        },
      },
    })

    orders = (ordersResult?.docs || []).map((order: any) => ({
      id: String(order.id),
      orderNumber: String(order.id).slice(-5),
      date: new Date(order.createdAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      status:
        order.status === 'delivered'
          ? 'delivered'
          : order.status === 'cancelled'
            ? 'cancelled'
            : 'processing',
      total: order.total || 0,
      items:
        order.items?.map((item: any) => ({
          title: typeof item.product === 'object' ? item.product.title : 'Товар',
          quantity: item.quantity || 1,
          price: item.price || 0,
        })) || [],
    }))
  } catch {
    // Fallback for build time when APIs aren't live
  }

  return (
    <AccountPageClient
      user={{
        id: String(user.id),
        email: user.email,
        name: user.name || undefined,
      }}
      orders={orders}
      bonusPoints={0}
    />
  )
}

export const metadata: Metadata = {
  title: 'Личный кабинет — FLEUR',
  description: 'Управляйте заказами, бонусами и настройками аккаунта',
  openGraph: mergeOpenGraph({
    title: 'Личный кабинет — FLEUR',
    url: '/account',
  }),
}
