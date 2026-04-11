'use client'

import React from 'react'

export const MOBILE_SCROLL_ID = 'mobile-scroll'

/**
 * Mobile scroll container — flex-1 child of the mobile flex layout.
 * Content is structurally below the header (sibling in flex-col),
 * so no padding-top needed.
 *
 * On desktop (≥ md): renders display:contents — body scrolls normally.
 * On mobile (< md): renders a scrollable flex-1 div.
 */
export function MobileScrollContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      id={MOBILE_SCROLL_ID}
      className="flex-1 overflow-y-auto overscroll-y-contain min-h-0 md:contents"
    >
      {children}
    </div>
  )
}
