import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import React from 'react'

import { CheckoutPage } from '@/components/checkout/CheckoutPage'

export default function Checkout() {
  return (
    <div className="container min-h-[90vh] flex">
      <h1 className="sr-only">Оформление заказа</h1>
      <CheckoutPage />
    </div>
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
