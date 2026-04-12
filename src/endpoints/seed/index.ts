import type { CollectionSlug, GlobalSlug, Payload, PayloadRequest, File } from 'payload'

import { contactFormData } from './contact-form'
import { contactPageData } from './contact-page'
import { productHatData } from './product-hat'
import { productTshirtData, productTshirtVariant } from './product-tshirt'
import { homePageData } from './home'
import { imageHatData } from './image-hat'
import { imageTshirtBlackData } from './image-tshirt-black'
import { imageTshirtWhiteData } from './image-tshirt-white'
import { imageHero1Data } from './image-hero-1'
import { Address, Transaction, VariantOption } from '@/payload-types'

const collections: CollectionSlug[] = [
  'categories',
  'media',
  'pages',
  'products',
  'forms',
  'form-submissions',
  'variants',
  'variantOptions',
  'variantTypes',
  'carts',
  'transactions',
  'addresses',
  'orders',
  'promo-codes',
  'delivery-zones',
]

const categories = [
  { title: 'Букеты', slug: 'bukety' },
  { title: 'Розы', slug: 'rozy' },
  { title: 'Композиции', slug: 'kompozicii' },
  { title: 'Подарки', slug: 'podarki' },
]

const sizeVariantOptions = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
  { label: 'X Large', value: 'xlarge' },
]

const colorVariantOptions = [
  { label: 'Black', value: 'black' },
  { label: 'White', value: 'white' },
]

const globals: GlobalSlug[] = ['header', 'footer']

const baseAddressUSData: Transaction['billingAddress'] = {
  title: 'Dr.',
  firstName: 'Otto',
  lastName: 'Octavius',
  phone: '1234567890',
  company: 'Oscorp',
  addressLine1: '123 Main St',
  addressLine2: 'Suite 100',
  city: 'New York',
  state: 'NY',
  postalCode: '10001',
  country: 'US',
}

