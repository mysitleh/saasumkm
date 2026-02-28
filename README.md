# 🛒 UMKMStore — Platform Toko Digital SaaS untuk UMKM Indonesia

> Platform SaaS multi-tenant yang membantu UMKM membuat toko digital, menerima order, dan pembayaran QRIS — semua dari HP.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwind-css)](https://tailwindcss.com)

---

## 📋 Daftar Isi

- [Fitur](#-fitur)
- [Tech Stack](#-tech-stack)
- [Struktur Proyek](#-struktur-proyek)
- [Cara Instalasi](#-cara-instalasi)
- [Environment Variables](#-environment-variables)
- [Database & Seed](#-database--seed)
- [Demo](#-demo)
- [API Routes](#-api-routes)
- [Alur Pembayaran QRIS](#-alur-pembayaran-qris)
- [Roles & Permissions](#-roles--permissions)
- [Roadmap](#-roadmap)
- [Deployment](#-deployment)

---

## ✨ Fitur

### Untuk Customer (Storefront Publik)
- 🛍️ Katalog produk dengan filter kategori
- 🛒 Keranjang belanja (cart) dengan update qty real-time
- 💳 Checkout: nama, HP, pickup/delivery, catatan
- 🏷️ Kode promo (persen/nominal, min. order, max. diskon)
- 📱 Tampilan QRIS statis + instruksi bayar
- ✅ Konfirmasi pesanan dengan nomor order

### Untuk Owner/Kasir (Dashboard)
- 📊 Dashboard: omzet, total order, pending, produk aktif
- 📦 Manajemen pesanan: konfirmasi bayar, update status
- 🏪 CRUD produk + kategori + toggle aktif/nonaktif
- 🎫 Kode promo management
- ⚙️ Pengaturan toko: profil, logo, QRIS image URL
- 🔍 Audit log (login, create order, update status)

### Platform
- 🏢 Multi-tenant (banyak UMKM dalam 1 platform)
- 🔐 Auth dengan JWT (NextAuth v5)
- 📱 Mobile-first UI (PWA-ready)
- 🛡️ Tenant isolation di semua data

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Database | SQLite (dev) / LibSQL/Turso (prod) |
| ORM | Prisma 7 + @prisma/adapter-libsql |
| Auth | NextAuth v5 (JWT strategy) |
| Validation | Zod |
| Icons | lucide-react |
| Deployment | Vercel (recommended) |

---

## 📁 Struktur Proyek

```
saasumkm/
├── docs/                          # Dokumentasi
│   ├── blueprint.md               # Arsitektur & modul
│   ├── prisma-schema.md           # Schema database
│   ├── ui-flow.md                 # Alur UI
│   └── pricing.md                 # Paket harga
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── seed.ts                    # Demo data
│   └── migrations/                # Migration files
├── src/
│   ├── app/
│   │   ├── page.tsx               # Landing page
│   │   ├── login/                 # Halaman login
│   │   ├── register/              # Halaman register + buat toko
│   │   ├── store/[slug]/          # Storefront publik
│   │   │   ├── page.tsx           # Katalog produk
│   │   │   └── StorefrontClient   # Cart + checkout + QRIS (client)
│   │   ├── dashboard/             # Owner/kasir dashboard
│   │   │   ├── page.tsx           # Overview + stats
│   │   │   ├── orders/            # Manajemen pesanan
│   │   │   ├── products/          # CRUD produk
│   │   │   ├── promos/            # Kode promo
│   │   │   └── settings/          # Profil toko + QRIS
│   │   └── api/
│   │       ├── auth/              # NextAuth handler
│   │       ├── register/          # Registrasi UMKM
│   │       ├── store/[slug]/      # Public store API (order, promo)
│   │       └── dashboard/         # Protected dashboard API
│   ├── components/
│   │   └── DashboardNav.tsx       # Navigasi dashboard (mobile + desktop)
│   ├── lib/
│   │   ├── prisma.ts              # Prisma client singleton
│   │   ├── auth.ts                # NextAuth config
│   │   └── utils.ts               # Helpers (formatRupiah, generateOrderNumber, dll)
│   ├── middleware.ts               # Auth + tenant middleware
│   └── types/
│       └── next-auth.d.ts         # NextAuth type extensions
├── .env                           # Environment variables (tidak di-commit)
├── prisma.config.ts               # Prisma 7 config
└── package.json
```

---

## 🚀 Cara Instalasi

### Prerequisites
- Node.js 20+
- npm / yarn / pnpm

### 1. Clone Repository

```bash
git clone https://github.com/mysitleh/saasumkm.git
cd saasumkm
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Buat file `.env` di root proyek:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Setup Database

```bash
# Jalankan migrasi database
DATABASE_URL="file:./dev.db" npx prisma migrate dev

# Generate Prisma client
DATABASE_URL="file:./dev.db" npx prisma generate
```

### 5. Seed Demo Data

```bash
DATABASE_URL="file:./dev.db" npx tsx prisma/seed.ts
```

### 6. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## 🔧 Environment Variables

| Variable | Deskripsi | Contoh |
|----------|-----------|--------|
| `DATABASE_URL` | URL database SQLite/LibSQL | `file:./dev.db` |
| `NEXTAUTH_SECRET` | Secret key untuk JWT | `random-string-32-chars` |
| `NEXTAUTH_URL` | URL aplikasi | `http://localhost:3000` |

### Untuk Production (Turso/LibSQL)

```env
DATABASE_URL="libsql://your-db.turso.io?authToken=your-token"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-domain.com"
```

---

## 🗄️ Database & Seed

### Schema Models

| Model | Deskripsi |
|-------|-----------|
| `Tenant` | UMKM store (name, slug, qrisImageUrl, dll) |
| `User` | Owner/kasir/customer dengan role |
| `Category` | Kategori produk per tenant |
| `Product` | Produk dengan harga, stok, foto |
| `Promo` | Kode diskon (persen/nominal) |
| `Order` | Pesanan dengan status tracking |
| `OrderItem` | Item dalam pesanan (snapshot harga) |
| `AuditLog` | Log aktivitas (login, order, dll) |

### Scripts Database

```bash
# Migrasi baru
DATABASE_URL="file:./dev.db" npx prisma migrate dev --name nama-migrasi

# Lihat database di browser
DATABASE_URL="file:./dev.db" npx prisma studio

# Seed ulang
DATABASE_URL="file:./dev.db" npx tsx prisma/seed.ts
```

---

## 🎯 Demo

Setelah seed, gunakan akun demo berikut:

| Field | Value |
|-------|-------|
| **Email** | `owner@demo.com` |
| **Password** | `password123` |
| **Dashboard** | [/dashboard](http://localhost:3000/dashboard) |
| **Storefront** | [/store/demo](http://localhost:3000/store/demo) |

### Demo Produk
- Kopi Susu Gula Aren — Rp 25.000
- Americano — Rp 20.000
- Cappuccino — Rp 28.000
- Matcha Latte — Rp 30.000
- Croissant — Rp 18.000
- Sandwich Tuna — Rp 22.000

### Demo Promo
- Kode: `HEMAT10`
- Diskon 10%, min. order Rp 50.000, maks. diskon Rp 15.000

---

## 🔌 API Routes

### Public (Storefront)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/register` | Registrasi UMKM baru |
| `POST` | `/api/store/[slug]/order` | Buat pesanan baru |
| `GET` | `/api/store/[slug]/promo?code=&subtotal=` | Validasi kode promo |

### Protected (Dashboard — requires auth)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/dashboard/products` | Tambah produk |
| `PUT` | `/api/dashboard/products/[id]` | Edit produk |
| `PATCH` | `/api/dashboard/products/[id]/toggle` | Toggle aktif/nonaktif |
| `PATCH` | `/api/dashboard/orders/[id]/status` | Update status pesanan |
| `POST` | `/api/dashboard/categories` | Tambah kategori |
| `POST` | `/api/dashboard/promos` | Buat kode promo |
| `PUT` | `/api/dashboard/settings` | Update pengaturan toko |

### Auth (NextAuth)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth handler |

---

## 💳 Alur Pembayaran QRIS

### Phase 1 — QRIS Statis (Saat Ini)

```
Customer checkout
    ↓
Order dibuat → status: WAITING_PAYMENT
    ↓
Customer scan QRIS statis toko
    ↓
Customer bayar manual via e-wallet/m-banking
    ↓
Kasir/owner konfirmasi di dashboard
    ↓
Status: PAID_MANUAL → PROCESSING → COMPLETED
```

### Status Order

| Status | Label | Deskripsi |
|--------|-------|-----------|
| `WAITING_PAYMENT` | Menunggu Pembayaran | Order baru, belum dibayar |
| `PAID_MANUAL` | Sudah Dibayar | Kasir konfirmasi bayar |
| `PROCESSING` | Diproses | Sedang disiapkan |
| `COMPLETED` | Selesai | Order selesai |
| `CANCELLED` | Dibatalkan | Order dibatalkan |

### Phase 3 — QRIS Dinamis (Roadmap)
- Integrasi payment gateway (Midtrans/Xendit)
- Generate QRIS per transaksi (nominal tepat)
- Webhook auto-update status
- Rekonsiliasi otomatis

---

## 👥 Roles & Permissions

| Role | Akses |
|------|-------|
| `OWNER` | Full dashboard: produk, order, promo, settings |
| `CASHIER` | Order management: konfirmasi bayar, update status |
| `CUSTOMER` | Storefront publik saja |

### Cara Tambah Kasir
1. Login sebagai OWNER
2. Buat user baru dengan role `CASHIER` (via database/admin panel — coming soon)

---

## 🗺️ Roadmap

Lihat [`imp.md`](imp.md) untuk roadmap lengkap.

### Phase 1 — MVP ✅ (Selesai)
- [x] Multi-tenant setup
- [x] Auth (owner/kasir/customer)
- [x] CRUD produk + kategori
- [x] Storefront customer
- [x] Cart + checkout
- [x] QRIS statis + konfirmasi manual
- [x] Dashboard penjualan dasar

### Phase 2 — Stabilize (Next)
- [ ] Dashboard harian/mingguan/bulanan
- [ ] Export CSV transaksi
- [ ] Notifikasi WhatsApp/email
- [ ] Manajemen staff (kasir)
- [ ] Error tracking + monitoring

### Phase 3 — QRIS Dinamis
- [ ] Integrasi payment gateway
- [ ] Webhook auto-konfirmasi
- [ ] Rekonsiliasi transaksi

### Phase 4 — Monetization
- [ ] Paket Basic/Pro/Business
- [ ] Feature gating
- [ ] Trial 14 hari
- [ ] Billing portal

### Phase 5 — Scale
- [ ] Loyalty & voucher
- [ ] CRM pelanggan
- [ ] WhatsApp automation
- [ ] AI tools (deskripsi produk, caption promo)
- [ ] POS mode

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push ke GitHub
2. Import repo di [vercel.com](https://vercel.com)
3. Set environment variables:
   ```
   DATABASE_URL=libsql://your-db.turso.io?authToken=your-token
   NEXTAUTH_SECRET=your-production-secret
   NEXTAUTH_URL=https://your-domain.vercel.app
   ```
4. Deploy!

### Database Production (Turso)

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Buat database
turso db create saasumkm

# Dapatkan URL & token
turso db show saasumkm
turso db tokens create saasumkm
```

### Jalankan Migrasi di Production

```bash
DATABASE_URL="libsql://your-db.turso.io?authToken=your-token" npx prisma migrate deploy
```

---

## 📚 Dokumentasi Tambahan

| Dokumen | Deskripsi |
|---------|-----------|
| [`DEVELOPMENT.md`](DEVELOPMENT.md) | **🔧 Panduan pengembangan lanjutan (robust)** |
| [`docs/blueprint.md`](docs/blueprint.md) | Arsitektur sistem & modul |
| [`docs/prisma-schema.md`](docs/prisma-schema.md) | Detail schema database |
| [`docs/ui-flow.md`](docs/ui-flow.md) | Alur UI customer & owner |
| [`docs/pricing.md`](docs/pricing.md) | Paket harga & fitur |
| [`imp.md`](imp.md) | Roadmap lengkap produk |

---

## 🤝 Kontribusi

1. Fork repository
2. Buat branch fitur: `git checkout -b feat/nama-fitur`
3. Commit: `git commit -m "feat: deskripsi fitur"`
4. Push: `git push origin feat/nama-fitur`
5. Buat Pull Request

---

## 📄 Lisensi

MIT License — bebas digunakan untuk proyek komersial maupun open source.

---

<div align="center">
  <p>Dibuat dengan ❤️ untuk UMKM Indonesia</p>
  <p><strong>UMKMStore</strong> — Jualan Digital, Mudah & Cepat</p>
</div>
