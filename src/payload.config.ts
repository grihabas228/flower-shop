import { postgresAdapter } from '@payloadcms/db-postgres'
import { en } from '@payloadcms/translations/languages/en'
import { ru } from '@payloadcms/translations/languages/ru'

import {
  BoldFeature,
  EXPERIMENTAL_TableFeature,
  IndentFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  UnderlineFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import sharp from 'sharp'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { getServerSideURL } from '@/utilities/getURL'
import { Categories } from '@/collections/Categories'
import { DeliveryZones } from '@/collections/DeliveryZones'
import { Media } from '@/collections/Media'
import { Pages } from '@/collections/Pages'
import { ProductCategories } from '@/collections/ProductCategories'
import { PromoCodes } from '@/collections/PromoCodes'
import { PromoSlides } from '@/collections/PromoSlides'
import { Reviews } from '@/collections/Reviews'
import { Users } from '@/collections/Users'
import { Footer } from '@/globals/Footer'
import { Header } from '@/globals/Header'
import { plugins } from './plugins'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      beforeLogin: ['@/components/BeforeLogin#BeforeLogin'],
      beforeDashboard: ['@/components/BeforeDashboard#BeforeDashboard'],
    },
    user: Users.slug,
  },
  collections: [
    Users,
    Pages,
    Categories,
    Media,
    ProductCategories,
    PromoCodes,
    Reviews,
    PromoSlides,
    DeliveryZones,
  ],
  // PostgreSQL (Neon) — replacing MongoDB from template
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  editor: lexicalEditor({
    features: () => {
      return [
        UnderlineFeature(),
        BoldFeature(),
        ItalicFeature(),
        OrderedListFeature(),
        UnorderedListFeature(),
        LinkFeature({
          enabledCollections: ['pages'],
          fields: ({ defaultFields }) => {
            const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
              if ('name' in field && field.name === 'url') return false
              return true
            })

            return [
              ...defaultFieldsWithoutUrl,
              {
                name: 'url',
                type: 'text',
                admin: {
                  condition: ({ linkType }) => linkType !== 'internal',
                },
                label: ({ t }) => t('fields:enterURL'),
                required: true,
              },
            ]
          },
        }),
        IndentFeature(),
        EXPERIMENTAL_TableFeature(),
      ]
    },
  }),
  cors: '*',
  csrf: [
    getServerSideURL(),
    'https://flower-shop-drab-eight.vercel.app',
  ].filter(Boolean),
  //email: nodemailerAdapter(),
  endpoints: [],
  globals: [Header, Footer],
  plugins,
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL: getServerSideURL(),
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // Russian admin panel UI
  i18n: {
    supportedLanguages: { en, ru },
  },
  // Content localization — Russian only
  localization: {
    locales: [
      {
        label: 'Русский',
        code: 'ru',
      },
    ],
    defaultLocale: 'ru',
  },
})
