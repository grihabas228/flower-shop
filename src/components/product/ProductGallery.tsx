'use client'

import type { Media as MediaType, Product } from '@/payload-types'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
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

  // Embla carousel for mobile swipe
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    dragFree: false,
    containScroll: 'trimSnaps',
    duration: 25,
  })

  // Sync embla slide index → current state
  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => {
      setCurrent(emblaApi.selectedScrollSnap())
    }
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi])

  // Sync variant selection → gallery index
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
        // Scroll embla to this index on mobile
        emblaApi?.scrollTo(index)
        // Adjust thumb offset for desktop
        if (index < thumbOffset) setThumbOffset(index)
        if (index >= thumbOffset + visibleThumbs) setThumbOffset(index - visibleThumbs + 1)
      }
    }
  }, [searchParams, gallery, thumbOffset, emblaApi])

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

  // Desktop: select image by clicking thumbnail
  const selectImage = useCallback(
    (index: number) => {
      setCurrent(index)
      if (index < thumbOffset) setThumbOffset(index)
      if (index >= thumbOffset + visibleThumbs) setThumbOffset(index - visibleThumbs + 1)
    },
    [thumbOffset],
  )

  // Mobile: select image by clicking thumbnail → also scroll embla
  const selectMobileImage = useCallback(
    (index: number) => {
      setCurrent(index)
      emblaApi?.scrollTo(index)
    },
    [emblaApi],
  )

  // Mobile thumbnail ref for auto-scrolling active thumb into view
  const mobileThumbnailsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!mobileThumbnailsRef.current) return
    const container = mobileThumbnailsRef.current
    const activeThumb = container.children[current] as HTMLElement | undefined
    if (activeThumb) {
      const containerRect = container.getBoundingClientRect()
      const thumbRect = activeThumb.getBoundingClientRect()
      // If thumbnail is outside visible area, scroll it into view
      if (thumbRect.left < containerRect.left || thumbRect.right > containerRect.right) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [current])

  if (!gallery.length) return null

  const mainImage = gallery[current]?.image

  return (
    <>
      {/* ============ MOBILE GALLERY (< sm) ============ */}
      <div className="flex flex-col sm:hidden">
        {/* Swipeable main image carousel */}
        <div className="overflow-hidden rounded-2xl bg-[#f5f0ea]" ref={emblaRef}>
          <div className="flex">
            {gallery.map((item, i) => (
              <div
                key={`mobile-slide-${item.image.id}-${i}`}
                className="min-w-0 shrink-0 grow-0 basis-full"
              >
                <div className="relative aspect-[3/4] w-full">
                  {item.image.url && (
                    <Image
                      src={item.image.url}
                      alt={item.image.alt || ''}
                      fill
                      className="object-cover"
                      sizes="100vw"
                      priority={i === 0}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        {gallery.length > 1 && (
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {gallery.map((_, i) => (
              <button
                key={`dot-${i}`}
                onClick={() => selectMobileImage(i)}
                aria-label={`Фото ${i + 1}`}
                className={cn(
                  'rounded-full transition-all duration-300',
                  i === current
                    ? 'h-2 w-2 bg-[#2d2d2d]'
                    : 'h-1.5 w-1.5 bg-[#d5d0c9]',
                )}
              />
            ))}
          </div>
        )}

        {/* Horizontal thumbnails */}
        {gallery.length > 1 && (
          <div
            ref={mobileThumbnailsRef}
            className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
          >
            {gallery.map((item, i) => (
              <button
                key={`mobile-thumb-${item.image.id}-${i}`}
                onClick={() => selectMobileImage(i)}
                className={cn(
                  'relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-lg transition-all duration-300',
                  i === current
                    ? 'ring-2 ring-[#e8b4b8] ring-offset-1 ring-offset-[#faf5f0] opacity-100'
                    : 'opacity-50 grayscale-[30%]',
                )}
              >
                <Image
                  src={item.image.url || ''}
                  alt={item.image.alt || ''}
                  fill
                  className="object-cover"
                  sizes="60px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ============ DESKTOP GALLERY (>= sm) ============ */}
      <div className="hidden gap-4 sm:flex lg:gap-5">
        {/* Vertical thumbnails */}
        {gallery.length > 1 && (
          <div className="flex flex-col items-center gap-2">
            {/* Scroll up */}
            {gallery.length > visibleThumbs && (
              <button
                onClick={() => scrollThumbs('up')}
                disabled={!canScrollUp}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200',
                  canScrollUp
                    ? 'text-[#5a5a5a] hover:bg-[#f0ebe3]'
                    : 'cursor-default text-[#d5d0c9]',
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
                        'relative h-[72px] w-[72px] shrink-0 cursor-pointer overflow-hidden rounded-lg transition-all duration-200 lg:h-[80px] lg:w-[80px]',
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
                    : 'cursor-default text-[#d5d0c9]',
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
      </div>
    </>
  )
}
