/**
 * Lock scroll on the mobile scroll container.
 *
 * Saves scrollTop before locking and restores it on unlock with a
 * double assignment (sync + rAF) to handle iOS scroll position resets.
 */
export function lockMobileScroll(): () => void {
  const container = document.getElementById('mobile-scroll')
  if (!container) return () => {}

  const savedScrollTop = container.scrollTop
  container.classList.add('scroll-locked')

  return () => {
    container.classList.remove('scroll-locked')
    container.scrollTop = savedScrollTop
    requestAnimationFrame(() => {
      container.scrollTop = savedScrollTop
    })
  }
}
