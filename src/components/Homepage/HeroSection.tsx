'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { MapPin, Clock, Truck, ChevronLeft, ChevronRight, AlertCircle, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { YandexMap } from '@/components/YandexMap'
import { AddressInput, type DaDataSuggestion } from '@/components/AddressInput'
import { useDelivery } from '@/providers/DeliveryProvider'

const LAST_ADDRESS_KEY = 'fleur_last_address'

type StoredLastAddress = {
  address: string
  geo_lat: string | null
  geo_lon: string | null
  beltway_hit: string | null
  beltway_distance: string | null
  zone_result: DeliveryZoneInfo | null
}

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

type DeliveryZoneInfo = {
  unavailable: boolean
  zone?: {
    id: number
    zoneType: string
    price3h: number
    price1h: number | null
    priceExact: number | null
    availableIntervals: ('3h' | '1h' | 'exact')[]
    freeFrom: number | null
    estimatedTime: string | null
  }
  isFree?: boolean
  message?: string
}

const defaultSlide: PromoSlide = {
  id: 'default',
  title: 'Изысканные букеты',
  subtitle: 'Доставка свежих цветов по Москве от 2 часов',
  image: null,
  buttonText: 'Смотреть каталог',
  buttonLink: '/shop',
}

const SHOP_COORDS: [number, number] = [55.764, 37.606]

