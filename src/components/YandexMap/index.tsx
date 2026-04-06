'use client'

import { useEffect, useRef, useState } from 'react'

type YandexMapProps = {
  center?: [number, number]
  zoom?: number
  markerCoords?: [number, number]
  markerTitle?: string
  markerBody?: string
  className?: string
}

declare global {
  interface Window {
    ymaps?: any
  }
}

export function YandexMap({
  center = [55.751574, 37.573856],
  zoom = 12,
  markerCoords = [55.751574, 37.573856],
  markerTitle = 'FLEUR',
  markerBody = 'Мастерская цветов',
  className,
}: YandexMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const placemarkRef = useRef<any>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY
    if (!apiKey) return

    // Check if already loaded
    if (window.ymaps) {
      setLoaded(true)
      return
    }

    // Load script
    const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]')
    if (existingScript) {
      if (window.ymaps) {
        setLoaded(true)
      } else {
        existingScript.addEventListener('load', () => setLoaded(true))
      }
      return
    }

    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`
    script.async = true
    script.onload = () => setLoaded(true)
    document.head.appendChild(script)
  }, [])

  // Initialize map
  useEffect(() => {
    if (!loaded || !window.ymaps || !containerRef.current) return
    if (mapInstanceRef.current) return
    let isMounted = true

    window.ymaps.ready(() => {
      if (!isMounted || !containerRef.current) return

      const map = new window.ymaps.Map(containerRef.current, {
        center,
        zoom,
        controls: ['zoomControl'],
      })

      map.behaviors.disable('scrollZoom')

      const placemark = new window.ymaps.Placemark(
        markerCoords,
        {
          hintContent: markerTitle,
          balloonContentHeader: `<span style="font-family:serif;font-size:16px;color:#2d2d2d">${markerTitle}</span>`,
          balloonContentBody: `<span style="font-family:sans-serif;font-size:13px;color:#5a5a5a">${markerBody}</span>`,
        },
        {
          preset: 'islands#dotIcon',
          iconColor: '#e8b4b8',
        },
      )

      map.geoObjects.add(placemark)
      mapInstanceRef.current = map
      placemarkRef.current = placemark
    })

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy()
        mapInstanceRef.current = null
        placemarkRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded])

  // Update marker and center reactively
  useEffect(() => {
    const map = mapInstanceRef.current
    const placemark = placemarkRef.current
    if (!map || !placemark) return

    placemark.geometry.setCoordinates(markerCoords)
    placemark.properties.set({
      hintContent: markerTitle,
      balloonContentHeader: `<span style="font-family:serif;font-size:16px;color:#2d2d2d">${markerTitle}</span>`,
      balloonContentBody: `<span style="font-family:sans-serif;font-size:13px;color:#5a5a5a">${markerBody}</span>`,
    })
    map.setCenter(center, zoom, { duration: 300 })
  }, [center, zoom, markerCoords, markerTitle, markerBody])

  return (
    <div
      ref={containerRef}
      className={`w-full h-full rounded-xl overflow-hidden ${className ?? ''}`}
      style={{ minHeight: '180px' }}
    />
  )
}
