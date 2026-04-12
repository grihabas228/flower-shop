'use client'

import { cn } from '@/utilities/cn'
import { createUrl } from '@/utilities/createUrl'
import { Search, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

type Props = {
  className?: string
}

export function ShopSearch({ className }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQ = searchParams?.get('q') || ''
  const [value, setValue] = useState(initialQ)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus when ?focus=search is present
  useEffect(() => {
    if (searchParams?.get('focus') === 'search' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [searchParams])

  // Sync if URL changes externally
  useEffect(() => {
    const urlQ = searchParams?.get('q') || ''
    if (urlQ !== value) setValue(urlQ)
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const pushSearch = useCallback(
    (q: string) => {
      const newParams = new URLSearchParams(searchParams?.toString() || '')
      if (q.trim()) {
        newParams.set('q', q.trim())
      } else {
        newParams.delete('q')
      }
      // Remove focus param if present
      newParams.delete('focus')
      router.push(createUrl('/shop', newParams))
    },
    [router, searchParams],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      setValue(v)

      // Debounce 300ms
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        pushSearch(v)
      }, 300)
    },
    [pushSearch],
  )

  const handleClear = useCallback(() => {
    setValue('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    pushSearch('')
    inputRef.current?.focus()
  }, [pushSearch])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (debounceRef.current) clearTimeout(debounceRef.current)
      pushSearch(value)
    },
    [pushSearch, value],
  )

  return (
    <form className={cn('relative w-full max-w-md', className)} onSubmit={handleSubmit}>
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b0a99e]"
          strokeWidth={1.5}
        />
        <input
          ref={inputRef}
          autoComplete="off"
          className="w-full rounded-full border border-[#e0dbd4] bg-white py-2.5 pl-11 pr-10 font-sans text-[13px] text-[#2d2d2d] placeholder:text-[#b0a99e] transition-all duration-200 focus:border-[#e8b4b8] focus:outline-none focus:ring-2 focus:ring-[#e8b4b8]/20"
          value={value}
          onChange={handleChange}
          name="search"
          placeholder="Поиск букетов..."
          type="text"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#b0a99e] hover:text-[#2d2d2d] transition-colors"
            aria-label="Очистить поиск"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        )}
      </div>
    </form>
  )
}
