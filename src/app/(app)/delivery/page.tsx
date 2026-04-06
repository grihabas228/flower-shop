import type { Metadata } from 'next'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import {
  MapPin,
  Truck,
  CreditCard,
  Smartphone,
  Banknote,
  SplitSquareVertical,
  Clock,
  Store,
} from 'lucide-react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

const paymentMethods = [
  {
    icon: CreditCard,
    title: 'Картой онлайн',
    description: 'Оплатите заказ банковской картой на сайте — безопасно и быстро.',
  },
  {
    icon: Smartphone,
    title: 'Картой курьеру',
    description: 'Курьер возьмёт с собой терминал для оплаты картой при получении.',
  },
  {
    icon: Banknote,
    title: 'Наличными',
    description: 'Вы можете оплатить заказ наличными при получении букета.',
  },
  {
    icon: SplitSquareVertical,
    title: 'Долями',
    description: 'Разделите оплату на 4 части без переплат через сервис «Долями».',
  },
]

const orderSteps = [
  {
    number: 1,
    title: 'Укажите свой адрес',
    description: 'Введите адрес доставки на сайте, чтобы мы подобрали ближайшую мастерскую.',
  },
  {
    number: 2,
    title: 'Выбирайте всё, что нужно, и добавляйте в корзину',
    description: 'Не забудьте про новинки и товары со скидками.',
  },
  {
    number: 3,
    title: 'Выберите способ доставки и нажмите «Оформить заказ»',
    description: 'Отслеживайте статус заказа на сайте. Спишем оплату, только когда соберём ваш заказ.',
  },
  {
    number: 4,
    title: 'Дождитесь курьера',
    description:
      'Мы доставляем заказы в любое удобное для вас время. Заказ можно оценить и оставить чаевые курьеру.',
  },
]

export default async function DeliveryPage() {
  const payload = await getPayload({ config: configPromise })
  const { docs: deliveryZones } = await payload.find({
    collection: 'delivery-zones',
    where: { active: { equals: true } },
    sort: 'price',
    limit: 20,
  })

  return (
    <div className="min-h-[60vh]">
      {/* Header Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Breadcrumbs
          items={[
            { label: 'Главная', href: '/' },
            { label: 'Доставка и самовывоз' },
          ]}
        />
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.5rem] text-[#2d2d2d] leading-tight mb-10">
          Доставка и Самовывоз
          <br className="hidden sm:block" />
          <span className="text-[#8a8a8a]"> по Москве и Московской области</span>
        </h1>
      </div>

      {/* Hero: Photo + Work Schedule */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Photo */}
          <div className="relative rounded-2xl overflow-hidden bg-[#f0ebe3] aspect-[4/3] lg:aspect-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-[#e8b4b8]/20 to-[#b5c7a3]/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-10 w-10 text-[#e8b4b8]" />
                </div>
                <p className="font-serif text-xl text-[#2d2d2d]/80">Доставка с заботой</p>
              </div>
            </div>
          </div>

          {/* Work Schedule */}
          <div className="rounded-2xl border border-[#e8e4de] bg-white p-8 flex flex-col justify-center">
            <h2 className="font-serif text-2xl text-[#2d2d2d] mb-6">Режим работы FLEUR</h2>
            <div className="space-y-4 text-[#5a5a5a] font-sans text-[15px] leading-relaxed">
              <p>
                Мы обрабатываем заказы с 9:00 до 20:00. При оформлении заказа в ночное время, букет
                может быть доставлен не ранее 11:00 следующего дня.
              </p>
              <p>
                При срочной доставке мы постараемся доставить букет, как можно скорее, точное время
                зависит от загруженности магазина и дорог.
              </p>
              <div className="pt-4 border-t border-[#e8e4de]">
                <p className="text-[#2d2d2d] font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#e8b4b8]" />
                  Важно
                </p>
                <p className="text-sm">
                  Курьер после приезда на место ожидает получателя не более 25 минут. В случае
                  отсутствия получателя, букет по предварительной договорённости можно оставить у
                  знакомых, соседей или вернуть обратно (в этом случае доставка оплачивается
                  повторно).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Zones */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <h2 className="font-serif text-2xl sm:text-3xl text-[#2d2d2d] mb-8">Зоны доставки</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deliveryZones.map((zone) => {
            const isPickup = zone.zoneName === 'Самовывоз'
            return (
              <div
                key={zone.id}
                className="rounded-xl border border-[#e8e4de] bg-white p-6 hover:shadow-md transition-shadow duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-[#faf5f0] flex items-center justify-center mb-4">
                  {isPickup ? (
                    <Store className="h-5 w-5 text-[#e8b4b8]" />
                  ) : (
                    <Truck className="h-5 w-5 text-[#e8b4b8]" />
                  )}
                </div>
                <h3 className="font-sans font-medium text-[#2d2d2d] mb-1">{zone.zoneName}</h3>
                {zone.estimatedTime && (
                  <p className="text-sm text-[#8a8a8a] mb-4 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {zone.estimatedTime}
                  </p>
                )}
                <div className="space-y-2.5 mt-3 pt-3 border-t border-[#e8e4de]">
                  <div className="flex justify-between items-baseline gap-2 text-sm">
                    <span className="text-[#5a5a5a]">Стоимость</span>
                    <span className="font-medium text-[#2d2d2d]">
                      {zone.price === 0 ? 'Бесплатно' : `${zone.price.toLocaleString('ru-RU')} \u20BD`}
                    </span>
                  </div>
                  {zone.freeFrom != null && (
                    <div className="flex justify-between items-baseline gap-2 text-sm">
                      <span className="text-[#5a5a5a]">Бесплатно от</span>
                      <span className="font-medium text-[#b5c7a3]">
                        {zone.freeFrom.toLocaleString('ru-RU')} &#8381;
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-[#f5f0eb]/50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl sm:text-3xl text-[#2d2d2d] mb-3">
            Способы оплаты заказа
          </h2>
          <p className="text-sm text-[#8a8a8a] mb-8">
            Авторские букеты от 2 500 &#8381; и подарки от 500 &#8381;, с доставкой от 120 минут.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {paymentMethods.map((method) => {
              const Icon = method.icon
              return (
                <div
                  key={method.title}
                  className="rounded-xl border border-[#e8e4de] bg-white p-6 hover:shadow-md transition-shadow duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#faf5f0] flex items-center justify-center mb-5">
                    <Icon className="h-6 w-6 text-[#b5c7a3]" />
                  </div>
                  <h3 className="font-sans font-medium text-[#2d2d2d] mb-2">{method.title}</h3>
                  <p className="text-sm text-[#8a8a8a] leading-relaxed">{method.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* How to Order */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="font-serif text-2xl sm:text-3xl text-[#2d2d2d] mb-10">
          Как сделать заказ
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {orderSteps.map((step) => (
            <div key={step.number} className="relative">
              <div className="font-serif text-4xl text-[#e8b4b8] mb-4">{step.number}</div>
              {/* Connector line (desktop only) */}
              {step.number < 4 && (
                <div className="hidden lg:block absolute top-5 left-[3.5rem] right-0 h-px bg-[#e8e4de]" />
              )}
              <h3 className="font-sans font-medium text-[#2d2d2d] mb-2 text-[15px] leading-snug">
                {step.title}
              </h3>
              <p className="text-sm text-[#8a8a8a] leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Доставка и самовывоз — FLEUR',
  description:
    'Доставка цветов по Москве и Московской области. Самовывоз, доставка курьером, ночная доставка.',
  openGraph: mergeOpenGraph({
    title: 'Доставка — FLEUR',
    url: '/delivery',
  }),
}
