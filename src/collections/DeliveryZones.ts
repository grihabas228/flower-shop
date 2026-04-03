import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const DeliveryZones: CollectionConfig = {
  slug: 'delivery-zones',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    useAsTitle: 'zoneName',
    group: 'Shop',
    defaultColumns: ['zoneName', 'price', 'freeFrom', 'active'],
  },
  fields: [
    {
      name: 'zoneName',
      type: 'text',
      required: true,
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
