'use client'

import { useState, useEffect, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { MapPin, Clock, Truck, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { YandexMap } from '@/components/YandexMap'

type PromoSlide = {
  id: number | string
  title: string
  subtitle?: string | null
  image: { url: string; alt?: string | null; width?: number | null; height?: number | null } | null
  buttonText?: string | null
  buttonLink?: string | null
}

type Props = {
  slides: PromoSlide[]
}

const defaultSlide: PromoSlide = {
  id: 'default',
  title: 'Изысканные букеты',
  subtitle: 'Доставка свежих цветов по Москве от 2 часов',
  image: null,
  buttonText: 'Смотреть каталог',
  buttonLink: '/shop',
}

export function HeroSection({ slides }: Props) {
  const displaySlides = slides.length > 0 ? slides : [defaultSlide]
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: displaySlides.length > 1 })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  useEffect(() => {
    if (!emblaApi || displaySlides.length <= 1) return
    const interval = setInterval(() => {
      emblaApi.scrollNext()
    }, 5000)
    return () => clearInterval(interval)
  }, [emblaApi, displaySlides.length])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi])

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 pb-10 lg:pt-8 lg:pb-14">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr]">
        {/* Left — Yandex Map + Delivery Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="hidden lg:flex"
        >
          <div className="flex w-full flex-col rounded-2xl border border-[#e8e4de] bg-white/60 overflow-hidden backdrop-blur-sm">
            {/* Yandex Map */}
            <div className="relative h-[220px] xl:h-[250px]">
              <YandexMap
                center={[55.764, 37.606]}
                zoom={13}
                markerCoords={[55.764, 37.606]}
                markerTitle="FLEUR"
                markerBody="Москва, ул. Цветочная, д. 12"
              />
            </div>

            {/* Delivery info items */}
            <div className="flex flex-col justify-between flex-1 p-5">
              <div className="space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0ebe3]">
                    <Truck className="h-4 w-4 text-[#5a5a5a]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-sans text-[14px] text-[#2d2d2d]">Доставка от 2 часов</p>
                    <p className="font-sans text-[12px] text-[#8a8a8a]">Курьером к двери</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0ebe3]">
                    <Clock className="h-4 w-4 text-[#5a5a5a]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-sans text-[14px] text-[#2d2d2d]">С 8:00 до 22:00</p>
                    <p className="font-sans text-[12px] text-[#8a8a8a]">Ежедневно без выходных</p>
                  </div>
                </div>
              </div>

              {/* Free delivery badge */}
              <div className="mt-4 rounded-xl bg-gradient-to-br from-[#e8b4b8]/10 to-[#e8b4b8]/5 px-4 py-3">
                <p className="font-sans text-[13px] font-medium text-[#2d2d2d]">
                  Бесплатная доставка от 5 000 &#8381;
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right — Promo Slider */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          className="relative"
        >
          <div ref={emblaRef} className="overflow-hidden rounded-2xl">
            <div className="flex">
              {displaySlides.map((slide) => (
                <div key={slide.id} className="relative min-w-0 flex-[0_0_100%]">
                  <div className="relative aspect-[16/9] lg:aspect-[16/8] overflow-hidden">
                    {slide.image?.url ? (
                      <Image
                        src={slide.image.url}
                        alt={slide.image.alt || slide.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 65vw"
                        priority
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#f5e6e8] via-[#faf5f0] to-[#e8d5d0]">
                        <div className="absolute inset-0 opacity-[0.03]" style={{
                          backgroundImage: `radial-gradient(circle at 25% 25%, #e8b4b8 1px, transparent 1px)`,
                          backgroundSize: '30px 30px',
                        }} />
                      </div>
                    )}

                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 lg:p-10">
                      <h2 className="mb-2 font-serif text-2xl leading-tight text-white sm:text-3xl lg:text-4xl">
                        {slide.title}
                      </h2>
                      {slide.subtitle && (
                        <p className="mb-4 max-w-md font-sans text-[14px] leading-relaxed text-white/80 sm:text-[15px]">
                          {slide.subtitle}
                        </p>
                      )}
                      {slide.buttonText && slide.buttonLink && (
                        <div>
                          <Link
                            href={slide.buttonLink}
                            className="inline-flex items-center rounded-full bg-white/90 px-6 py-2.5 font-sans text-[13px] font-medium text-[#2d2d2d] backdrop-blur-sm transition-all duration-300 hover:bg-white hover:shadow-lg"
                          >
                            {slide.buttonText}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation arrows */}
          {displaySlides.length > 1 && (
            <>
              <button
                onClick={scrollPrev}
                className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-[#2d2d2d] shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow-md"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button
                onClick={scrollNext}
                className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-[#2d2d2d] shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow-md"
                aria-label="Next slide"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </>
          )}

          {/* Dots */}
          {displaySlides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
              {displaySlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollTo(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === selectedIndex
                      ? 'w-6 bg-white'
                      : 'w-2 bg-white/50 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Mobile delivery info */}
          <div className="mt-4 grid grid-cols-3 gap-3 lg:hidden">
            <div className="flex flex-col items-center rounded-xl border border-[#e8e4de] bg-white/60 p-3 text-center">
              <Truck className="mb-1.5 h-4 w-4 text-[#e8b4b8]" strokeWidth={1.5} />
              <p className="font-sans text-[11px] leading-tight text-[#2d2d2d]">от 2 часов</p>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-[#e8e4de] bg-white/60 p-3 text-center">
              <Clock className="mb-1.5 h-4 w-4 text-[#e8b4b8]" strokeWidth={1.5} />
              <p className="font-sans text-[11px] leading-tight text-[#2d2d2d]">8:00–22:00</p>
            </div>
            <div className="flex flex-col items-center rounded-xl border border-[#e8e4de] bg-white/60 p-3 text-center">
              <MapPin className="mb-1.5 h-4 w-4 text-[#e8b4b8]" strokeWidth={1.5} />
              <p className="font-sans text-[11px] leading-tight text-[#2d2d2d]">Москва</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
