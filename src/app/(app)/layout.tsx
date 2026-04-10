import type { ReactNode } from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { MobileBottomNav } from '@/components/MobileBottomNav'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { Playfair_Display, Inter } from 'next/font/google'
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
  return (
    <html
      className={[playfair.variable, inter.variable].filter(Boolean).join(' ')}
      lang="ru"
      suppressHydrationWarning
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        <Providers>
          <AdminBar />
          <LivePreviewListener />

          <Header />
          <main className="safe-main-bottom md:pb-0">{children}</main>
          <Footer />
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  )
}
