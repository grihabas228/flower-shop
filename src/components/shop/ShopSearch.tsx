'use client'

import { cn } from '@/utilities/cn'
import { createUrl } from '@/utilities/createUrl'
import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

type Props = {
  className?: string
}

export function ShopSearch({ className }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const val = e.target as HTMLFormElement
    const search = val.search as HTMLInputElement
    const newParams = new URLSearchParams(searchParams.toString())

    if (search.value) {
      newParams.set('q', search.value)
    } else {
      newParams.delete('q')
    }

    router.push(createUrl('/shop', newParams))
  }

  return (
    <form className={cn('relative w-full max-w-md', className)} onSubmit={onSubmit}>
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b0a99e]"
          strokeWidth={1.5}
        />
        <input
          autoComplete="off"
          className="w-full rounded-full border border-[#e0dbd4] bg-white py-2.5 pl-11 pr-4 font-sans text-[13px] text-[#2d2d2d] placeholder:text-[#b0a99e] transition-all duration-200 focus:border-[#e8b4b8] focus:outline-none focus:ring-2 focus:ring-[#e8b4b8]/20"
          defaultValue={searchParams?.get('q') || ''}
          key={searchParams?.get('q')}
          name="search"
          placeholder="Поиск букетов..."
          type="text"
        />
      </div>
    </form>
  )
}
