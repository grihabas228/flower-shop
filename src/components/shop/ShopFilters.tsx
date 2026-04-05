'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createUrl } from '@/utilities/createUrl'
import { cn } from '@/utilities/cn'
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react'
import { sorting, priceRanges, occasions, colors, recipients } from '@/lib/constants'

type CategoryData = {
  id: number
  title: string
  slug: string
}

type FilterDropdownProps = {
  label: string
  children: React.ReactNode
  isOpen: boolean
  onToggle: () => void
  hasActive: boolean
}

function FilterDropdown({ label, children, isOpen, onToggle, hasActive }: FilterDropdownProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (isOpen) onToggle()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onToggle])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-1.5 rounded-full border px-4 py-2 font-sans text-[13px] transition-all duration-200',
          hasActive
            ? 'border-[#2d2d2d] bg-[#2d2d2d] text-white'
            : 'border-[#e0dbd4] bg-white text-[#2d2d2d] hover:border-[#c8c3bb]',
        )}
      >
        {label}
        <ChevronDown
          className={cn('h-3.5 w-3.5 transition-transform duration-200', isOpen && 'rotate-180')}
          strokeWidth={1.5}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 min-w-[220px] rounded-2xl border border-[#e0dbd4] bg-white p-3 shadow-xl shadow-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}

type Props = {
  categories: CategoryData[]
  totalProducts: number
}

export function ShopFilters({ categories, totalProducts }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [openFilter, setOpenFilter] = useState<string | null>(null)

  const activeCategory = searchParams.get('category') || ''
  const activeSort = searchParams.get('sort') || ''
  const activePriceMin = searchParams.get('priceMin') || ''
  const activePriceMax = searchParams.get('priceMax') || ''
  const activeOccasion = searchParams.get('occasion') || ''
  const activeColor = searchParams.get('color') || ''
  const activeRecipient = searchParams.get('recipient') || ''

  const hasActiveFilters =
    activeCategory || activePriceMin || activeOccasion || activeColor || activeRecipient

  const toggleFilter = useCallback(
    (name: string) => {
      setOpenFilter((prev) => (prev === name ? null : name))
    },
    [],
  )

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(createUrl('/shop', params), { scroll: false })
      setOpenFilter(null)
    },
    [router, searchParams],
  )

  const updatePriceRange = useCallback(
    (min: number, max: number | null) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('priceMin', String(min))
      if (max !== null) {
        params.set('priceMax', String(max))
      } else {
        params.delete('priceMax')
      }
      router.push(createUrl('/shop', params), { scroll: false })
      setOpenFilter(null)
    },
    [router, searchParams],
  )

  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams()
    const q = searchParams.get('q')
    if (q) params.set('q', q)
    router.push(createUrl('/shop', params), { scroll: false })
  }, [router, searchParams])

  const clearParam = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete(key)
      if (key === 'priceMin') params.delete('priceMax')
      router.push(createUrl('/shop', params), { scroll: false })
    },
    [router, searchParams],
  )

  // Category pills helper
  function getPluralBouquets(n: number): string {
    const lastTwo = n % 100
    const lastOne = n % 10
    if (lastTwo >= 11 && lastTwo <= 19) return `${n} букетов`
    if (lastOne === 1) return `${n} букет`
    if (lastOne >= 2 && lastOne <= 4) return `${n} букета`
    return `${n} букетов`
  }

  return (
    <div className="space-y-4">
      {/* Category pills row */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => updateParam('category', '')}
          className={cn(
            'rounded-full px-5 py-2.5 font-sans text-[13px] font-medium transition-all duration-200',
            !activeCategory
              ? 'bg-[#2d2d2d] text-white shadow-sm'
              : 'bg-[#f5f0ea] text-[#5a5a5a] hover:bg-[#ebe6e0]',
          )}
        >
          Все
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() =>
              updateParam('category', activeCategory === cat.slug ? '' : cat.slug)
            }
            className={cn(
              'rounded-full px-5 py-2.5 font-sans text-[13px] font-medium transition-all duration-200',
              activeCategory === cat.slug
                ? 'bg-[#2d2d2d] text-white shadow-sm'
                : 'bg-[#f5f0ea] text-[#5a5a5a] hover:bg-[#ebe6e0]',
            )}
          >
            {cat.title}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sort dropdown */}
        <FilterDropdown
          label={activeSort ? sorting.find((s) => s.slug === activeSort)?.title || 'Сортировка' : 'Сортировка'}
          isOpen={openFilter === 'sort'}
          onToggle={() => toggleFilter('sort')}
          hasActive={!!activeSort}
        >
          <div className="space-y-0.5">
            {sorting.map((item) => (
              <button
                key={item.slug || 'default'}
                onClick={() => updateParam('sort', item.slug || '')}
                className={cn(
                  'flex w-full items-center rounded-lg px-3 py-2 text-left font-sans text-[13px] transition-colors',
                  (activeSort || '') === (item.slug || '')
                    ? 'bg-[#f5f0ea] text-[#2d2d2d] font-medium'
                    : 'text-[#5a5a5a] hover:bg-[#faf7f4]',
                )}
              >
                {item.title}
              </button>
            ))}
          </div>
        </FilterDropdown>

        {/* Occasion dropdown */}
        <FilterDropdown
          label={activeOccasion || 'Повод'}
          isOpen={openFilter === 'occasion'}
          onToggle={() => toggleFilter('occasion')}
          hasActive={!!activeOccasion}
        >
          <div className="space-y-0.5">
            {occasions.map((occ) => (
              <button
                key={occ}
                onClick={() => updateParam('occasion', activeOccasion === occ ? '' : occ)}
                className={cn(
                  'flex w-full items-center rounded-lg px-3 py-2 text-left font-sans text-[13px] transition-colors',
                  activeOccasion === occ
                    ? 'bg-[#f5f0ea] text-[#2d2d2d] font-medium'
                    : 'text-[#5a5a5a] hover:bg-[#faf7f4]',
                )}
              >
                {occ}
              </button>
            ))}
          </div>
        </FilterDropdown>

        {/* Price dropdown */}
        <FilterDropdown
          label={activePriceMin ? `${activePriceMin}${activePriceMax ? ` — ${activePriceMax}` : '+'} ₽` : 'Цена'}
          isOpen={openFilter === 'price'}
          onToggle={() => toggleFilter('price')}
          hasActive={!!activePriceMin}
        >
          <div className="space-y-0.5">
            {priceRanges.map((range) => (
              <button
                key={range.label}
                onClick={() => updatePriceRange(range.min, range.max)}
                className={cn(
                  'flex w-full items-center rounded-lg px-3 py-2 text-left font-sans text-[13px] transition-colors',
                  activePriceMin === String(range.min)
                    ? 'bg-[#f5f0ea] text-[#2d2d2d] font-medium'
                    : 'text-[#5a5a5a] hover:bg-[#faf7f4]',
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </FilterDropdown>

        {/* Color dropdown */}
        <FilterDropdown
          label={activeColor ? colors.find((c) => c.value === activeColor)?.label || 'Цвет' : 'Цвет'}
          isOpen={openFilter === 'color'}
          onToggle={() => toggleFilter('color')}
          hasActive={!!activeColor}
        >
          <div className="space-y-0.5">
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => updateParam('color', activeColor === color.value ? '' : color.value)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left font-sans text-[13px] transition-colors',
                  activeColor === color.value
                    ? 'bg-[#f5f0ea] text-[#2d2d2d] font-medium'
                    : 'text-[#5a5a5a] hover:bg-[#faf7f4]',
                )}
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full border border-[#e0dbd4]"
                  style={{ background: color.hex }}
                />
                {color.label}
              </button>
            ))}
          </div>
        </FilterDropdown>

        {/* Recipient dropdown */}
        <FilterDropdown
          label={activeRecipient || 'Для кого'}
          isOpen={openFilter === 'recipient'}
          onToggle={() => toggleFilter('recipient')}
          hasActive={!!activeRecipient}
        >
          <div className="space-y-0.5">
            {recipients.map((rec) => (
              <button
                key={rec}
                onClick={() => updateParam('recipient', activeRecipient === rec ? '' : rec)}
                className={cn(
                  'flex w-full items-center rounded-lg px-3 py-2 text-left font-sans text-[13px] transition-colors',
                  activeRecipient === rec
                    ? 'bg-[#f5f0ea] text-[#2d2d2d] font-medium'
                    : 'text-[#5a5a5a] hover:bg-[#faf7f4]',
                )}
              >
                {rec}
              </button>
            ))}
          </div>
        </FilterDropdown>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 rounded-full px-3 py-2 font-sans text-[13px] text-[#8a8a8a] transition-colors hover:text-[#2d2d2d]"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            Сбросить
          </button>
        )}
      </div>

      {/* Active filter tags + results count */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {activeCategory && (
            <FilterTag
              label={categories.find((c) => c.slug === activeCategory)?.title || activeCategory}
              onRemove={() => clearParam('category')}
            />
          )}
          {activeOccasion && (
            <FilterTag label={activeOccasion} onRemove={() => clearParam('occasion')} />
          )}
          {activePriceMin && (
            <FilterTag
              label={`${activePriceMin}${activePriceMax ? ` — ${activePriceMax}` : '+'} ₽`}
              onRemove={() => clearParam('priceMin')}
            />
          )}
          {activeColor && (
            <FilterTag
              label={colors.find((c) => c.value === activeColor)?.label || activeColor}
              onRemove={() => clearParam('color')}
            />
          )}
          {activeRecipient && (
            <FilterTag label={activeRecipient} onRemove={() => clearParam('recipient')} />
          )}
        </div>

        <p className="shrink-0 font-sans text-[14px] text-[#8a8a8a]">
          Найдено {getPluralBouquets(totalProducts)}
        </p>
      </div>
    </div>
  )
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#f5f0ea] px-3 py-1 font-sans text-[12px] text-[#5a5a5a]">
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-[#e0dbd4]"
      >
        <X className="h-3 w-3" strokeWidth={2} />
      </button>
    </span>
  )
}
