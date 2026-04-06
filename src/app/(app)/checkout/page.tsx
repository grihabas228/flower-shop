import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import React, { Suspense } from 'react'

import { CheckoutPage } from '@/components/checkout/CheckoutPage'

export default function Checkout() {
  return (
    <Suspense>
      <CheckoutPage />
    </Suspense>
  )
}

export const metadata: Metadata = {
  description: 'Оформление заказа — FLEUR',
  openGraph: mergeOpenGraph({
    title: 'Оформление заказа',
    url: '/checkout',
  }),
  title: 'Оформление заказа',
}
