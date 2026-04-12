import { AuthProvider } from '@/providers/Auth'
import { EcommerceProvider } from '@payloadcms/plugin-ecommerce/client/react'
import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { SonnerProvider } from '@/providers/Sonner'
import { DeliveryProvider } from '@/providers/DeliveryProvider'
import { FavoritesProvider } from '@/providers/FavoritesProvider'
import { OptimisticCartProvider } from '@/providers/OptimisticCartProvider'
import type { DeliveryCookieData } from '@/utilities/cartCookie'

export const Providers: React.FC<{
  children: React.ReactNode
  initialCart?: [number, number][] | null
  initialDelivery?: DeliveryCookieData
}> = ({ children, initialCart, initialDelivery }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HeaderThemeProvider>
          <SonnerProvider />
          <EcommerceProvider
            enableVariants={true}
            api={{
              cartsFetchQuery: {
                depth: 2,
                populate: {
                  products: {
                    slug: true,
                    title: true,
                    gallery: true,
                    inventory: true,
                  },
                  variants: {
                    title: true,
                    inventory: true,
                  },
                },
              },
            }}
            paymentMethods={[]}
          >
            <OptimisticCartProvider initialCart={initialCart}>
              <DeliveryProvider initialDelivery={initialDelivery}>
                <FavoritesProvider>{children}</FavoritesProvider>
              </DeliveryProvider>
            </OptimisticCartProvider>
          </EcommerceProvider>
        </HeaderThemeProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
