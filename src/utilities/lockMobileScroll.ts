/**
 * Lock scroll on the mobile scroll container.
 *
 * Simple approach: just add overflow:hidden via CSS class.
 * No position:fixed (which causes scroll position issues on iOS),
 * no saving/restoring scrollTop (which is fragile).
 *
 * The .scroll-locked class uses !important to override the base
 * overflow-y:auto !important rule.
 */
export function lockMobileScroll(): () => void {
  const container = document.getElementById('mobile-scroll')
  if (!container) return () => {}

  container.classList.add('scroll-locked')

  return () => {
    container.classList.remove('scroll-locked')
  }
}
