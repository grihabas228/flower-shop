import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const PromoCodes: CollectionConfig = {
  slug: 'promo-codes',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    useAsTitle: 'code',
    group: 'Shop',
    defaultColumns: ['code', 'discountType', 'discountValue', 'active'],
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'discountType',
      type: 'select',
      required: true,
      options: [
        { label: 'Процент', value: 'percentage' },
        { label: 'Фиксированная сумма', value: 'fixed' },
      ],
    },
    {
      name: 'discountValue',
      type: 'number',
      required: true,
    },
    {
      name: 'minimumOrder',
      type: 'number',
    },
    {
      name: 'validFrom',
      type: 'date',
    },
    {
      name: 'validUntil',
      type: 'date',
    },
    {
      name: 'usageLimit',
      type: 'number',
    },
    {
      name: 'usageCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
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
