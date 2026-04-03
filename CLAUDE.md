# Flower Shop E-Commerce — CLAUDE.md

## Project Overview
Premium flower delivery e-commerce store. Russian language, RU market.
High-conversion commercial store, NOT a brochure website.
Based on official Payload CMS E-commerce Template.

## Tech Stack
- **Framework**: Next.js 16 (App Router, TypeScript)
- **CMS/Backend**: Payload CMS 3.x E-commerce Template (single deploy)
- **Database**: Neon PostgreSQL (Vercel integration)
- **File Storage**: Vercel Blob Store
- **Styling**: Tailwind CSS + shadcn/ui
- **Animations**: Aceternity UI, Framer Motion
- **Hosting**: Vercel (auto-deploy from GitHub)
- **Payments**: ЮKassa (replacing Stripe from template)
- **Integrations**: МойСклад (JSON API 1.2), RetailCRM (API v5)

## Repository
- GitHub: grihabas228/flower-shop
- Admin panel: /admin

## What E-commerce Template Already Provides
DO NOT recreate these — they exist in the template:
- Products collection with variants
- Cart (saved to user profile + localStorage for guests)
- Checkout flow with payment
- Orders + Transactions
- User accounts (admin + customer roles)
- Layout builder for pages
- SEO plugin (meta, OG, sitemap)
- Search plugin (SSR)
- Redirects plugin
- Draft/Preview system
- Media collection with uploads
- Pages + Posts collections
- Header + Footer globals

## What We Need to ADD (custom for flower shop)

### ProductCategories (new collection)
- title (text, required)
- slug (auto from title)
- image (upload)
- description (textarea)
- sortOrder (number)

### PromoCodes (new collection)
- code (text, unique, required)
- discountType (select: percentage / fixed)
- discountValue (number, required)
- minimumOrder (number, optional)
- validFrom (date)
- validUntil (date)
- usageLimit (number)
- usageCount (number, default 0)
- active (checkbox, default true)

### Reviews (new collection)
- customer (text)
- rating (number, 1-5)
- text (textarea)
- product (relationship to Products)
- approved (checkbox, default false)

### PromoSlides (new collection for hero carousel)
- title (text)
- subtitle (text)
- image (upload)
- buttonText (text)
- buttonLink (text)
- active (checkbox)
- sortOrder (number)

### DeliveryZones (new collection)
- zoneName (text — e.g. "Внутри МКАД", "За МКАД до 10 км")
- price (number)
- freeFrom (number — free delivery threshold)
- estimatedTime (text — e.g. "2 часа")
- active (checkbox)

### BouquetConstructor (new collection)
- flowers available (relationship to Products with tag "constructor")
- basePrice (number)
- wrapOptions (array: name, price)
- ribbonOptions (array: name, price)

## MODIFICATIONS to Template

### Replace Stripe → ЮKassa
- Remove Stripe plugin and dependencies
- Create lib/yookassa.ts client
- Payment endpoint: /api/payment/create → redirect to ЮKassa
- Webhook: /api/payment/webhook → update order status
- Docs: https://yookassa.ru/developers

### Add Russian Localization
- Payload i18n: add 'ru' to admin languages
- Payload localization: set 'ru' as default content locale
- All frontend UI text in Russian

### Integration: МойСклад (JSON API 1.2)
- Sync: Pull products, prices, stock → upsert in Payload Products
- Push: When order created → create CustomerOrder in МойСклад
- Cron: Vercel Cron for automatic sync
- API docs: https://dev.moysklad.ru/doc/api/remap/1.2/

### Integration: RetailCRM (API v5)
- Push: New order → RetailCRM /api/v5/orders/create
- Push: Customer data on order
- Sync: Order statuses back to Payload (webhook or cron)
- API docs: https://docs.retailcrm.ru/Developers/API/APIFeatures/APIRules

## Design Guidelines
- **Vibe**: High-end Parisian flower boutique. Clean, airy, luxurious.
- **Brand name**: FLEUR (can be changed later)
- **Color palette**: soft whites, warm cream (#faf5f0), muted rose pink (#e8b4b8), sage green (#b5c7a3), charcoal text (#2d2d2d)
- **Typography**: Playfair Display (serif headings), Inter (sans-serif body)
- **Spacing**: Generous whitespace, breathing room
- **Photos**: Large, high-quality flower photography is the hero
- **Cards**: Subtle shadows, soft rounded corners (12px), gentle lift on hover
- **Buttons**: Soft rounded, rose-pink accent, no aggressive CTAs
- **Reference sites**: Aesop.com, Le Labo — high-end minimalism
- **NEVER**: Generic marketplace look, loud discount badges, cluttered layouts
- Use shadcn/ui components as base, customize with Tailwind
- Use Aceternity UI for wow-effects on hero sections
- Use 21st.dev components when available via Magic MCP

## Key Pages (Frontend)
1. **/** — Homepage: hero slider, featured products, categories, benefits, reviews, constructor CTA
2. **/products** — Product grid with category filters, sorting, search
3. **/products/[slug]** — Product detail: photos, sizes, add to cart, related
4. **/constructor** — Bouquet constructor: pick flowers, wrapping, ribbon → price → cart
5. **/cart** — Shopping cart with quantity controls + promo code
6. **/checkout** — Contacts → delivery (with address-based pricing) → payment
7. **/account** — Customer orders history, profile
8. **/about** — About the shop
9. **/delivery** — Delivery info and zones with pricing
10. **/contacts** — Contact info, map

## Context Management Rules
- ONE feature per session. Finish → /clear → next feature.
- At 70% context → /compact. At 90% → /clear mandatory.
- Write specs to files before implementing. New session reads the spec.
- Use subagents for research: "use subagents to investigate X"
- When compacting, ALWAYS preserve: list of modified files, current task status, test commands.
- All documentation in English (better tokenization).
- UI text and content in Russian.

## Code Style
- TypeScript strict mode
- Functional components, no class components
- Server Components by default, "use client" only when needed
- Use Payload Local API in server components (no REST calls from same app)
- Tailwind for styling, no CSS modules
- File naming: kebab-case for files, PascalCase for components
- Commit messages in English, concise
- Always respond in Russian

## Commands Reference
- `pnpm dev` — local development
- `pnpm build` — production build
- `pnpm payload migrate` — run database migrations
- `pnpm payload generate:types` — regenerate TypeScript types

## DO NOT
- Do not install separate backend server — Payload runs inside Next.js
- Do not recreate what template already has (cart, checkout, orders, auth)
- Do not use Supabase — we use Neon PostgreSQL via Payload
- Do not hardcode Russian text — use Payload content where possible
- Do not skip TypeScript types — run generate:types after collection changes
