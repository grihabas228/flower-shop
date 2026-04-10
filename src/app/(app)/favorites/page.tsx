import type { Metadata } from 'next'
import { FavoritesContent } from './FavoritesContent'

export const metadata: Metadata = {
  title: 'Избранное — FLEUR',
  description: 'Ваши избранные букеты и цветочные композиции.',
}

export default function FavoritesPage() {
  return (
    <div className="min-h-screen bg-[#faf5f0]">
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 font-[family-name:var(--font-playfair)] text-3xl font-medium tracking-tight text-[#2d2d2d] lg:text-4xl">
          Избранное
        </h1>
        <FavoritesContent />
      </div>
    </div>
  )
}
