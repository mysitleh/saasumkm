# UMKMStore — Toko Digital + Business Intelligence untuk UMKM Indonesia

Platform SaaS multi-tenant: bangun storefront, terima order via QRIS, jalankan POS, dan baca bisnis lewat analitik standar internasional (RFM, Holt forecast, cohort retention, market basket) — semua dari satu dashboard.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://prisma.io)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com)
[![Playwright](https://img.shields.io/badge/Playwright-e2e-45ba4b?logo=playwright)](https://playwright.dev)

---

## Daftar Isi

- [Preview](#preview)
- [Highlights](#highlights)
- [Fitur saat ini](#fitur-saat-ini)
- [Business Intelligence](#business-intelligence)
- [Design system](#design-system)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Demo akun](#demo-akun)
- [Struktur proyek](#struktur-proyek)
- [API surface](#api-surface)
- [Roles & permissions](#roles--permissions)
- [Testing & screenshots](#testing--screenshots)
- [Roadmap](#roadmap)
- [Gap fitur SaaS (yang masih kurang)](#gap-fitur-saas-yang-masih-kurang)
- [Deployment](#deployment)
- [Lisensi](#lisensi)

---

## Preview

### Cinematic landing (1600 × 1000)

![Hero — display-xxl 96px @ weight 330 di canvas-night](tests/screenshots/cinematic-wide/01-hero-cinematic.png)

### Authenticated dashboard (1440 × 900)

| Dashboard home | Business Intelligence | Analytics |
|:---:|:---:|:---:|
| ![Dashboard home](tests/screenshots/desktop-auth/10-dashboard-home.png) | ![Insights — RFM, Holt forecast, cohort, market basket](tests/screenshots/desktop-auth/11-dashboard-insights.png) | ![Analytics 14-hari](tests/screenshots/desktop-auth/12-dashboard-analytics.png) |

| Pesanan | Order detail | Produk |
|:---:|:---:|:---:|
| ![Pesanan dengan tab status](tests/screenshots/desktop-auth/13-dashboard-orders.png) | ![Order detail + print receipt](tests/screenshots/desktop-auth/14-dashboard-order-detail.png) | ![Produk list](tests/screenshots/desktop-auth/15-dashboard-products.png) |

| Pelanggan | Loyalty | Promo |
|:---:|:---:|:---:|
| ![Pelanggan + WA broadcast](tests/screenshots/desktop-auth/19-dashboard-customers.png) | ![Loyalty leaderboard](tests/screenshots/desktop-auth/20-dashboard-loyalty.png) | ![Promo CRUD](tests/screenshots/desktop-auth/18-dashboard-promos.png) |

| Billing | Settings | POS Cashier |
|:---:|:---:|:---:|
| ![Pricing tier with aloe-featured Pro](tests/screenshots/desktop-auth/23-dashboard-billing.png) | ![Settings + theme picker](tests/screenshots/desktop-auth/24-dashboard-settings.png) | ![POS full-screen](tests/screenshots/desktop-auth/25-dashboard-pos.png) |

| Theme Builder | Custom Domain | Template Builder |
|:---:|:---:|:---:|
| ![Theme Builder GUI dengan live preview](tests/screenshots/desktop-auth/26-dashboard-theme-builder.png) | ![Custom Domain dengan DNS instructions](tests/screenshots/desktop-auth/27-dashboard-custom-domain.png) | ![Template Builder — layout, button, icon, hero, carousel](tests/screenshots/desktop-auth/28-dashboard-template-builder.png) |

| Notifikasi (WA + Telegram daily digest) | | |
|:---:|:---:|:---:|
| ![Daily digest WhatsApp + Telegram config dengan test-send](tests/screenshots/desktop-auth/29-dashboard-notifications.png) | | |

### Public storefront (1440 × 900)

| Landing | Storefront / demo | Cart sheet |
|:---:|:---:|:---:|
| ![Landing two-canvas](tests/screenshots/desktop-public/01-landing.png) | ![Storefront /store/demo](tests/screenshots/desktop-public/04-storefront.png) | ![Cart drawer](tests/screenshots/desktop-public/05-storefront-cart.png) |

| Login | Register | Order tracking |
|:---:|:---:|:---:|
| ![Login](tests/screenshots/desktop-public/02-login.png) | ![Register tenant baru](tests/screenshots/desktop-public/03-register.png) | ![Track order](tests/screenshots/desktop-public/06-track.png) |

### Mobile (393 × 852)

| Landing | Login | Storefront |
|:---:|:---:|:---:|
| ![Mobile landing](tests/screenshots/mobile/01-landing.png) | ![Mobile login](tests/screenshots/mobile/02-login.png) | ![Mobile storefront](tests/screenshots/mobile/03-storefront.png) |

| Dashboard home | Insights (BI) | "More" drawer (categorized) |
|:---:|:---:|:---:|
| ![Mobile dashboard](tests/screenshots/mobile/10-dashboard-home.png) | ![Mobile insights](tests/screenshots/mobile/11-dashboard-insights.png) | ![Bottom-nav More drawer](tests/screenshots/mobile/12-dashboard-more-drawer.png) |

> Generated with `npm run screenshots` (Playwright multi-project: `desktop-public`, `desktop-auth`, `mobile` 393×852, `cinematic-wide` 1600×1000). Total run time: ~55s for 31 captures.

---



| Kemampuan | Status |
|---|---|
| Multi-tenant storefront publik (`/store/{slug}`) | ✅ |
| QRIS statis + dinamis (Midtrans, idempotent webhook) | ✅ |
| POS cashier mode (full-screen, walk-in customer) | ✅ |
| Business Intelligence — RFM, Holt forecast, cohort, market basket | ✅ |
| Loyalty points (1 pt / Rp 10.000) + leaderboard | ✅ |
| Multi-outlet (gated Business) + staff management | ✅ |
| Subscription tiers Basic/Pro/Business + 14-day trial | ✅ |
| WhatsApp broadcast + cron weekly report | ✅ |
| Two-canvas design system (cinematic + transactional) | ✅ |
| Robust Playwright screenshot workflow + storage-state auth | ✅ |
| Recurring billing real (Midtrans Recurring / Xendit) | ⚠️ Mock |
| Custom domain per tenant | ✅ GUI + DNS verify |
| Theme Builder per tenant | ✅ GUI + live preview |
| Template Builder (layout, button, icon, hero, carousel) | ✅ GUI + 4 layout templates |
| Outlet-level reporting (order ter-assign ke outlet) | ✅ |
| Daily digest otomatis (WhatsApp + Telegram) | ✅ Per-outlet, idempotent, cron hourly |
| Refund / partial fulfillment | ❌ |

---

## Fitur saat ini

### Storefront publik (untuk customer akhir)

- **Katalog produk** — filter kategori, foto, deskripsi, harga, stok.
- **Cart drawer** — update qty real-time, kode promo apply.
- **Checkout** — nama, HP, pickup/delivery + alamat, catatan.
- **QRIS payment** — statis (gambar yang di-upload tenant) atau dinamis (Midtrans, nominal exact, expiry 15 menit).
- **Order tracking** — `/store/{slug}/track` dengan order number + HP.
- **Loyalty visibility** — pelanggan bisa cek poin lewat `/api/store/{slug}/loyalty?phone=…`.
- **PWA-ready** — service worker, manifest, installable.
- **JSON-LD** — schema.org `Store` + `Product` per tenant untuk SEO.

### Operasi harian (Owner + Cashier)

- **Dashboard home** — KPI strip: total omzet, total order, pending bayar, produk aktif. Day-over-day delta dengan tren ▲/▼.
- **Pesanan** — list dengan status tab (Menunggu Bayar, Sudah Bayar, Diproses, Selesai, Dibatalkan), search by order# / nama / HP, pagination.
- **Order detail** — info pemesan, items, action FSM (konfirmasi bayar → diproses → selesai), print thermal receipt 280px.
- **POS cashier mode** — full-screen, grid produk searchable, cart persisten, walk-in customer default, langsung settle ke order PAID.
- **Onboarding banner** — 4-step checklist (profil, QRIS, produk, order pertama).

### Catalog management

- **Produk CRUD** — nama, deskripsi (AI-generated optional), harga, stok, kategori, gambar (URL), JSON variants.
- **Bulk stock update** — edit stok banyak produk dalam satu form.
- **Import CSV** — bulk upload produk dari file CSV.
- **Toggle active/inactive** — sembunyikan tanpa hapus.
- **Soft-delete with audit log**.
- **AI product description** — `/api/dashboard/ai/generate` (template-based; siap diganti OpenAI).

### Pertumbuhan / Insight

- **Insights (BI)** — lihat [Business Intelligence](#business-intelligence) di bawah.
- **Analytics** — omzet 14 hari, top 5 produk, rata-rata harian.
- **Pelanggan** — agregasi customer dari `orders` (nama, HP, total order, total spent, last order).
- **Loyalty** — leaderboard top 50 member, total poin beredar, total belanja member.
- **Promo** — kode persen/nominal, min order, max discount, expiry.
- **WhatsApp broadcast** — kirim pesan ke list pelanggan terpilih (gated Pro+).

### Organisasi / Platform config

- **Multi-outlet** — sampai 5 cabang per tenant (gated Business).
- **Staff** — tambah cashier dengan email/password (gated Business).
- **Billing** — 3 tier (Basic gratis / Pro Rp 99rb / Business Rp 299rb), trial 14 hari, mock activation/cancel.
- **Settings** — profil toko, alamat, telepon, logo, QRIS image, theme color (6 pilihan).
- **Image upload** — endpoint `/api/dashboard/upload` untuk product / logo / QRIS.

### Platform fundamentals

- **Multi-tenant isolation** — semua query Prisma scoped ke `tenantId` via session.
- **NextAuth v5 JWT** — credentials provider, role-based redirect.
- **Tenant onboarding** — `/register` + `/api/register` membuat Tenant + Owner + Subscription TRIAL atomik.
- **Audit log** — login, register, order create, status change, billing event.
- **Webhook idempotency** — `WebhookEvent` table dengan unique `(provider, eventId)` constraint.
- **Cron jobs** — expire trials, weekly report (`/api/cron/*`).
- **Health check** — `/api/health` dengan DB ping + latency.
- **Security headers** — CSP, X-Frame-Options, Permissions-Policy, no powered-by.
- **Rate limiting** — LRU in-memory, configurable per route.
- **Error handler middleware** — Zod 400, Prisma P2002 409, P2025 404.

---

## Business Intelligence

`/dashboard/insights` (gated Pro+) menjalankan 9 algoritma analitik standar internasional, semuanya dihitung dari schema yang sudah ada — **zero dependency tambahan**:

| Modul | Metode | Output |
|---|---|---|
| RFM Segmentation | Hughes 1996, quintile-based | 8 segmen: Champions, Loyal, Potential Loyalist, New Customers, Promising, Need Attention, At Risk, Hibernating |
| Customer Lifetime Value | AOV × frequency × lifespan, per-segment + top-10% | Rupiah CLV historis + projected |
| Cohort Retention | Monthly signup cohorts × M+0..M+5 | Matrix retensi % |
| Sales Forecast | Holt double exponential smoothing (α=0.4, β=0.2) | 7 hari forecast dengan continuity |
| Inventory Velocity | Sell-through per SKU (30 hari rolling) | Days-of-stock + status (REORDER_NOW / LOW / HEALTHY / DEAD_STOCK) |
| Churn Risk | P75 inter-purchase interval flagging | Score 0–100 per pelanggan |
| Market Basket | Co-occurrence support / confidence / lift | Top 10 product pairs |
| Hour × Weekday Heatmap | Order density Asia/Jakarta | 24×7 grid |
| Promo ROI | Attributed revenue / discount cost | ROI multiplier per kode |

Source code: [`src/lib/bi.ts`](src/lib/bi.ts). API endpoint: [`src/app/api/dashboard/insights/route.ts`](src/app/api/dashboard/insights/route.ts). UI: [`src/app/dashboard/insights/page.tsx`](src/app/dashboard/insights/page.tsx).

---

## Outlet reporting & daily digest automation

Toko dengan banyak cabang kecil dapat melihat performa **per-outlet** dan menerima ringkasan harian otomatis via WhatsApp dan/atau Telegram.

### Cara kerja

1. **Order ter-assign ke outlet** — `Order.outletId` (POS/storefront mengirim outlet aktif). Aggregasi revenue/order dihitung per cabang.
2. **Daily digest engine** ([`src/lib/daily-digest.ts`](src/lib/daily-digest.ts)) menyusun ringkasan window hari Asia/Jakarta: omzet + delta vs kemarin, order dibayar, pending bayar, pelanggan baru, produk terlaris, **breakdown per outlet**, dan **alert stok menipis** (threshold per tenant).
3. **Multi-channel fan-out** ([`src/lib/notifications.ts`](src/lib/notifications.ts)) — WhatsApp (Fonnte) + Telegram (Bot API), dikirim ke channel yang diaktifkan owner.
4. **Cron hourly** ([`/api/cron/daily-digest`](src/app/api/cron/daily-digest/route.ts)) — tiap jam, kirim ke tenant yang `dailyDigestHour`-nya cocok dengan jam Jakarta sekarang. Owner pilih jam kirim sendiri (mis. 21:00).
5. **Idempotent** — tabel `NotificationLog` dengan unique `(tenantId, dedupeKey, channel)` mencegah double-send dalam satu hari. Channel yang gagal akan di-retry, yang sukses di-skip.

### Konfigurasi (GUI)

`/dashboard/notifications` — toggle WhatsApp/Telegram, paste Telegram Chat ID, atur jam kirim & threshold stok, **test-send** + **preview laporan hari ini** sebelum live.

### Contoh isi laporan

```
📊 Laporan Harian — Kedai Kopi Nusantara
Jumat, 30 Mei 2026

💰 Omzet: Rp 2.450.000
   ▲ 18% vs kemarin
🧾 Order dibayar: 32
⏳ Menunggu bayar: 3
👤 Pelanggan baru: 5
🏆 Terlaris: Kopi Susu Aren (24x)

🏪 Per Outlet:
• Cabang Kemang: Rp 1.200.000 (15 order)
• Cabang Sudirman: Rp 980.000 (12 order)
• Tanpa outlet: 5 order

⚠️ Stok menipis:
• V60 Single Origin: 2 tersisa
• Croissant Butter: 4 tersisa
```

### Setup env (production)

```env
FONNTE_TOKEN=your-fonnte-token            # WhatsApp
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...      # Telegram bot
TELEGRAM_BOT_USERNAME=umkmstore_bot       # untuk instruksi di GUI
CRON_SECRET=random-string                 # protect cron endpoints
```

---

## Design system

Mengikuti spec dua-canvas di [`design.md`](design.md):

- **Cinematic track** — `canvas-night` (`#000000`) untuk landing hero, full-bleed, display-xxl 96px @ weight 330. Tracking +2.4px.
- **Transactional track** — `canvas-light` (`#fff`) / `canvas-cream` (`#fbfbf5`) untuk semua surface authenticated.
- **Pill-only buttons** — radius 9999px universal. Variants: `pill-primary`, `pill-aloe`, `pill-outline-light`, `pill-outline-dark`, `pill-ghost`.
- **Aloe `#c1fbd4` + Pistachio `#d4f9e0`** — featured tier accent + section band, light track only.
- **Typography** — Inter Variable single-family, ss03 stylistic set globally.
- **Glyph set** — non-mainstream Unicode (`⬢ ⬡ ⌬ ◉ ◈ ⊹ ✦ ⟡ ❖`) menggantikan emoji 🚀 📊 di UI chrome. Lihat [`src/lib/glyphs.ts`](src/lib/glyphs.ts).
- **Layout primitives** — `.page-shell`, `.page-header`, `.kpi-card`, `.kpi-grid`, `.list-card`, `.section-marketing`, `.split-2`, dll. Lihat [`src/app/globals.css`](src/app/globals.css).

Sidebar dikategorisasi ke 4 grup dengan eyebrow header + hairline spacer:
1. **Operasi** — Dashboard, Pesanan, POS
2. **Katalog** — Produk, Promo
3. **Pertumbuhan** — Insights (featured), Analytics, Pelanggan, Loyalty
4. **Organisasi** — Outlet, Staff, Billing, Pengaturan

---

## Tech stack

| Layer | Pilihan |
|---|---|
| Framework | Next.js 16 App Router (Turbopack), React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 (config-less, tokens di `globals.css`) |
| Fonts | Inter Variable via `next/font/google` (axes: opsz) |
| Icons | Phosphor Icons (primary), lucide-react (fallback) |
| Database | SQLite (dev) → LibSQL/Turso (prod) |
| ORM | Prisma 7 + `@prisma/adapter-libsql` |
| Auth | NextAuth v5 beta JWT, credentials provider |
| Validation | Zod 4 |
| Payment | Mock provider + Midtrans (production-ready abstraction) |
| Testing | Vitest (unit) + Playwright (e2e + screenshots) |
| PWA | service worker + web manifest |

---

## Quick start

```bash
# 1. Install
npm install

# 2. Setup env
cp .env.example .env   # atau tulis manual:
# DATABASE_URL=file:./dev.db
# NEXTAUTH_SECRET=dev-secret-key-please-change-32chars-minimum
# NEXTAUTH_URL=http://localhost:3000

# 3. Database
npx prisma migrate deploy
npx tsx prisma/seed-full.ts    # seed kaya: 49 order, 10 loyalty member, 12 produk

# 4. Dev server
npm run dev
```

Buka http://localhost:3000.

### Production build

```bash
npm run build
npm start
```

---

## Demo akun

Setelah `seed-full.ts`:

| Akun | Email | Password | Role |
|---|---|---|---|
| Owner | `owner@demo.com` | `password123` | OWNER |
| Cashier | `kasir@demo.com` | `password123` | CASHIER |

| Surface | URL |
|---|---|
| Dashboard | http://localhost:3000/dashboard |
| Insights (BI) | http://localhost:3000/dashboard/insights |
| POS | http://localhost:3000/dashboard/pos |
| Storefront | http://localhost:3000/store/demo |
| Order tracking | http://localhost:3000/store/demo/track |

Subscription seed: **PRO TRIAL** 14 hari → semua fitur Pro aktif (QRIS dinamis, WA broadcast, BI, export CSV).

---

## Struktur proyek

```
saasumkm/
├── prisma/
│   ├── schema.prisma           # 11 model (Tenant, User, Product, Order, Payment, …)
│   ├── seed.ts                 # Minimal seed (1 produk per kategori)
│   ├── seed-full.ts            # Rich seed (49 orders, 10 loyalty members)
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── page.tsx            # Landing (cinematic + transactional split)
│   │   ├── login, register/    # Auth screens
│   │   ├── store/[slug]/       # Public storefront + cart + checkout
│   │   ├── dashboard/
│   │   │   ├── page.tsx        # KPI home
│   │   │   ├── insights/       # 🆕 Business Intelligence
│   │   │   ├── analytics/      # 14-day revenue + top products
│   │   │   ├── orders/, products/, promos/
│   │   │   ├── customers/      # + WA broadcast form
│   │   │   ├── loyalty/        # Top members
│   │   │   ├── pos/            # Full-screen cashier mode
│   │   │   ├── outlets/, staff/  # Business-tier features
│   │   │   ├── billing/        # 3-tier subscription
│   │   │   └── settings/       # Tenant profile + QRIS upload
│   │   └── api/
│   │       ├── auth/[...nextauth]/
│   │       ├── register/       # Tenant onboarding
│   │       ├── store/[slug]/   # Public: order, payment, promo, track, loyalty
│   │       ├── dashboard/      # Protected: products, orders, promos, …
│   │       │   ├── insights/   # 🆕 BI bundle endpoint
│   │       │   ├── ai/generate # AI product description
│   │       │   ├── broadcast/  # WhatsApp blast
│   │       │   ├── export/orders/  # CSV download
│   │       │   └── upload/     # Image upload
│   │       ├── webhooks/payment/   # Midtrans/Xendit webhook
│   │       ├── cron/expire-trials, weekly-report/
│   │       └── health/
│   ├── components/
│   │   ├── DashboardNav.tsx    # 4-group categorized sidebar
│   │   ├── InsightChart.tsx    # 🆕 Forecast bars (actual + Holt prediction)
│   │   ├── HeatmapGrid.tsx     # 🆕 24×7 order density
│   │   ├── RevenueChart.tsx    # Daily revenue SVG bars
│   │   ├── OnboardingBanner.tsx
│   │   └── icons/
│   ├── lib/
│   │   ├── bi.ts               # 🆕 Business Intelligence engine
│   │   ├── glyphs.ts           # 🆕 Brand Unicode marker set
│   │   ├── prisma.ts, auth.ts, env.ts
│   │   ├── features.ts         # Plan gating (BASIC / PRO / BUSINESS)
│   │   ├── api-handler.ts      # Centralized error handler
│   │   ├── theme.ts            # Storefront theme colors
│   │   └── …                   # whatsapp.ts, logger.ts, ai.ts, payment/
│   └── middleware.ts
├── tests/
│   ├── e2e/                    # Playwright specs (4 projects)
│   │   ├── global-setup.ts     # Reset DB + capture storage state
│   │   ├── helpers.ts          # snap(), safeGoto(), settled()
│   │   ├── public-pages.spec.ts
│   │   ├── screenshots.spec.ts # Authenticated dashboard captures
│   │   ├── mobile.spec.ts
│   │   └── cinematic.spec.ts
│   └── screenshots/            # PNG output by viewport
├── design.md                   # Two-canvas design spec (Shopifi-style)
├── playwright.config.ts        # Multi-project, multi-viewport, auth fixture
└── package.json
```

---

## API surface

### Public

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/register` | Daftar tenant baru → buat Tenant + Owner + Subscription TRIAL |
| `POST` | `/api/store/[slug]/order` | Buat order dari storefront |
| `POST` | `/api/store/[slug]/payment` | Generate QRIS dinamis (Pro+) |
| `GET` | `/api/store/[slug]/promo?code=&subtotal=` | Validasi kode promo |
| `GET` | `/api/store/[slug]/track?orderNumber=&phone=` | Lacak order |
| `GET` | `/api/store/[slug]/loyalty?phone=` | Cek poin pelanggan |
| `POST` | `/api/webhooks/payment` | Webhook Midtrans/Xendit (idempotent via signature) |
| `GET` | `/api/health` | Liveness + DB ping |

### Protected (NextAuth session required)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET/POST/PUT/DELETE` | `/api/dashboard/products[/...]` | Produk CRUD + bulk-stock + import CSV + toggle |
| `GET` | `/api/dashboard/orders/[id]/status` | Update status FSM |
| `GET/POST/PUT/DELETE` | `/api/dashboard/promos[/...]` | Promo CRUD |
| `GET/POST` | `/api/dashboard/categories` | Kategori CRUD |
| `GET` | `/api/dashboard/customers` | Customer aggregation |
| `POST` | `/api/dashboard/broadcast` | WhatsApp blast (Pro+) |
| `GET` | `/api/dashboard/loyalty` | Leaderboard |
| `GET` | `/api/dashboard/analytics` | Default 14-day stats |
| `GET` | `/api/dashboard/analytics/summary` | Weekly/monthly digest |
| `GET` | `/api/dashboard/analytics/advanced` | Repeat customers, AOV, retention rate (Pro+) |
| `GET` | `/api/dashboard/insights` | 🆕 Full BI bundle (Pro+) |
| `GET` | `/api/dashboard/export/orders` | CSV download (Pro+) |
| `POST` | `/api/dashboard/upload` | Image upload |
| `GET/POST/PATCH` | `/api/dashboard/staff[/...]` | Cashier mgmt (Business) |
| `GET/POST/PATCH` | `/api/dashboard/outlets` | Outlet mgmt (Business) |
| `GET/PUT` | `/api/dashboard/settings` | Tenant profile |
| `GET/POST` | `/api/dashboard/billing` | Plan activation (mock) |
| `POST` | `/api/dashboard/ai/generate` | AI product description |

### Cron (server-side, secured by `CRON_SECRET`)

| Endpoint | Deskripsi |
|---|---|
| `/api/cron/expire-trials` | Auto-downgrade trial yang sudah lewat |
| `/api/cron/weekly-report` | Kirim WA/email ringkasan mingguan ke owner |

---

## Roles & permissions

| Role | Akses |
|---|---|
| `OWNER` | Full dashboard + settings + billing + staff/outlet mgmt |
| `CASHIER` | Dashboard home, Orders, POS only |
| `CUSTOMER` | Storefront publik (anonymous) |

---

## Testing & screenshots

```bash
# Unit tests (Vitest)
npm test                       # 20 test cases, ~450ms
npm run test:coverage

# E2E + screenshots (Playwright)
npx playwright install --with-deps   # one-time setup
npm run screenshots                  # captures all 4 viewport projects
npm run test:e2e:report              # opens HTML report
```

Screenshot output → `tests/screenshots/<viewport>/<index>-<slug>.png`. 4 projects:
- `desktop-public` (1440×900, no auth)
- `desktop-auth` (1440×900, OWNER session)
- `mobile` (iPhone 14 Pro, OWNER session)
- `cinematic-wide` (1600×1000, hero captures)

Auth fixture: global-setup logs in as `owner@demo.com` via real browser flow, exports `storageState.json`, dashboard tests reuse it (no per-test login).

---

## Roadmap

### Phase 1 — MVP ✅
- [x] Multi-tenant onboarding + auth
- [x] Storefront publik + cart + checkout
- [x] QRIS statis + manual confirm
- [x] Dashboard order/produk/promo

### Phase 2 — Stabilize ✅
- [x] Analytics 14-day chart + top products
- [x] CSV export (Pro)
- [x] WhatsApp broadcast (Pro)
- [x] Audit log
- [x] Health check + structured logging
- [x] Bulk stock + CSV import
- [x] Two-canvas design system

### Phase 3 — Payment Maturity ✅
- [x] QRIS dinamis (Midtrans abstraction)
- [x] Idempotent webhook handler
- [x] Payment provider abstraction (mock + midtrans)
- [ ] Production gateway flip + reconciliation report

### Phase 4 — Monetization ✅
- [x] Plan tiers + feature gating
- [x] Trial 14 hari + auto-expire cron
- [x] Mock activation/cancel UI
- [ ] **Real recurring billing (Midtrans Recurring / Xendit Subscription)** ⚠️
- [ ] Invoice email + PDF
- [ ] Pro-rata + downgrade flow

### Phase 5 — Differentiation ✅
- [x] Loyalty points + leaderboard
- [x] POS cashier mode
- [x] Multi-outlet (gated Business)
- [x] Staff management (gated Business)
- [x] AI product description (template, OpenAI-ready)
- [x] **Business Intelligence module** (RFM, Holt, cohort, market basket)

### Phase 6 — Scale (next quarter)
- [ ] Real Midtrans Recurring integration
- [ ] Custom domain per tenant
- [ ] Refund + partial fulfillment FSM
- [ ] Image CDN pipeline (Cloudinary/R2 with auto-resize)
- [ ] Email transactional (Resend)
- [ ] Public REST API + API key auth
- [ ] Native mobile app (React Native)

---

## Gap fitur SaaS (yang masih kurang)

Untuk dianggap **production-grade SaaS** kelas international, masih ada gap berikut. Daftar ini disusun by priority untuk merchant Indonesia.

### 🔥 Tier 1 — blocker production launch

| Gap | Kenapa penting | Estimasi effort |
|---|---|---|
| **Recurring billing real** (Midtrans Recurring / Xendit Subscription) | Saat ini billing 100% mock — tidak ada cara monetize | 2 minggu |
| **Refund + partial cancellation FSM** | Order CANCELLED tidak handle refund payment yang sudah masuk; partial fulfillment tidak ada | 1 minggu |
| **Email transactional** (order confirmation, receipt, password reset, invoice) | Saat ini hanya WA notif | 3 hari |
| **Forgot password flow** | NextAuth credentials provider tidak punya reset email | 2 hari |
| **Email verification on signup** | Mencegah typo email + spam tenant | 1 hari |
| **Custom domain / subdomain per tenant** (`toko-budi.umkmstore.id`) | Storefront sekarang hanya `/store/{slug}` — tidak bisa pakai branding domain sendiri | 1 minggu |
| **PDF invoice generator** untuk subscription | Standar billing minimum, juga untuk faktur pajak | 3 hari |
| **Cookie consent + privacy policy + TOS pages** | Wajib untuk operate di EU/UU PDP Indonesia | 2 hari |
| **Tax invoicing (PPN / Faktur Pajak)** | Wajib untuk merchant yang sudah PKP | 1 minggu |
| **Sentry / error tracking integration** | DSN sudah dikonfigurasi tapi belum dipasang `instrumentation.ts` | 1 hari |

### 🟡 Tier 2 — competitive parity

| Gap | Kenapa penting | Estimasi effort |
|---|---|---|
| **Image CDN + auto-resize** (Cloudinary / R2) | Saat ini hanya simpan URL string, image upload ke local — bermasalah di production | 4 hari |
| **Storefront search bar** (full-text di nama produk) | Customer experience standar | 1 hari |
| **Product detail page** (`/store/{slug}/product/{id}`) | Saat ini cuma grid card, tidak ada SEO landing per produk | 3 hari |
| **Customer reviews & ratings** | Social proof mendorong konversi | 1 minggu |
| **Abandoned cart recovery** (WA reminder) | Recovery 10-30% revenue yang hilang | 4 hari |
| **Wishlist** + **recently viewed** | Engagement metric | 3 hari |
| **Push notification** (PWA + FCM) | Real-time order alert ke owner | 4 hari |
| **2FA/MFA** untuk OWNER role | Security standar fintech-adjacent | 3 hari |
| **Session management** (revoke other devices) | Security UX standar | 1 hari |
| **Audit log viewer UI** | Data sudah masuk DB, belum ada halaman lihatnya | 1 hari |
| **Cost of goods (COGS) field** + gross margin di analytics | Margin bisnis tidak terukur tanpa ini | 2 hari |
| **Supplier + purchase order** | UMKM butuh track restock | 1 minggu |
| **Inventory transfer antar outlet** | Multi-outlet incomplete tanpa ini | 4 hari |
| **Cycle count / stock adjustment dengan reason** | Audit-trail inventory | 3 hari |
| **Barcode SKU per product variant** | POS profesional standar | 3 hari |
| **Bluetooth thermal printer integration** (POS) | Web Bluetooth API; replaces window.print | 1 minggu |

### 🟢 Tier 3 — differentiation & scale

| Gap | Kenapa penting | Estimasi effort |
|---|---|---|
| **Native mobile app** (React Native / Flutter) | UMKM operator hampir 100% mobile | 2 bulan |
| **POS offline mode** (IndexedDB queue + sync) | Toko fisik sering kehilangan koneksi | 2 minggu |
| **Funnel analytics** (storefront-view → cart → checkout → paid) | Butuh event tracking layer baru (`Event` table) | 1 minggu |
| **Geographic order heatmap** | Butuh lat/lng pada order; integration Google Maps Geocoding | 1 minggu |
| **UTM tracking + traffic-source revenue attribution** | Marketer needs untuk measure ROI campaign | 4 hari |
| **Email marketing campaigns** (drag-drop builder + scheduled send) | Bukan hanya WA blast | 2 minggu |
| **Referral program** (unique link + reward credit) | Growth loop | 1 minggu |
| **Affiliate program** (commission tracking) | Reseller use-case | 2 minggu |
| **Public REST API + API key + rate limit per key** | Merchant bisa integrate ke ERP/Accurate/Jurnal | 2 minggu |
| **Outbound webhook** (let merchant subscribe to `order.paid`, `customer.created`) | Standar untuk integrasi pihak ketiga | 4 hari |
| **Zapier / Make.com integration** | Reach non-developer merchants | 1 minggu |
| **OpenAPI spec + Postman collection** | Dev experience untuk API public | 3 hari |
| **GDPR / UU PDP data export + right to delete** | Compliance Indonesia (UU PDP berlaku 2024) | 1 minggu |
| **Custom theme builder** (warna, font, layout) — bukan hanya 6 preset | Brand differentiation | 2 minggu |
| **Multi-language storefront** (id / en) | Tenant yang export ke turis | 1 minggu |
| **Multi-currency** | Phase ekspor | 4 hari |
| **Real OpenAI integration** untuk AI module (currently template) | Better product descriptions + caption + chat assistant | 3 hari |
| **AI-powered demand forecasting** (LSTM via TensorFlow.js atau external API) | Lebih akurat dari Holt linear | 2 minggu |
| **Real-time live order ticker** (SSE / WebSocket) | "12 orang sedang lihat produk ini" | 4 hari |
| **Anomaly detection** (alert kalau revenue drop > 30% dari baseline) | Ops alerting | 4 hari |
| **Data export ke BI tools** (PowerBI, Tableau, Metabase) | Enterprise ask | 1 minggu |
| **Scheduled email reports** (daily/weekly digest) | Saat ini cron weekly-report ada tapi hanya WA | 2 hari |

### 🔵 Tier 4 — platform / DevOps maturity

| Gap | Kenapa penting | Estimasi effort |
|---|---|---|
| **Job queue** (BullMQ + Redis / Inngest) | Saat ini WA blast + image processing sync di request thread | 4 hari |
| **Background workers** (terpisah dari web tier) | Scaling | 1 minggu |
| **Database backup automation** (Turso point-in-time) | Disaster recovery | 2 hari |
| **Status page** publik | Trust signal | 2 hari |
| **SLO + uptime monitoring** (Better Stack / Pingdom) | Operations hygiene | 1 hari |
| **Database read replicas** (Turso embedded replicas) | Scale read traffic | 3 hari |
| **CDN edge caching** untuk storefront publik (ISR + revalidateTag) | Performance | 2 hari |
| **Lighthouse CI** untuk Core Web Vitals | Performance budget | 2 hari |
| **Visual regression testing** (Playwright snapshots dengan baseline) | Mencegah unintended UI regression | 3 hari |
| **Load testing** (k6 / Artillery) untuk endpoint kritikal | Capacity planning | 3 hari |
| **Feature flags** (LaunchDarkly / GrowthBook) | Safer rollout | 4 hari |
| **A/B testing infrastructure** | Measure UX changes | 1 minggu |

### Total estimasi roadmap

| Tier | Total effort |
|---|---|
| Tier 1 (production blocker) | ~4–5 minggu |
| Tier 2 (competitive parity) | ~8–10 minggu |
| Tier 3 (differentiation) | ~4–6 bulan |
| Tier 4 (DevOps maturity) | ~5–6 minggu |

---

## Deployment

### Recommended stack — Vercel + Turso

```bash
# 1. Buat database production di Turso
turso db create umkmstore-prod
turso db tokens create umkmstore-prod

# 2. Set environment variables di Vercel
DATABASE_URL=libsql://umkmstore-prod.turso.io?authToken=eyJ…
NEXTAUTH_SECRET=<generate-with: openssl rand -base64 32>
NEXTAUTH_URL=https://your-domain.com
PAYMENT_PROVIDER=midtrans
MIDTRANS_SERVER_KEY=Mid-server-…
MIDTRANS_CLIENT_KEY=Mid-client-…
MIDTRANS_IS_PRODUCTION=true
SENTRY_DSN=https://…@…sentry.io/…
CRON_SECRET=<random-string>

# 3. Apply migrations to production
DATABASE_URL=… npx prisma migrate deploy

# 4. Deploy
vercel --prod
```

### Cron schedule (vercel.json sudah dikonfigurasi)

| Job | Schedule | Endpoint |
|---|---|---|
| Expire trials | Daily 00:05 WIB | `/api/cron/expire-trials` |
| Weekly report | Senin 08:00 WIB | `/api/cron/weekly-report` |

---

## Lisensi

MIT — bebas digunakan untuk proyek komersial maupun open source.

---

## Dokumentasi tambahan

| File | Isi |
|---|---|
| [`design.md`](design.md) | Design system dua-canvas (Shopifi-grade spec) |
| [`DEVELOPMENT.md`](DEVELOPMENT.md) | Panduan development lanjutan + best practices |
| [`docs/blueprint.md`](docs/blueprint.md) | Arsitektur sistem & modul |
| [`docs/prisma-schema.md`](docs/prisma-schema.md) | Detail schema Prisma |
| [`docs/ui-flow.md`](docs/ui-flow.md) | Alur UI customer & owner |
| [`docs/pricing.md`](docs/pricing.md) | Paket harga & fitur matrix |
| [`docs/production.md`](docs/production.md) | Production checklist & runbook |
| [`imp.md`](imp.md) | Roadmap implementasi |

---

<div align="center">
<p><strong>UMKMStore</strong> · Toko digital + Business Intelligence untuk UMKM Indonesia</p>
<p>Jakarta · 2026</p>
</div>
