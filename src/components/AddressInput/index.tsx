'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MapPin, X } from 'lucide-react'
import { cn } from '@/utilities/cn'

export type DaDataSuggestion = {
  value: string
  unrestricted_value: string
  data: {
    geo_lat: string | null
    geo_lon: string | null
    beltway_hit: string | null // "IN_MKAD" | "OUT_MKAD" | null
    beltway_distance: string | null // km from MKAD
    street: string | null
    house: string | null
    flat: string | null
    city: string | null
    region: string | null
    settlement: string | null
    area: string | null
  }
}

type Props = {
  value: string
  onChange: (value: string) => void
  onSelect: (suggestion: DaDataSuggestion) => void
  placeholder?: string
  className?: string
  hint?: string
  /** 'default' = HeroSection/mobile style, 'compact' = header pill style */
  variant?: 'default' | 'compact'
  /** Show X button; called on click */
  onClose?: () => void
  /** Auto-focus input on mount */
  autoFocus?: boolean
}

const DADATA_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address'

export function AddressInput({
  value,
  onChange,
  onSelect,
  placeholder = 'Укажите свой адрес',
  className,
  hint,
  variant = 'default',
  onClose,
  autoFocus,
}: Props) {
  const isCompact = variant === 'compact'
  const [suggestions, setSuggestions] = useState<DaDataSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchSuggestions = useCallback(async (query: string) => {
    const token = process.env.NEXT_PUBLIC_DADATA_TOKEN
    if (!token || query.length < 2) {
      setSuggestions([])
      return
    }

    try {
      abortRef.current?.abort()
      abortRef.current = new AbortController()

      const res = await fetch(DADATA_URL, {
        method: 'POST',
        signal: abortRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          query,
          count: 7,
          locations: [{ city: 'Москва' }, { region: 'Московская' }],
        }),
      })
      const data = await res.json()
      if (data.suggestions) {
        setSuggestions(data.suggestions)
        setIsOpen(data.suggestions.length > 0)
        setHighlightedIndex(-1)
      }
    } catch {
      setSuggestions([])
    }
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      onChange(val)

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => fetchSuggestions(val), 300)
    },
    [onChange, fetchSuggestions],
  )

  const handleSelect = useCallback(
    (suggestion: DaDataSuggestion) => {
      onChange(suggestion.value)
      onSelect(suggestion)
      setSuggestions([])
      setIsOpen(false)
      inputRef.current?.blur()
    },
    [onChange, onSelect],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || suggestions.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
      } else if (e.key === 'Enter' && highlightedIndex >= 0) {
        e.preventDefault()
        handleSelect(suggestions[highlightedIndex]!)
      } else if (e.key === 'Escape') {
        setIsOpen(false)
      }
    },
    [isOpen, suggestions, highlightedIndex, handleSelect],
  )

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <MapPin
          className={cn(
            'absolute top-1/2 -translate-y-1/2',
            isCompact
              ? 'left-3 w-3.5 h-3.5 text-[#b0a99e]'
              : 'left-4 w-4 h-4 text-muted-foreground/50',
          )}
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          autoFocus={autoFocus}
          className={cn(
            'w-full focus:outline-none transition-all',
            isCompact
              ? 'h-8 bg-[#f3ede7] border-none rounded-full pl-8 pr-8 font-sans text-xs text-[#2d2d2d] placeholder:text-[#aaa] focus:ring-1 focus:ring-black/10'
              : 'bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-sm placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-accent/50 focus:border-accent',
          )}
        />
        {onClose && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setSuggestions([])
              setIsOpen(false)
              onClose()
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#b0a99e] hover:text-[#2d2d2d] transition-colors"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        )}
      </div>

      {hint && (
        <p className="text-[11px] text-muted-foreground/60 mt-1.5 ml-1">
          {hint}
        </p>
      )}

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          className={cn(
            'absolute z-50 top-full left-0',
            isCompact
              ? 'w-[340px] mt-2 bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] py-2'
              : 'right-0 mt-1 bg-background border border-border rounded-xl shadow-lg overflow-hidden',
          )}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.value}-${index}`}
              type="button"
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                'w-full text-left transition-colors',
                isCompact
                  ? cn(
                      'px-5 py-2.5 font-sans text-xs text-[#2d2d2d]',
                      index === highlightedIndex ? 'bg-[#faf5f0]' : 'hover:bg-[#faf5f0]',
                    )
                  : cn(
                      'px-4 py-3 text-sm',
                      index === highlightedIndex
                        ? 'bg-accent/10 text-foreground'
                        : 'text-foreground/80 hover:bg-secondary/50',
                      index > 0 && 'border-t border-border/50',
                    ),
              )}
            >
              {suggestion.value}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
