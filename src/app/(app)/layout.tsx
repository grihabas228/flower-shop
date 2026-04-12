import type { ReactNode } from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { MobileScrollContainer } from '@/components/MobileScrollContainer'
import { AddressBottomSheet } from '@/components/AddressBottomSheet'
import { MobileDebugger } from '@/components/MobileDebugger'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { Playfair_Display, Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import { CART_COOKIE_NAME, DELIVERY_COOKIE_NAME, parseCartCookie, parseDeliveryCookie } from '@/utilities/cartCookie'
import React from 'react'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Read cookies on server — SSR renders correct initial state (no flash)
  const cookieStore = await cookies()
  const cartCookieVal = cookieStore.get(CART_COOKIE_NAME)?.value
  const deliveryCookieVal = cookieStore.get(DELIVERY_COOKIE_NAME)?.value

  const initialCart = cartCookieVal
    ? [...parseCartCookie(cartCookieVal).entries()] as [number, number][]
    : null
  const initialDelivery = parseDeliveryCookie(deliveryCookieVal)

  return (
    <html
      className={[playfair.variable, inter.variable].filter(Boolean).join(' ')}
      lang="ru"
      suppressHydrationWarning
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        <Providers initialCart={initialCart} initialDelivery={initialDelivery}>
          <AdminBar />
          <LivePreviewListener />

          {/* Mobile: flex column layout — header/scroll/nav are siblings, no fixed positioning.
              Desktop (md+): wrapper becomes display:contents — transparent, layout unchanged. */}
          <div className="flex flex-col h-[100dvh] md:contents">
            <Header />
            <MobileScrollContainer>
              <main className="pb-4 md:pb-0">{children}</main>
              <Footer />
            </MobileScrollContainer>
            <MobileBottomNav />
          </div>

          <AddressBottomSheet />
          <MobileDebugger />
        </Providers>
      </body>
    </html>
  )
}
