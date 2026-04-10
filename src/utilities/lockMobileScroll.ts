/**
 * Lock scroll on the mobile scroll container and return an unlock function
 * that restores the original scroll position.
 *
 * iOS Safari can shift the background scroll position even when overflow is
 * hidden (e.g. when keyboard opens/closes, or sheet content changes). Saving
 * and restoring scrollTop on unlock prevents the catalog from drifting.
 */
export function lockMobileScroll(): () => void {
  const container = document.getElementById('mobile-scroll')
  if (!container) return () => {}

  const savedScrollTop = container.scrollTop
  container.classList.add('scroll-locked')

  return () => {
    container.classList.remove('scroll-locked')
    // Restore in next frame so layout settles before repositioning
    requestAnimationFrame(() => {
      container.scrollTop = savedScrollTop
    })
  }
}
