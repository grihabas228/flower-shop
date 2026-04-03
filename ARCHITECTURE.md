# Architecture — Flower Shop E-Commerce
# Based on Payload CMS Official E-commerce Template

## System Overview

```
┌─────────────────────────────────────────────────┐
│                   VERCEL (single deploy)         │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │    Next.js + Payload CMS (one app)       │    │
│  │                                          │    │
│  │  ┌──────────────┐  ┌─────────────────┐  │    │
│  │  │  Storefront   │  │  Admin Panel    │  │    │
│  │  │  (React/Next) │  │  (/admin)       │  │    │
│  │  └──────────────┘  └─────────────────┘  │    │
│  │                                          │    │
│  │  FROM TEMPLATE (already built):          │    │
│  │  Products, Cart, Checkout, Orders,       │    │
│  │  User Auth, Layout Builder, SEO,         │    │
│  │  Search, Media, Pages, Posts             │    │
│  │                                          │    │
│  │  CUSTOM (we build):                      │    │
│  │  Categories, PromoCodes, Reviews,        │    │
│  │  PromoSlides, DeliveryZones,             │    │
│  │  BouquetConstructor, ЮKassa,             │    │
│  │  МойСклад sync, RetailCRM sync           │    │
│  │                                          │    │
│  │  ┌──────────────────────────────────┐   │    │
│  │  │  API Routes (integrations)        │   │    │
│  │  │  /api/payment/*    (ЮKassa)       │   │    │
│  │  │  /api/moysklad/*   (sync)         │   │    │
│  │  │  /api/retailcrm/*  (sync)         │   │    │
│  │  │  /api/delivery/*   (calc)         │   │    │
│  │  │  /api/promo/*      (validate)     │   │    │
│  │  └──────────────────────────────────┘   │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  ┌──────────────┐  ┌───────────────────┐        │
│  │ Neon Postgres │  │ Vercel Blob Store │        │
│  │ (database)    │  │ (images/media)    │        │
│  └──────────────┘  └───────────────────┘        │
└─────────────────────────────────────────────────┘
         │                │                │
         ▼                ▼                ▼
  ┌────────────┐  ┌─────────────┐  ┌───────────┐
  │ МойСклад   │  │ RetailCRM   │  │ ЮKassa    │
  │ (ERP)      │  │ (CRM)       │  │ (payment) │
  └────────────┘  └─────────────┘  └───────────┘
```

## Data Flow

### Product Sync (МойСклад → Payload)
1. Cron or admin trigger
2. API Route fetches products from МойСклад
3. Upserts into Payload Products (template collection)
4. Frontend reads from Payload

### Order Flow
1. Customer browses, adds to cart (template handles this)
2. Customer enters promo code → /api/promo/validate
3. Customer selects delivery zone → price calculated
4. Checkout → /api/payment/create → ЮKassa redirect
5. Payment success → ЮKassa webhook → /api/payment/webhook
6. Webhook: updates Order status, pushes to RetailCRM + МойСклад
7. Admin sees order in Payload admin panel

### Bouquet Constructor Flow
1. Customer picks flowers (quantities) + wrap + ribbon
2. Price calculated in real-time on client
3. "Add to cart" creates a custom line item
4. Rest follows normal order flow

## Environment Variables
```
# Already set by template
PAYLOAD_SECRET=<random-key>
DATABASE_URI=<from-neon>
BLOB_READ_WRITE_TOKEN=<from-vercel>

# To add for integrations
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
MOYSKLAD_TOKEN=
RETAILCRM_URL=
RETAILCRM_API_KEY=
NEXT_PUBLIC_SITE_URL=
CRON_SECRET=
```
