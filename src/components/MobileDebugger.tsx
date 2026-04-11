'use client'

import { useEffect } from 'react'

/**
 * Temporary mobile debugger — initializes eruda console on screens < 768px.
 * Shows a floating button that opens a full dev-tools panel on mobile.
 * Remove this component after debugging is complete.
 */
export function MobileDebugger() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      import('eruda').then((eruda) => eruda.default.init())
    }
  }, [])
  return null
}
