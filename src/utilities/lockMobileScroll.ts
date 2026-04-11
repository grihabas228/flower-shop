/**
 * Lock scroll on the mobile scroll container and return an unlock function
 * that restores the original scroll position.
 *
 * Uses the "position:fixed + negative top" pattern — the most reliable way
 * to prevent background scroll on iOS Safari. When overflow:hidden alone is
 * used, iOS still shifts scrollTop when keyboards open/close or sheet
 * content changes height.
 *
 * How it works:
 * 1. On lock: save scrollTop, set position:fixed and top:-scrollTop so
 *    the visible content stays in place.
 * 2. On unlock: remove position:fixed, restore scrollTop.
 */
export function lockMobileScroll(): () => void {
  const container = document.getElementById('mobile-scroll')
  if (!container) return () => {}

  const savedScrollTop = container.scrollTop
  container.classList.add('scroll-locked')
  container.style.top = `-${savedScrollTop}px`

  return () => {
    container.classList.remove('scroll-locked')
    container.style.top = ''
    container.scrollTop = savedScrollTop
  }
}
