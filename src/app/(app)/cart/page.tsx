import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import React from 'react'

import { CartPage } from '@/components/CartPage'

export default function Cart() {
  return <CartPage />
}

export const metadata: Metadata = {
  description: 'Корзина — FLEUR',
  openGraph: mergeOpenGraph({
    title: 'Корзина',
    url: '/cart',
  }),
  title: 'Корзина',
}