const baseAddressUKData: Transaction['billingAddress'] = {
  title: 'Mr.',
  firstName: 'Oliver',
  lastName: 'Twist',
  phone: '1234567890',
  addressLine1: '48 Great Portland St',
  city: 'London',
  postalCode: 'W1W 7ND',
  country: 'GB',
}

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')

  // we need to clear the media directory before seeding
  // as well as the collections and globals
  // this is because while `yarn seed` drops the database
  // the custom `/api/seed` endpoint does not
  payload.logger.info(`— Clearing collections and globals...`)

  // clear the database
  await Promise.all(
    globals.map((global) =>
      payload.updateGlobal({
        slug: global,
        data: {
          navItems: [],
        },
        depth: 0,
        context: {
          disableRevalidate: true,
        },
      }),
    ),
  )

  for (const collection of collections) {
    await payload.db.deleteMany({ collection, req, where: {} })
    if (payload.collections[collection].config.versions) {
      await payload.db.deleteVersions({ collection, req, where: {} })
    }
  }

  payload.logger.info(`— Seeding customer and customer data...`)

  await payload.delete({
    collection: 'users',
    depth: 0,
    where: {
      email: {
        equals: 'customer@example.com',
      },
    },
  })

  payload.logger.info(`— Seeding media...`)

  const [imageHatBuffer, imageTshirtBlackBuffer, imageTshirtWhiteBuffer, heroBuffer] =
    await Promise.all([
      fetchFileByURL(
        'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/ecommerce/src/endpoints/seed/hat-logo.png',
      ),
      fetchFileByURL(
        'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/ecommerce/src/endpoints/seed/tshirt-black.png',
      ),
      fetchFileByURL(
        'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/ecommerce/src/endpoints/seed/tshirt-white.png',
      ),
      fetchFileByURL(
        'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-hero1.webp',
      ),
    ])

  const [
    customer,
    imageHat,
    imageTshirtBlack,
    imageTshirtWhite,
    imageHero,
    accessoriesCategory,
    tshirtsCategory,
    hatsCategory,
  ] = await Promise.all([
    payload.create({
      collection: 'users',
      data: {
        name: 'Customer',
        email: 'customer@example.com',
        password: 'password',
        roles: ['customer'],
      },
    }),
    payload.create({
      collection: 'media',
      data: imageHatData,
      file: imageHatBuffer,
    }),
    payload.create({
      collection: 'media',
      data: imageTshirtBlackData,
      file: imageTshirtBlackBuffer,
    }),
    payload.create({
      collection: 'media',
      data: imageTshirtWhiteData,
      file: imageTshirtWhiteBuffer,
    }),
    payload.create({
      collection: 'media',
      data: imageHero1Data,
      file: heroBuffer,
    }),
    ...categories.map((cat) =>
      payload.create({
        collection: 'categories',
        data: {
          title: cat.title,
          slug: cat.slug,
        },
      }),
    ),
  ])

  payload.logger.info(`— Seeding variant types and options...`)

  const sizeVariantType = await payload.create({
    collection: 'variantTypes',
    data: {
      name: 'size',
      label: 'Size',
    },
  })

  const sizeVariantOptionsResults: VariantOption[] = []

  for (const option of sizeVariantOptions) {
    const result = await payload.create({
      collection: 'variantOptions',
      data: {
        ...option,
        variantType: sizeVariantType.id,
      },
    })
    sizeVariantOptionsResults.push(result)
  }

  const [small, medium, large, xlarge] = sizeVariantOptionsResults

  const colorVariantType = await payload.create({
    collection: 'variantTypes',
    data: {
      name: 'color',
      label: 'Color',
    },
  })

  const [black, white] = await Promise.all(
    colorVariantOptions.map((option) => {
      return payload.create({
        collection: 'variantOptions',
        data: {
          ...option,
          variantType: colorVariantType.id,
        },
      })
    }),
  )

  payload.logger.info(`— Seeding products...`)

  const productHat = await payload.create({
    collection: 'products',
    depth: 0,
    data: productHatData({
      galleryImage: imageHat,
      metaImage: imageHat,
      variantTypes: [colorVariantType],
      categories: [hatsCategory],
      relatedProducts: [],
    }),
  })

  const productTshirt = await payload.create({
    collection: 'products',
    depth: 0,
    data: productTshirtData({
      galleryImages: [
        { image: imageTshirtBlack, variantOption: black },
        { image: imageTshirtWhite, variantOption: white },
      ],
      metaImage: imageTshirtBlack,
      contentImage: imageHero,
      variantTypes: [colorVariantType, sizeVariantType],
      categories: [tshirtsCategory],
      relatedProducts: [productHat],
    }),
  })

  let hoodieID: number | string = productTshirt.id

  if (payload.db.defaultIDType === 'text') {
    hoodieID = `"${hoodieID}"`
  }

  const [
    smallTshirtHoodieVariant,
    mediumTshirtHoodieVariant,
    largeTshirtHoodieVariant,
    xlargeTshirtHoodieVariant,
  ] = await Promise.all(
    [small, medium, large, xlarge].map((variantOption) =>
      payload.create({
        collection: 'variants',
        depth: 0,
        data: productTshirtVariant({
          product: productTshirt,
          variantOptions: [variantOption, white],
        }),
      }),
    ),
  )

  await Promise.all(
    [small, medium, large, xlarge].map((variantOption) =>
      payload.create({
        collection: 'variants',
        depth: 0,
        data: productTshirtVariant({
          product: productTshirt,
          variantOptions: [variantOption, black],
          ...(variantOption.value === 'medium' ? { inventory: 0 } : {}),
        }),
      }),
    ),
  )

  // ── Flower product: "Красные розы" with quantity variants ──
  payload.logger.info(`— Seeding flower product...`)

  const quantityVariantType = await payload.create({
    collection: 'variantTypes',
    data: { name: 'quantity', label: 'Количество' },
  })

  const quantityOptions: VariantOption[] = []
  for (const opt of [
    { label: '15 роз', value: '15' },
    { label: '25 роз', value: '25' },
    { label: '35 роз', value: '35' },
    { label: '51 роза', value: '51' },
  ]) {
    const result = await payload.create({
      collection: 'variantOptions',
      data: { ...opt, variantType: quantityVariantType.id },
    })
    quantityOptions.push(result)
  }

  const [qty15, qty25, qty35, qty51] = quantityOptions

  // Fetch 4 flower images from Unsplash (free, no auth needed for small sizes)
  const [flowerImg1Buf, flowerImg2Buf, flowerImg3Buf, flowerImg4Buf] = await Promise.all([
    fetchFileByURL('https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=800&q=80'),
    fetchFileByURL('https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=800&q=80'),
    fetchFileByURL('https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800&q=80'),
    fetchFileByURL('https://images.unsplash.com/photo-1494972308805-463bc619d34e?w=800&q=80'),
  ])

  const [flowerImg1, flowerImg2, flowerImg3, flowerImg4] = await Promise.all([
    payload.create({ collection: 'media', data: { alt: 'Букет красных роз — вид спереди' }, file: { ...flowerImg1Buf, name: 'roses-front.jpg' } }),
    payload.create({ collection: 'media', data: { alt: 'Букет красных роз — крупный план' }, file: { ...flowerImg2Buf, name: 'roses-closeup.jpg' } }),
    payload.create({ collection: 'media', data: { alt: 'Букет красных роз — в упаковке' }, file: { ...flowerImg3Buf, name: 'roses-wrapped.jpg' } }),
    payload.create({ collection: 'media', data: { alt: 'Букет красных роз — с зеленью' }, file: { ...flowerImg4Buf, name: 'roses-greenery.jpg' } }),
  ])

  const productRoses = await payload.create({
    collection: 'products',
    depth: 0,
    data: {
      title: 'Красные розы',
      slug: 'krasnye-rozy',
      enableVariants: true,
      variantTypes: [quantityVariantType].map((t) => t.id),
      variantDisplayType: 'quantity',
      gallery: [
        { image: flowerImg1.id },
        { image: flowerImg2.id },
        { image: flowerImg3.id },
        { image: flowerImg4.id },
      ],
      categories: [accessoriesCategory].map((c) => c.id), // "Букеты" category
      relatedProducts: [productTshirt.id, productHat.id],
      priceInUSD: 3999,
      inventory: 0, // managed by variants
      meta: {
        title: 'Красные розы — FLEUR',
        description: 'Роскошный букет красных роз с бесплатной доставкой по Москве',
        image: flowerImg1.id,
      },
      _status: 'published',
    },
  })

  // Create quantity variants with different prices
  await Promise.all(
    [
      { option: qty15, price: 3999, inventory: 50 },
      { option: qty25, price: 5999, inventory: 30 },
      { option: qty35, price: 7999, inventory: 20 },
      { option: qty51, price: 11999, inventory: 10 },
    ].map(({ option, price, inventory }) =>
      payload.create({
        collection: 'variants',
        depth: 0,
        data: {
          product: productRoses.id,
          options: [option.id],
          priceInUSD: price,
          priceInUSDEnabled: true,
          inventory,
          _status: 'published',
        },
      }),
    ),
  )

  payload.logger.info(`— Seeding contact form...`)

  const contactForm = await payload.create({
    collection: 'forms',
    depth: 0,
    data: contactFormData(),
  })

  payload.logger.info(`— Seeding pages...`)

  const [_, contactPage] = await Promise.all([
    payload.create({
      collection: 'pages',
      depth: 0,
      data: homePageData({
        contentImage: imageHero,
        metaImage: imageHat,
      }),
    }),
    payload.create({
      collection: 'pages',
      depth: 0,
      data: contactPageData({
        contactForm: contactForm,
      }),
    }),
  ])

  payload.logger.info(`— Seeding addresses...`)

  const customerUSAddress = await payload.create({
    collection: 'addresses',
    depth: 0,
    data: {
      customer: customer.id,
      ...(baseAddressUSData as Address),
    },
  })

  const customerUKAddress = await payload.create({
    collection: 'addresses',
    depth: 0,
    data: {
      customer: customer.id,
      ...(baseAddressUKData as Address),
    },
  })

  payload.logger.info(`— Seeding transactions...`)

  const pendingTransaction = await payload.create({
    collection: 'transactions',
    data: {
      currency: 'USD',
      customer: customer.id,
      status: 'pending',
      billingAddress: baseAddressUSData,
    },
  })

  const succeededTransaction = await payload.create({
    collection: 'transactions',
    data: {
      currency: 'USD',
      customer: customer.id,
      status: 'succeeded',
      billingAddress: baseAddressUSData,
    },
  })

  let succeededTransactionID: number | string = succeededTransaction.id

  if (payload.db.defaultIDType === 'text') {
    succeededTransactionID = `"${succeededTransactionID}"`
  }

  payload.logger.info(`— Seeding carts...`)

  // This cart is open as it's created now
  const openCart = await payload.create({
    collection: 'carts',
    data: {
      customer: customer.id,
      currency: 'USD',
      items: [
        {
          product: productTshirt.id,
          variant: mediumTshirtHoodieVariant.id,
          quantity: 1,
        },
      ],
    },
  })

  const oldTimestamp = new Date('2023-01-01T00:00:00Z').toISOString()

  // Cart is abandoned because it was created long in the past
  const abandonedCart = await payload.create({
    collection: 'carts',
    data: {
      currency: 'USD',
      createdAt: oldTimestamp,
      items: [
        {
          product: productHat.id,
          quantity: 1,
        },
      ],
    },
  })

  // Cart is purchased because it has a purchasedAt date
  const completedCart = await payload.create({
    collection: 'carts',
    data: {
      customer: customer.id,
      currency: 'USD',
      purchasedAt: new Date().toISOString(),
      subtotal: 7499,
      items: [
        {
          product: productTshirt.id,
          variant: smallTshirtHoodieVariant.id,
          quantity: 1,
        },
        {
          product: productTshirt.id,
          variant: mediumTshirtHoodieVariant.id,
          quantity: 1,
        },
      ],
    },
  })

  let completedCartID: number | string = completedCart.id

  if (payload.db.defaultIDType === 'text') {
    completedCartID = `"${completedCartID}"`
  }

  payload.logger.info(`— Seeding orders...`)

  const orderInCompleted = await payload.create({
    collection: 'orders',
    data: {
      amount: 7499,
      currency: 'USD',
      customer: customer.id,
      shippingAddress: baseAddressUSData,
      items: [
        {
          product: productTshirt.id,
          variant: smallTshirtHoodieVariant.id,
          quantity: 1,
        },
        {
          product: productTshirt.id,
          variant: mediumTshirtHoodieVariant.id,
          quantity: 1,
        },
      ],
      status: 'completed',
      transactions: [succeededTransaction.id],
    },
  })

  const orderInProcessing = await payload.create({
    collection: 'orders',
    data: {
      amount: 7499,
      currency: 'USD',
      customer: customer.id,
      shippingAddress: baseAddressUSData,
      items: [
        {
          product: productTshirt.id,
          variant: smallTshirtHoodieVariant.id,
          quantity: 1,
        },
        {
          product: productTshirt.id,
          variant: mediumTshirtHoodieVariant.id,
          quantity: 1,
        },
      ],
      status: 'processing',
      transactions: [succeededTransaction.id],
    },
  })

  payload.logger.info(`— Seeding promo codes...`)

  await payload.create({
    collection: 'promo-codes',
    data: {
      code: 'FLEUR10',
      discountType: 'percentage',
      discountValue: 10,
      active: true,
      usageCount: 0,
    },
  })

  payload.logger.info(`— Seeding delivery zones...`)

  await Promise.all([
    payload.create({
      collection: 'delivery-zones',
      data: {
        zoneType: 'IN_MKAD',
        price3h: 500,
        price1h: 700,
        priceExact: 1200,
        availableIntervals: ['3h', '1h', 'exact'],
        freeFrom: 5000,
        estimatedTime: 'от 90 мин',
        active: true,
      },
    }),
    payload.create({
      collection: 'delivery-zones',
      data: {
        zoneType: 'OUT_MKAD_5',
        price3h: 700,
        price1h: 1000,
        priceExact: 1500,
        availableIntervals: ['3h', '1h', 'exact'],
        freeFrom: 8000,
        estimatedTime: 'от 120 мин',
        active: true,
      },
    }),
    payload.create({
      collection: 'delivery-zones',
      data: {
        zoneType: 'OUT_MKAD_10',
        price3h: 900,
        price1h: 1300,
        availableIntervals: ['3h', '1h'],
        freeFrom: 10000,
        estimatedTime: 'от 150 мин',
        active: true,
      },
    }),
    payload.create({
      collection: 'delivery-zones',
      data: {
        zoneType: 'OUT_MKAD_15',
        price3h: 1200,
        availableIntervals: ['3h'],
        estimatedTime: 'от 180 мин',
        active: true,
      },
    }),
    payload.create({
      collection: 'delivery-zones',
      data: {
        zoneType: 'OUT_MKAD_30',
        price3h: 1800,
        availableIntervals: ['3h'],
        estimatedTime: 'от 240 мин',
        active: true,
      },
    }),
    payload.create({
      collection: 'delivery-zones',
      data: {
        zoneType: 'OUT_MKAD_50',
        price3h: 2500,
        availableIntervals: ['3h'],
        estimatedTime: 'от 300 мин',
        active: true,
      },
    }),
    payload.create({
      collection: 'delivery-zones',
      data: {
        zoneType: 'PICKUP',
        price3h: 0,
        availableIntervals: ['3h'],
        estimatedTime: '30 мин',
        active: true,
      },
    }),
  ])

  payload.logger.info(`— Seeding globals...`)

  await Promise.all([
    payload.updateGlobal({
      slug: 'header',
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Home',
              url: '/',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Shop',
              url: '/shop',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Account',
              url: '/account',
            },
          },
        ],
      },
    }),
    payload.updateGlobal({
      slug: 'footer',
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Admin',
              url: '/admin',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Find my order',
              url: '/find-order',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Source Code',
              newTab: true,
              url: 'https://github.com/payloadcms/payload/tree/main/templates/website',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Payload',
              newTab: true,
              url: 'https://payloadcms.com/',
            },
          },
        ],
      },
    }),
  ])

  payload.logger.info('Seeded database successfully!')
}

async function fetchFileByURL(url: string): Promise<File> {
  const res = await fetch(url, {
    credentials: 'include',
    method: 'GET',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`)
  }

  const data = await res.arrayBuffer()

  return {
    name: url.split('/').pop() || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: `image/${url.split('.').pop()}`,
    size: data.byteLength,
  }
}
