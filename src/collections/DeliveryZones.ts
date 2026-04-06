import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const ZONE_TYPE_OPTIONS = [
  { label: 'Внутри МКАД', value: 'IN_MKAD' },
  { label: 'За МКАД до 5 км', value: 'OUT_MKAD_5' },
  { label: 'За МКАД 5-10 км', value: 'OUT_MKAD_10' },
  { label: 'За МКАД 10-15 км', value: 'OUT_MKAD_15' },
  { label: 'За МКАД 15-30 км', value: 'OUT_MKAD_30' },
  { label: 'За МКАД 30-50 км', value: 'OUT_MKAD_50' },
  { label: 'Самовывоз', value: 'PICKUP' },
] as const

export const DELIVERY_INTERVAL_OPTIONS = [
  { label: '3-часовой интервал', value: '3h' },
  { label: 'Часовой интервал', value: '1h' },
  { label: 'К точному времени', value: 'exact' },
] as const

export const DeliveryZones: CollectionConfig = {
  slug: 'delivery-zones',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    useAsTitle: 'zoneType',
    group: 'Shop',
    defaultColumns: ['zoneType', 'price3h', 'price1h', 'priceExact', 'freeFrom', 'active'],
  },
  fields: [
    {
      name: 'zoneType',
      type: 'select',
      required: true,
      options: [...ZONE_TYPE_OPTIONS],
    },
    {
      name: 'price3h',
      type: 'number',
      required: true,
      label: 'Цена за 3-часовой интервал',
      admin: {
        description: 'Базовая цена доставки. Применяется порог freeFrom.',
      },
    },
    {
      name: 'price1h',
      type: 'number',
      label: 'Цена за часовой интервал',
      admin: {
        description: 'Оставьте пустым, если интервал недоступен в этой зоне.',
      },
    },
    {
      name: 'priceExact',
      type: 'number',
      label: 'Цена к точному времени',
      admin: {
        description: 'Оставьте пустым, если интервал недоступен в этой зоне.',
      },
    },
    {
      name: 'availableIntervals',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['3h', '1h', 'exact'],
      options: [...DELIVERY_INTERVAL_OPTIONS],
      admin: {
        description: 'Какие интервалы доставки доступны клиентам в этой зоне.',
      },
    },
    {
      name: 'freeFrom',
      type: 'number',
      admin: {
        description: 'Порог суммы корзины, выше которого 3-часовая доставка бесплатна.',
      },
    },
    {
      name: 'estimatedTime',
      type: 'text',
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
