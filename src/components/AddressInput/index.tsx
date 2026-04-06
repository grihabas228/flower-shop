'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'

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
}

const DADATA_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address'

export function AddressInput({
  value,
  onChange,
  onSelect,
  placeholder = 'Укажите свой адрес',
  className,
  hint,
}: Props) {
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
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
        />
      </div>

      {hint && (
        <p className="text-[11px] text-muted-foreground/60 mt-1.5 ml-1">
          {hint}
        </p>
      )}

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border border-border rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.value}-${index}`}
              type="button"
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                index === highlightedIndex
                  ? 'bg-accent/10 text-foreground'
                  : 'text-foreground/80 hover:bg-secondary/50'
              } ${index > 0 ? 'border-t border-border/50' : ''}`}
            >
              {suggestion.value}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
