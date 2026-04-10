'use client'

/**
 * Mobile scroll container — moves scroll from body to an inner div
 * so the browser's address bar does NOT hide/show on scroll.
 *
 * On desktop (≥ md) this renders a plain fragment (body scrolls normally).
 * On mobile (< md) it renders a div that occupies the remaining viewport
 * between the fixed header (56px) and fixed bottom nav (~72px).
 *
 * The scroll container gets id="mobile-scroll" so the header can attach
 * its hide-on-scroll listener to it instead of window.
 */

import React from 'react'

export const MOBILE_SCROLL_ID = 'mobile-scroll'

export function MobileScrollContainer({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Mobile: scrollable inner div */}
      <div
        id={MOBILE_SCROLL_ID}
        className="md:contents mobile-scroll-container"
      >
        {children}
      </div>
    </>
  )
}
