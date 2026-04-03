'use client'

import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import React from 'react'
import { Address } from '@/payload-types'

type Props = {
  customerEmail?: string
  billingAddress?: Partial<Address>
  shippingAddress?: Partial<Address>
  setProcessingPayment: React.Dispatch<React.SetStateAction<boolean>>
}

/**
 * Placeholder CheckoutForm — will be replaced with ЮKassa payment form in Phase 4.
 */
export const CheckoutForm: React.FC<Props> = () => {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
      <p>Форма оплаты ЮKassa будет реализована в следующем обновлении.</p>
    </div>
  )
}