export function HeroSection({ slides }: Props) {
  const { setZone, markUnavailable, clear: clearDelivery } = useDelivery()
  const displaySlides = slides.length > 0 ? slides : [defaultSlide]
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: displaySlides.length > 1 })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const [addressValue, setAddressValue] = useState('')
  const [mapCenter, setMapCenter] = useState<[number, number]>(SHOP_COORDS)
  const [mapMarker, setMapMarker] = useState<[number, number]>(SHOP_COORDS)
  const [mapZoom, setMapZoom] = useState(13)
  const [markerTitle, setMarkerTitle] = useState('FLEUR')
  const [markerBody, setMarkerBody] = useState('Москва, ул. Цветочная, д. 12')
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryZoneInfo | null>(null)
  const [addressSelected, setAddressSelected] = useState(false)
  const hydratedRef = useRef(false)

  // Hydrate from localStorage on mount — restore previously selected address
  // without re-hitting any API.
  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(LAST_ADDRESS_KEY)
      if (!raw) return
      const stored = JSON.parse(raw) as StoredLastAddress
      if (!stored?.address) return

      setAddressValue(stored.address)
      setMarkerTitle(stored.address)
      setMarkerBody('')

      if (stored.geo_lat && stored.geo_lon) {
        const lat = parseFloat(stored.geo_lat)
        const lon = parseFloat(stored.geo_lon)
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
          setMapCenter([lat, lon])
          setMapMarker([lat, lon])
          setMapZoom(15)
        }
      }

      if (stored.zone_result) {
        setDeliveryInfo(stored.zone_result)
        setAddressSelected(true)

        // Re-populate the global delivery context so product cards pick up
        // the cached estimatedTime immediately on first paint.
        if (stored.zone_result.unavailable) {
          markUnavailable(stored.address)
        } else if (stored.zone_result.zone) {
          setZone({
            id: stored.zone_result.zone.id,
            zoneType: stored.zone_result.zone.zoneType,
            price3h: stored.zone_result.zone.price3h ?? 0,
            price1h: stored.zone_result.zone.price1h ?? null,
            priceExact: stored.zone_result.zone.priceExact ?? null,
            availableIntervals: stored.zone_result.zone.availableIntervals ?? ['3h'],
            freeFrom: stored.zone_result.zone.freeFrom ?? null,
            estimatedTime: stored.zone_result.zone.estimatedTime ?? null,
            address: stored.address,
          })
        }
      }
    } catch {
      // ignore corrupted storage
    }
  }, [setZone, markUnavailable])

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

  const handleAddressSelect = useCallback(async (suggestion: DaDataSuggestion) => {
    const { data } = suggestion

    // Update map with coordinates from suggestions (available for free)
    if (data.geo_lat && data.geo_lon) {
      const lat = parseFloat(data.geo_lat)
      const lon = parseFloat(data.geo_lon)
      setMapCenter([lat, lon])
      setMapMarker([lat, lon])
      setMapZoom(15)
      setMarkerTitle(suggestion.value)
      setMarkerBody('')
    }

    setAddressSelected(true)

    try {
      // Step 1: Clean address via DaData Cleaner API (returns beltway data)
      const cleanRes = await fetch('/api/dadata/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: suggestion.value }),
      })
      const cleanData = await cleanRes.json()

      if (cleanData.error) {
        setDeliveryInfo(null)
        return
      }

      // Step 2: Determine delivery zone from beltway data
      const zoneRes = await fetch('/api/delivery/zone-by-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beltway_hit: cleanData.beltway_hit,
          beltway_distance: cleanData.beltway_distance,
          cartTotal: 0,
        }),
      })
      const info = await zoneRes.json()
      setDeliveryInfo(info)

      // Sync to global delivery context so product cards can read estimatedTime
      if (info.unavailable) {
        markUnavailable(suggestion.value)
      } else if (info.zone) {
        setZone({
          id: info.zone.id,
          zoneType: info.zone.zoneType,
          price3h: info.zone.price3h ?? 0,
          price1h: info.zone.price1h ?? null,
          priceExact: info.zone.priceExact ?? null,
          availableIntervals: info.zone.availableIntervals ?? ['3h'],
          freeFrom: info.zone.freeFrom ?? null,
          estimatedTime: info.zone.estimatedTime ?? null,
          address: suggestion.value,
        })
      }

      // Persist to localStorage so the next visit/page rehydrates without API calls
      try {
        const payload: StoredLastAddress = {
          address: suggestion.value,
          geo_lat: data.geo_lat,
          geo_lon: data.geo_lon,
          beltway_hit: cleanData.beltway_hit ?? null,
          beltway_distance: cleanData.beltway_distance ?? null,
          zone_result: info,
        }
        window.localStorage.setItem(LAST_ADDRESS_KEY, JSON.stringify(payload))
      } catch {
        // ignore quota / privacy mode
      }
    } catch {
      setDeliveryInfo(null)
    }
  }, [setZone, markUnavailable])

  const handleClearAddress = useCallback(() => {
    setAddressValue('')
    setAddressSelected(false)
    setDeliveryInfo(null)
    setMapCenter(SHOP_COORDS)
    setMapMarker(SHOP_COORDS)
    setMapZoom(13)
    setMarkerTitle('FLEUR')
    setMarkerBody('Москва, ул. Цветочная, д. 12')
    clearDelivery()
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(LAST_ADDRESS_KEY)
      }
    } catch {
      // ignore
    }
  }, [clearDelivery])

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 pb-10 lg:pt-8 lg:pb-14">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr]">
        {/* Left — Address + Map + Delivery Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="hidden lg:flex"
        >
          <div className="flex w-full flex-col rounded-2xl border border-[#e8e4de] bg-white/60 overflow-hidden backdrop-blur-sm">
            {/* Address Input */}
            <div id="hero-address-input" className="p-4 pb-0">
              <div className="relative">
                <AddressInput
                  value={addressValue}
                  onChange={setAddressValue}
                  onSelect={handleAddressSelect}
                  placeholder="Укажите свой адрес"
                />
                {addressSelected && addressValue && (
                  <button
                    type="button"
                    onClick={handleClearAddress}
                    aria-label="Очистить адрес"
                    title="Очистить адрес"
                    className="absolute right-2 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#8a8a8a] hover:bg-[#e8b4b8]/15 hover:text-[#e8b4b8] transition-colors shadow-[0_1px_4px_rgba(45,45,45,0.08)]"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>

            {/* Yandex Map */}
            <div className="relative h-[200px] xl:h-[230px] mx-4 mt-3 rounded-xl overflow-hidden">
              <YandexMap
                center={mapCenter}
                zoom={mapZoom}
                markerCoords={mapMarker}
                markerTitle={markerTitle}
                markerBody={markerBody}
              />
            </div>

            {/* Delivery info */}
            <div className="p-4 pt-3">
              {deliveryInfo && addressSelected ? (
                deliveryInfo.unavailable ? (
                  <div className="flex items-center gap-2.5 rounded-xl bg-red-50 px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                    <p className="font-sans text-[13px] text-red-600">
                      {deliveryInfo.message || 'Доставка в этот район пока недоступна'}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-gradient-to-br from-[#e8b4b8]/10 to-[#e8b4b8]/5 px-4 py-3">
                    <p className="font-sans text-[13px] font-medium text-[#2d2d2d]">
                      Доставка: {deliveryInfo.zone?.estimatedTime} · {deliveryInfo.zone?.price3h === 0 ? 'Бесплатно' : `${deliveryInfo.zone?.price3h} \u20BD`}
                    </p>
                    {deliveryInfo.zone?.freeFrom && deliveryInfo.zone.price3h > 0 && (
                      <p className="font-sans text-[12px] text-[#8a8a8a] mt-0.5">
                        Бесплатная доставка от {deliveryInfo.zone.freeFrom.toLocaleString('ru-RU')} &#8381;
                      </p>
                    )}
                  </div>
                )
              ) : (
                <>
                  <div className="space-y-3">
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

                  <div className="mt-3 rounded-xl bg-gradient-to-br from-[#e8b4b8]/10 to-[#e8b4b8]/5 px-4 py-3">
                    <p className="font-sans text-[13px] font-medium text-[#2d2d2d]">
                      Бесплатная доставка от 5 000 &#8381;
                    </p>
                  </div>
                </>
              )}
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
