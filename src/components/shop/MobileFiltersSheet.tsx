'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createUrl } from '@/utilities/createUrl'
import { cn } from '@/utilities/cn'
import { X, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { priceRanges, occasions, colors, recipients } from '@/lib/constants'

type Props = {
  totalProducts: number
}

export function MobileFiltersSheet({ totalProducts }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  // Listen for the custom event from the header filter button
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('fleur:open-filters', handler)
    return () => window.removeEventListener('fleur:open-filters', handler)
  }, [])

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return
    const container = document.getElementById('mobile-scroll')
    if (container) container.style.overflow = 'hidden'
    return () => {
      if (container) container.style.overflow = ''
    }
  }, [open])

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
    setOpen(false)
  }, [router, searchParams])

  function getPluralBouquets(n: number): string {
    const lastTwo = n % 100
    const lastOne = n % 10
    if (lastTwo >= 11 && lastTwo <= 19) return `${n} букетов`
    if (lastOne === 1) return `${n} букет`
    if (lastOne >= 2 && lastOne <= 4) return `${n} букета`
    return `${n} букетов`
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[70] bg-[#2d2d2d]/40 md:hidden"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-0 left-0 right-0 z-[70] top-[120px] overflow-y-auto rounded-t-3xl bg-[#faf5f0] md:hidden safe-bottom-nav"
          >
            {/* Handle */}
            <div className="sticky top-0 z-10 bg-[#faf5f0] pt-3 pb-2 px-5">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#e8e4de]" />
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl text-[#2d2d2d]">Фильтры</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 text-[#8a8a8a] hover:text-[#2d2d2d]"
                  aria-label="Закрыть"
                >
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <div className="space-y-5 px-5 pb-32">
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

            {/* Sticky bottom bar */}
            <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-[#e8e4de] bg-[#faf5f0] px-5 py-4 md:hidden safe-bottom-nav">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setOpen(false)}
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
