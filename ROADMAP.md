# Roadmap — Flower Shop E-Commerce
# Based on Payload E-commerce Template (cart, checkout, orders already included)

## Phase 1: Setup + Customization (Day 1-2)
**Goal**: E-commerce template running, Russian, custom collections

### Session 1: Project Init
- [ ] Create project: `npx create-payload-app@latest -t ecommerce`
- [ ] Configure PostgreSQL (Neon) instead of default DB
- [ ] Add Russian localization (i18n + content locale)
- [ ] Test: admin panel loads in Russian, template pages work
- [ ] Git init, push to GitHub (grihabas228/flower-shop)
- [ ] Deploy to Vercel

### Session 2: Custom Collections
- [ ] Create ProductCategories collection
- [ ] Create PromoCodes collection
- [ ] Create Reviews collection
- [ ] Create PromoSlides collection
- [ ] Create DeliveryZones collection
- [ ] Run migrations, generate types
- [ ] Test: all collections visible in admin

### Session 3: Remove Stripe, Prep for ЮKassa
- [ ] Remove Stripe plugin and dependencies
- [ ] Create placeholder payment endpoint structure
- [ ] Test: template still builds without Stripe

---

## Phase 2: Frontend Design (Day 3-5)
**Goal**: Replace template frontend with premium flower shop design

### Design workflow:
1. Generate in v0.app → copy code
2. Polish with 21st.dev Magic MCP in Claude Code
3. Apply Frontend Design skill for consistency

### Session 1: Layout (Header + Footer)
- [ ] Replace header with FLEUR design (from v0)
- [ ] Replace footer with FLEUR design (from v0)
- [ ] Add Playfair Display + Inter fonts
- [ ] Apply color palette globally

### Session 2: Homepage
- [ ] Hero slider (from PromoSlides collection)
- [ ] Featured products grid (from Products)
- [ ] Category cards
- [ ] Benefits section
- [ ] Reviews carousel
- [ ] Bouquet constructor CTA banner

### Session 3: Catalog + Product Detail
- [ ] Product grid with category filters, sorting
- [ ] Product detail: photos gallery, sizes, add to cart
- [ ] Related products section

### Session 4: Cart + Checkout Redesign
- [ ] Restyle existing cart (template has logic, we change design)
- [ ] Add promo code input to cart
- [ ] Restyle checkout with delivery zone selector
- [ ] Add delivery date/time picker

### Session 5: Other Pages + Mobile
- [ ] About, Delivery, Contacts pages
- [ ] Bouquet constructor page (UI only first)
- [ ] Mobile responsive fixes for ALL pages

---

## Phase 3: Business Logic (Day 6-8)
**Goal**: Promo codes, delivery calc, bouquet constructor

### Session 1: Promo Codes
- [ ] Validation logic (check code, dates, usage limit)
- [ ] Apply discount to cart total
- [ ] Show discount in checkout summary

### Session 2: Delivery Calculation
- [ ] Delivery zone selection in checkout
- [ ] Price calculation based on zone
- [ ] Free delivery threshold logic
- [ ] Show estimated delivery time

### Session 3: Bouquet Constructor
- [ ] UI: flower picker with quantities
- [ ] UI: wrap and ribbon selectors
- [ ] Real-time price calculation
- [ ] "Add custom bouquet to cart" flow
- [ ] Save as custom product in order

---

## Phase 4: Payment — ЮKassa (Day 9-10)
**Goal**: Working payment flow

### Session 1: Payment Creation
- [ ] Create ЮKassa API client (lib/yookassa.ts)
- [ ] Payment creation endpoint
- [ ] Redirect to ЮKassa payment page
- [ ] Return URL handling

### Session 2: Webhooks + Status
- [ ] Webhook handler for payment confirmation
- [ ] Update order + transaction status
- [ ] Handle failed/cancelled payments
- [ ] Test full flow in ЮKassa test mode

---

## Phase 5: МойСклад Integration (Day 11-12)
**Goal**: Product sync + order push

### Session 1: Product Sync
- [ ] МойСклад API client (lib/moysklad.ts)
- [ ] Fetch products → upsert in Payload
- [ ] Sync categories, prices, stock levels
- [ ] Admin button "Sync from МойСклад"

### Session 2: Order Sync + Cron
- [ ] Push new orders to МойСклад
- [ ] Vercel Cron for automatic product sync
- [ ] Test: change price in МойСклад → updates on site

---

## Phase 6: RetailCRM Integration (Day 13)
**Goal**: Orders and customers in CRM

### Session 1: Full Integration
- [ ] RetailCRM API client (lib/retailcrm.ts)
- [ ] Push orders to RetailCRM on creation
- [ ] Push customer data
- [ ] Sync order statuses back
- [ ] Test: place order → appears in RetailCRM

---

## Phase 7: Polish & Launch (Day 14-16)
- [ ] SEO: meta tags, OG images (template has plugin, just configure)
- [ ] Performance: image optimization, lazy loading
- [ ] Favicon and app icons
- [ ] 404 page
- [ ] Error handling on all forms
- [ ] Loading states and skeletons
- [ ] Yandex.Metrika integration
- [ ] Custom domain on Vercel
- [ ] Final testing: full order flow
- [ ] Replace PAYLOAD_SECRET with proper random key
- [ ] Go live!

---

## Phase 8: Post-Launch (ongoing)
- [ ] Email notifications (order confirmation, delivery updates)
- [ ] Telegram bot for admin notifications
- [ ] AI features (product recommendations, chat assistant)
- [ ] Chat with manager (Jivo/Carrot Quest or custom)
- [ ] Playwright testing
- [ ] Analytics dashboard
- [ ] Blog for SEO
- [ ] A/B testing for conversion
