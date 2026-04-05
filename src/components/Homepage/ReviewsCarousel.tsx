'use client'

import { useState, useEffect, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { motion } from 'framer-motion'

type Review = {
  id: number | string
  customer: string
  rating: number
  text: string
}

type Props = {
  reviews: Review[]
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating ? 'fill-[#e8b4b8] text-[#e8b4b8]' : 'fill-[#e8e4de] text-[#e8e4de]'
          }`}
          strokeWidth={0}
        />
      ))}
    </div>
  )
}

export function ReviewsCarousel({ reviews }: Props) {
  if (reviews.length === 0) return null

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: reviews.length > 3,
    align: 'start',
    slidesToScroll: 1,
  })
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  return (
    <section className="bg-[#faf5f0] py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4">
      <div className="mb-6 flex items-end justify-between lg:mb-8">
        <h2 className="font-serif text-xl text-[#2d2d2d] lg:text-2xl">
          Отзывы наших клиентов
        </h2>

        {/* Navigation arrows */}
        <div className="flex gap-2">
          <button
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canScrollPrev}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e8e4de] text-[#5a5a5a] transition-all hover:border-[#2d2d2d] hover:text-[#2d2d2d] disabled:opacity-30 disabled:hover:border-[#e8e4de] disabled:hover:text-[#5a5a5a]"
            aria-label="Previous reviews"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canScrollNext}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e8e4de] text-[#5a5a5a] transition-all hover:border-[#2d2d2d] hover:text-[#2d2d2d] disabled:opacity-30 disabled:hover:border-[#e8e4de] disabled:hover:text-[#5a5a5a]"
            aria-label="Next reviews"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div ref={emblaRef} className="overflow-hidden">
        <div className="-ml-4 flex lg:-ml-5">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="min-w-0 flex-[0_0_85%] pl-4 sm:flex-[0_0_45%] lg:flex-[0_0_33.333%] lg:pl-5"
            >
              <div className="flex h-full flex-col rounded-2xl border border-[#e8e4de]/70 bg-white/60 p-6 backdrop-blur-sm">
                <StarRating rating={review.rating} />

                <p className="mt-4 flex-1 font-sans text-[14px] leading-relaxed text-[#5a5a5a]">
                  &ldquo;{review.text}&rdquo;
                </p>

                <div className="mt-5 flex items-center gap-3">
                  {/* Avatar placeholder */}
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8b4b8]/15">
                    <span className="font-serif text-[13px] text-[#e8b4b8]">
                      {review.customer.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-sans text-[13px] font-medium text-[#2d2d2d]">
                    {review.customer}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      </div>
    </section>
  )
}
