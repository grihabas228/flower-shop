'use client'

import type { Media as MediaType, Product } from '@/payload-types'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import React, { useState, useEffect, useCallback } from 'react'
import { cn } from '@/utilities/cn'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { DefaultDocumentIDType } from 'payload'

type GalleryItem = NonNullable<Product['gallery']>[number] & {
  image: MediaType
}

type Props = {
  gallery: GalleryItem[]
}

export function ProductGallery({ gallery }: Props) {
  const searchParams = useSearchParams()
  const [current, setCurrent] = useState(0)
  const [thumbOffset, setThumbOffset] = useState(0)
  const visibleThumbs = 5

  // Sync gallery with variant selection
  useEffect(() => {
    const values = Array.from(searchParams.values())
    if (values.length) {
      const index = gallery.findIndex((item) => {
        if (!item.variantOption) return false
        let variantID: DefaultDocumentIDType
        if (typeof item.variantOption === 'object') {
          variantID = item.variantOption.id
        } else variantID = item.variantOption
        return Boolean(values.find((value) => value === String(variantID)))
      })
      if (index !== -1) {
        setCurrent(index)
        // Adjust thumb offset to show selected
        if (index < thumbOffset) setThumbOffset(index)
        if (index >= thumbOffset + visibleThumbs) setThumbOffset(index - visibleThumbs + 1)
      }
    }
  }, [searchParams, gallery, thumbOffset])

  const canScrollUp = thumbOffset > 0
  const canScrollDown = thumbOffset + visibleThumbs < gallery.length

  const scrollThumbs = useCallback(
    (dir: 'up' | 'down') => {
      if (dir === 'up' && canScrollUp) {
        setThumbOffset((prev) => Math.max(0, prev - 1))
      }
      if (dir === 'down' && canScrollDown) {
        setThumbOffset((prev) => Math.min(gallery.length - visibleThumbs, prev + 1))
      }
    },
    [canScrollUp, canScrollDown, gallery.length],
  )

  const selectImage = useCallback(
    (index: number) => {
      setCurrent(index)
      if (index < thumbOffset) setThumbOffset(index)
      if (index >= thumbOffset + visibleThumbs) setThumbOffset(index - visibleThumbs + 1)
    },
    [thumbOffset],
  )

  if (!gallery.length) return null

  const mainImage = gallery[current]?.image

  return (
    <div className="flex gap-4 lg:gap-5">
      {/* Vertical thumbnails */}
      {gallery.length > 1 && (
        <div className="hidden flex-col items-center gap-2 sm:flex">
          {/* Scroll up */}
          {gallery.length > visibleThumbs && (
            <button
              onClick={() => scrollThumbs('up')}
              disabled={!canScrollUp}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200',
                canScrollUp
                  ? 'text-[#5a5a5a] hover:bg-[#f0ebe3]'
                  : 'text-[#d5d0c9] cursor-default',
              )}
            >
              <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
            </button>
          )}

          {/* Thumbnail images */}
          <div className="flex flex-col gap-2.5">
            {gallery
              .slice(thumbOffset, thumbOffset + visibleThumbs)
              .map((item, i) => {
                const actualIndex = thumbOffset + i
                return (
                  <button
                    key={`thumb-${item.image.id}-${actualIndex}`}
                    onClick={() => selectImage(actualIndex)}
                    className={cn(
                      'relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg transition-all duration-200 lg:h-[80px] lg:w-[80px]',
                      actualIndex === current
                        ? 'ring-2 ring-[#2d2d2d] ring-offset-2 ring-offset-[#faf5f0]'
                        : 'opacity-60 hover:opacity-100',
                    )}
                  >
                    <Image
                      src={item.image.url || ''}
                      alt={item.image.alt || ''}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                )
              })}
          </div>

          {/* Scroll down */}
          {gallery.length > visibleThumbs && (
            <button
              onClick={() => scrollThumbs('down')}
              disabled={!canScrollDown}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200',
                canScrollDown
                  ? 'text-[#5a5a5a] hover:bg-[#f0ebe3]'
                  : 'text-[#d5d0c9] cursor-default',
              )}
            >
              <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
            </button>
          )}
        </div>
      )}

      {/* Main image */}
      <div className="relative flex-1 overflow-hidden rounded-2xl bg-[#f5f0ea]">
        <div className="relative aspect-[3/4] w-full">
          {mainImage?.url && (
            <Image
              src={mainImage.url}
              alt={mainImage.alt || ''}
              fill
              className="object-cover transition-opacity duration-500"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          )}
        </div>
      </div>

      {/* Mobile horizontal thumbnails */}
      {gallery.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 sm:hidden">
          {gallery.map((item, i) => (
            <button
              key={`mobile-thumb-${item.image.id}-${i}`}
              onClick={() => setCurrent(i)}
              className={cn(
                'relative h-16 w-16 shrink-0 overflow-hidden rounded-lg transition-all duration-200',
                i === current
                  ? 'ring-2 ring-[#2d2d2d] ring-offset-1'
                  : 'opacity-60 hover:opacity-100',
              )}
            >
              <Image
                src={item.image.url || ''}
                alt={item.image.alt || ''}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
