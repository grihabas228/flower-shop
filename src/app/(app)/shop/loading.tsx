import React from 'react'

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Title + search skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-[#f0ebe3]" />
        <div className="h-10 w-80 animate-pulse rounded-full bg-[#f0ebe3]" />
      </div>

      {/* Filter pills skeleton */}
      <div className="space-y-4">
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 w-20 animate-pulse rounded-full bg-[#f0ebe3]" />
          ))}
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-[#f0ebe3]" />
          ))}
        </div>
      </div>

      {/* Product grid skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="aspect-[3/4] w-full animate-pulse rounded-xl bg-[#f0ebe3]" />
            <div className="space-y-2 px-0.5">
              <div className="h-4 w-3/4 animate-pulse rounded bg-[#f0ebe3]" />
              <div className="flex gap-1.5">
                <div className="h-6 w-12 animate-pulse rounded-full bg-[#f0ebe3]" />
                <div className="h-6 w-12 animate-pulse rounded-full bg-[#f0ebe3]" />
                <div className="h-6 w-12 animate-pulse rounded-full bg-[#f0ebe3]" />
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="h-5 w-24 animate-pulse rounded bg-[#f0ebe3]" />
                <div className="h-9 w-28 animate-pulse rounded-full bg-[#f0ebe3]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
