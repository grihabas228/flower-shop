import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export function ConstructorBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2d2d2d] to-[#3d3d3d]">
        {/* Decorative pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #e8b4b8 1px, transparent 1px), radial-gradient(circle at 80% 20%, #e8b4b8 1px, transparent 1px)`,
            backgroundSize: '40px 40px, 60px 60px',
          }}
        />

        {/* Gradient accent */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#e8b4b8]/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-[#e8b4b8]/5 blur-3xl" />

        <div className="relative flex flex-col items-center px-6 py-14 text-center sm:py-16 lg:py-20">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#e8b4b8]/20">
            <Sparkles className="h-5 w-5 text-[#e8b4b8]" strokeWidth={1.3} />
          </div>

          <h2 className="mb-3 font-serif text-2xl tracking-wide text-[#faf5f0] sm:text-3xl lg:text-[34px]">
            Собери свой идеальный букет
          </h2>
          <p className="mb-8 max-w-md font-sans text-[14px] leading-relaxed text-[#8a8a8a]">
            Выберите цветы, упаковку и ленту — мы соберём уникальный букет специально для вас
          </p>

          <Link
            href="/constructor"
            className="inline-flex items-center gap-2 rounded-full bg-[#e8b4b8] px-8 py-3 font-sans text-[13px] font-medium tracking-wide text-white transition-all duration-300 hover:bg-[#d9a0a5] hover:shadow-lg hover:shadow-[#e8b4b8]/20"
          >
            Собрать букет
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
