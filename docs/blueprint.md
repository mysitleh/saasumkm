# Blueprint Arsitektur UMKMStore

## Stack
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: SQLite (dev) / LibSQL/Turso (prod)
- **ORM**: Prisma 7 + @prisma/adapter-libsql
- **Auth**: NextAuth v5 (JWT strategy)
- **Deployment**: Vercel (recommended)

## Struktur Modul
```
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx          # Landing page
│   │   ├── login/            # Login
│   │   └── register/         # Register + buat toko
│   ├── store/[slug]/         # Storefront publik
│   │   ├── page.tsx          # Katalog produk
│   │   └── StorefrontClient  # Cart + checkout + QRIS
│   ├── dashboard/            # Owner/kasir dashboard
│   │   ├── page.tsx          # Overview + stats
│   │   ├── orders/           # Manajemen pesanan
│   │   ├── products/         # CRUD produk
│   │   ├── promos/           # Kode promo
│   │   └── settings/         # Profil toko + QRIS
│   └── api/
│       ├── auth/             # NextAuth handler
│       ├── register/         # Registrasi UMKM
│       ├── store/[slug]/     # Public store API
│       └── dashboard/        # Protected dashboard API
├── lib/
│   ├── prisma.ts             # Prisma client singleton
│   ├── auth.ts               # NextAuth config
│   └── utils.ts              # Helpers
└── components/
    └── DashboardNav.tsx      # Navigasi dashboard
```

## Multi-Tenancy
- Setiap UMKM = 1 Tenant dengan slug unik
- Semua data (produk, order, promo) terisolasi per tenantId
- Middleware memastikan akses dashboard hanya untuk OWNER/CASHIER tenant tersebut

## Alur Pembayaran (Phase 1 - QRIS Statis)
1. Customer checkout → order dibuat dengan status WAITING_PAYMENT
2. Customer scan QRIS statis toko → bayar manual
3. Kasir/owner konfirmasi → status → PAID_MANUAL → PROCESSING → COMPLETED

## Roles
- **OWNER**: Full access dashboard, settings, produk, order, promo
- **CASHIER**: Akses order management (konfirmasi bayar, update status)
- **CUSTOMER**: Akses storefront publik saja
