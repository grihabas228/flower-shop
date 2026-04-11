'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createUrl } from '@/utilities/createUrl'
import { cn } from '@/utilities/cn'
import { X, ChevronDown } from 'lucide-react'
import { Drawer } from 'vaul'
import { priceRanges, occasions, colors, recipients } from '@/lib/constants'
import { MOBILE_SCROLL_ID } from '@/components/MobileScrollContainer'

type Props = {
  totalProducts: number
}

/** Restore #mobile-scroll position after drawer closes (iOS Safari fix) */
function restoreMobileScroll(scrollTop: number) {
  const el = document.getElementById(MOBILE_SCROLL_ID)
  if (!el) return
  const restore = () => {
    el.scrollTop = scrollTop
    document.body.style.removeProperty('position')
    document.body.style.removeProperty('top')
    document.body.style.removeProperty('left')
    document.body.style.removeProperty('right')
    document.body.style.removeProperty('overflow')
    document.body.style.removeProperty('pointer-events')
  }
  restore()
  requestAnimationFrame(restore)
  setTimeout(restore, 0)
  setTimeout(restore, 50)
  setTimeout(restore, 150)
  setTimeout(restore, 300)
}

export function MobileFiltersSheet({ totalProducts }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const savedScrollTop = useRef(0)

  // Save scroll position whenever drawer opens
  useEffect(() => {
    if (open) {
      const el = document.getElementById(MOBILE_SCROLL_ID)
      if (el) savedScrollTop.current = el.scrollTop
    }
  }, [open])

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) restoreMobileScroll(savedScrollTop.current)
  }, [])

  // Listen for the custom event from the header filter button
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('fleur:open-filters', handler)
    return () => window.removeEventListener('fleur:open-filters', handler)
  }, [])

  const activeOccasion = searchParams.get('occasion') || ''
  const activePriceMin = searchParams.get('priceMin') || ''
  const activePriceMax = searchParams.get('priceMax') || ''
  const activeColor = searchParams.get('color') || ''
  const activeRecipient = searchParams.get('recipient') || ''

  const applyFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(createUrl('/shop', params), { scroll: false })
    },
    [router, searchParams],
  )

  const applyPriceRange = useCallback(
    (min: number, max: number | null) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('priceMin', String(min))
      if (max !== null) params.set('priceMax', String(max))
      else params.delete('priceMax')
      router.push(createUrl('/shop', params), { scroll: false })
    },
    [router, searchParams],
  )

  const clearAll = useCallback(() => {
    const params = new URLSearchParams()
    const q = searchParams.get('q')
    const cat = searchParams.get('category')
    if (q) params.set('q', q)
    if (cat) params.set('category', cat)
    router.push(createUrl('/shop', params), { scroll: false })
    handleOpenChange(false)
  }, [router, searchParams, handleOpenChange])

  function getPluralBouquets(n: number): string {
    const lastTwo = n % 100
    const lastOne = n % 10
    if (lastTwo >= 11 && lastTwo <= 19) return `${n} букетов`
    if (lastOne === 1) return `${n} букет`
    if (lastOne >= 2 && lastOne <= 4) return `${n} букета`
    return `${n} букетов`
  }

  return (
    <Drawer.Root
      open={open}
      onOpenChange={handleOpenChange}
      noBodyStyles
      repositionInputs={false}
      shouldScaleBackground={false}
      disablePreventScroll
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[70] bg-[#2d2d2d]/40 md:hidden" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-3xl bg-[#faf5f0] outline-none md:hidden"
          style={{ maxHeight: 'calc(100dvh - 120px)' }}
        >
          {/* Drag handle */}
          <Drawer.Handle className="mx-auto mt-3 mb-1 h-1 w-10 rounded-full bg-[#e8e4de]" />

          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 120px - 24px - 72px)' }}>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#faf5f0] pb-2 px-5">
              <div className="flex items-center justify-between">
                <Drawer.Title className="font-serif text-xl text-[#2d2d2d]">
                  Фильтры
                </Drawer.Title>
                <button
                  onClick={() => handleOpenChange(false)}
                  className="p-1 text-[#8a8a8a] hover:text-[#2d2d2d]"
                  aria-label="Закрыть"
                >
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <div className="space-y-5 px-5 pb-4">
              {/* Occasion */}
              <FilterSection title="Повод">
                <div className="flex flex-wrap gap-2">
                  {occasions.map((occ) => (
                    <FilterChip
                      key={occ}
                      label={occ}
                      active={activeOccasion === occ}
                      onClick={() =>
                        applyFilter('occasion', activeOccasion === occ ? '' : occ)
                      }
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Price */}
              <FilterSection title="Цена">
                <div className="flex flex-wrap gap-2">
                  {priceRanges.map((range) => (
                    <FilterChip
                      key={range.label}
                      label={range.label}
                      active={activePriceMin === String(range.min)}
                      onClick={() => applyPriceRange(range.min, range.max)}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Color */}
              <FilterSection title="Цвет">
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() =>
                        applyFilter('color', activeColor === color.value ? '' : color.value)
                      }
                      className={cn(
                        'flex items-center gap-2 rounded-full border px-3.5 py-2 font-sans text-[13px] transition-all',
                        activeColor === color.value
                          ? 'border-[#2d2d2d] bg-[#2d2d2d] text-white'
                          : 'border-[#e0dbd4] text-[#5a5a5a]',
                      )}
                    >
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/30"
                        style={{ background: color.hex }}
                      />
                      {color.label}
                    </button>
                  ))}
                </div>
              </FilterSection>

              {/* Recipient */}
              <FilterSection title="Для кого">
                <div className="flex flex-wrap gap-2">
                  {recipients.map((rec) => (
                    <FilterChip
                      key={rec}
                      label={rec}
                      active={activeRecipient === rec}
                      onClick={() =>
                        applyFilter('recipient', activeRecipient === rec ? '' : rec)
                      }
                    />
                  ))}
                </div>
              </FilterSection>
            </div>
          </div>

          {/* Sticky bottom bar inside drawer */}
          <div className="border-t border-[#e8e4de] bg-[#faf5f0] px-5 py-4 safe-bottom-nav">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleOpenChange(false)}
                className="flex-1 rounded-full bg-[#2d2d2d] py-3.5 text-center font-sans text-[14px] font-medium text-[#faf5f0] transition-colors hover:bg-[#2d2d2d]/90"
              >
                Показать {getPluralBouquets(totalProducts)}
              </button>
              <button
                onClick={clearAll}
                className="shrink-0 font-sans text-[13px] text-[#8a8a8a] transition-colors hover:text-[#2d2d2d]"
              >
                Сбросить
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

function FilterSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(true)
  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between py-2"
      >
        <span className="font-sans text-[14px] font-medium text-[#2d2d2d]">{title}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-[#8a8a8a] transition-transform',
            expanded && 'rotate-180',
          )}
          strokeWidth={1.5}
        />
      </button>
      {expanded && <div className="pt-1 pb-2">{children}</div>}
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-2 font-sans text-[13px] transition-all',
        active
          ? 'border-[#2d2d2d] bg-[#2d2d2d] text-white'
          : 'border-[#e0dbd4] text-[#5a5a5a]',
      )}
    >
      {label}
    </button>
  )
}
