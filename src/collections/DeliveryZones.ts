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
    defaultColumns: ['zoneType', 'price', 'freeFrom', 'active'],
  },
  fields: [
    {
      name: 'zoneType',
      type: 'select',
      required: true,
      options: [...ZONE_TYPE_OPTIONS],
    },
    {
      name: 'price',
      type: 'number',
      required: true,
    },
    {
      name: 'freeFrom',
      type: 'number',
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
