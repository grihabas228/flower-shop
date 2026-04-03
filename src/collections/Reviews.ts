import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  access: {
    create: () => true,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    useAsTitle: 'customer',
    group: 'Shop',
    defaultColumns: ['customer', 'rating', 'product', 'approved'],
  },
  fields: [
    {
      name: 'customer',
      type: 'text',
      required: true,
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
    },
    {
      name: 'text',
      type: 'textarea',
      required: true,
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'approved',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
