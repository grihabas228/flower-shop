import { Leaf, Truck, ShieldCheck, Gift } from 'lucide-react'

const benefits = [
  {
    icon: Leaf,
    title: 'Свежие цветы',
    description: 'Поставки каждое утро напрямую от плантаций',
  },
  {
    icon: Truck,
    title: 'Быстрая доставка',
    description: 'Доставим ваш букет за 2 часа по Москве',
  },
  {
    icon: ShieldCheck,
    title: 'Гарантия качества',
    description: 'Заменим букет, если он вам не понравится',
  },
  {
    icon: Gift,
    title: 'Открытка в подарок',
    description: 'Бесплатная открытка с вашим текстом к каждому заказу',
  },
]

export function BenefitsSection() {
  return (
    <section className="bg-[#faf5f0] py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4">
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-10">
        {benefits.map((benefit) => (
          <div key={benefit.title} className="group text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8b4b8]/10 transition-colors duration-300 group-hover:bg-[#e8b4b8]/20">
              <benefit.icon
                className="h-6 w-6 text-[#e8b4b8]"
                strokeWidth={1.3}
              />
            </div>
            <h3 className="mb-1.5 font-serif text-[16px] font-medium text-[#2d2d2d] lg:text-[17px]">
              {benefit.title}
            </h3>
            <p className="font-sans text-[12px] leading-relaxed text-[#6b6b6b] lg:text-[13px]">
              {benefit.description}
            </p>
          </div>
        ))}
      </div>
      </div>
    </section>
  )
}
