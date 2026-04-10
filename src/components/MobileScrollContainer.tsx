'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

export const MOBILE_SCROLL_ID = 'mobile-scroll'

/**
 * Mobile scroll container — moves scroll from body to an inner div
 * so the browser's address bar does NOT hide/show on scroll.
 *
 * On desktop (≥ md): renders display:contents — body scrolls normally.
 * On mobile (< md): renders a scrollable div with padding-top to push
 * content below the fixed header:
 *   - 80px on most pages (32px address bar + 48px logo row)
 *   - 120px on /shop (+ 40px category bar)
 */
export function MobileScrollContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isShop = pathname === '/shop'

  return (
    <div
      id={MOBILE_SCROLL_ID}
      className="md:contents mobile-scroll-container"
      style={{ paddingTop: undefined }} // CSS handles it; inline override for /shop below
      data-shop={isShop ? '' : undefined}
    >
      {children}
    </div>
  )
}
