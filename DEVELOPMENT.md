# 🔧 Panduan Pengembangan Lanjutan — UMKMStore

> Catatan teknis untuk pengembangan robust dari MVP ke production-grade SaaS.

---

## 📋 Daftar Isi

1. [Phase 2 — Stabilize & Grow](#phase-2--stabilize--grow)
2. [Phase 3 — QRIS Dinamis & Webhook](#phase-3--qris-dinamis--webhook)
3. [Phase 4 — Monetization Engine](#phase-4--monetization-engine)
4. [Phase 5 — Scale & Differentiation](#phase-5--scale--differentiation)
5. [Arsitektur Robust](#arsitektur-robust)
6. [Security Hardening](#security-hardening)
7. [Performance Optimization](#performance-optimization)
8. [Testing Strategy](#testing-strategy)
9. [Monitoring & Observability](#monitoring--observability)
10. [Database Migration Strategy](#database-migration-strategy)
11. [CI/CD Pipeline](#cicd-pipeline)
12. [Checklist Production Readiness](#checklist-production-readiness)

---

## Phase 2 — Stabilize & Grow

### 2.1 Dashboard Analytics Lanjutan

**Implementasi:**
```typescript
// src/app/api/dashboard/analytics/route.ts
// Endpoint untuk data chart harian/mingguan/bulanan

// Query omzet per hari (7 hari terakhir)
const dailyRevenue = await prisma.order.groupBy({
  by: ['createdAt'],
  where: {
    tenantId,
    status: { in: ['PAID_MANUAL', 'PROCESSING', 'COMPLETED'] },
    createdAt: { gte: subDays(new Date(), 7) }
  },
  _sum: { total: true },
  _count: true,
});

// Produk terlaris
const topProducts = await prisma.orderItem.groupBy({
  by: ['productId', 'name'],
  where: { order: { tenantId, status: 'COMPLETED' } },
  _sum: { quantity: true, subtotal: true },
  orderBy: { _sum: { quantity: 'desc' } },
  take: 10,
});
```

**Library yang dibutuhkan:**
```bash
npm install recharts date-fns
```

**Komponen chart:**
```typescript
// src/components/RevenueChart.tsx
"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
```

---

### 2.2 Export CSV Transaksi

```typescript
// src/app/api/dashboard/export/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user.tenantId) return new Response('Unauthorized', { status: 401 });

  const orders = await prisma.order.findMany({
    where: { tenantId: session.user.tenantId },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  const csv = [
    'No Order,Tanggal,Customer,Total,Status,Tipe Pengiriman',
    ...orders.map(o => [
      o.orderNumber,
      o.createdAt.toISOString(),
      o.customerName,
      o.total,
      o.status,
      o.deliveryType,
    ].join(','))
  ].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="orders-${Date.now()}.csv"`,
    },
  });
}
```

---

### 2.3 Notifikasi WhatsApp (via Fonnte/WA Business API)

```typescript
// src/lib/whatsapp.ts
export async function sendWhatsAppNotification(
  phone: string,
  message: string
): Promise<void> {
  if (!process.env.FONNTE_TOKEN) return;
  
  await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: {
      'Authorization': process.env.FONNTE_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      target: phone,
      message,
      countryCode: '62',
    }),
  });
}

// Kirim notifikasi saat order masuk
export async function notifyNewOrder(order: Order, tenant: Tenant) {
  if (!tenant.phone) return;
  
  const message = `🛒 *Order Baru!*\n\nNo: ${order.orderNumber}\nCustomer: ${order.customerName}\nTotal: ${formatRupiah(order.total)}\n\nCek dashboard: ${process.env.NEXTAUTH_URL}/dashboard/orders/${order.id}`;
  
  await sendWhatsAppNotification(tenant.phone, message);
}
```

**Environment variables:**
```env
FONNTE_TOKEN=your-fonnte-token
```

---

### 2.4 Rate Limiting

```typescript
// src/lib/rate-limit.ts
import { LRUCache } from 'lru-cache';

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export function rateLimit(options?: Options) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;
        
        if (isRateLimited) {
          reject(new Error('Rate limit exceeded'));
        } else {
          resolve();
        }
      }),
  };
}

// Penggunaan di API route
const limiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  
  try {
    await limiter.check(10, ip); // 10 requests per minute
  } catch {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  // ...
}
```

```bash
npm install lru-cache
```

---

### 2.5 Image Upload (Cloudinary/R2)

```typescript
// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File;
  
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: `saasumkm/${session.user.tenantId}`, resource_type: 'image' },
      (error, result) => error ? reject(error) : resolve(result)
    ).end(buffer);
  });

  return NextResponse.json({ url: (result as any).secure_url });
}
```

```bash
npm install cloudinary
```

**Environment variables:**
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## Phase 3 — QRIS Dinamis & Webhook

### 3.1 Integrasi Midtrans

```typescript
// src/lib/payment/midtrans.ts
import midtransClient from 'midtrans-client';

const snap = new midtransClient.Snap({
  isProduction: process.env.NODE_ENV === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
});

export async function createQrisPayment(order: {
  id: string;
  orderNumber: string;
  total: number;
  customerName: string;
  customerPhone?: string;
}) {
  const parameter = {
    transaction_details: {
      order_id: order.orderNumber,
      gross_amount: order.total,
    },
    customer_details: {
      first_name: order.customerName,
      phone: order.customerPhone,
    },
    payment_type: 'qris',
    qris: {
      acquirer: 'gopay',
    },
  };

  const transaction = await snap.createTransaction(parameter);
  return transaction;
}
```

### 3.2 Webhook Handler

```typescript
// src/app/api/webhooks/midtrans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // Verifikasi signature Midtrans
  const signatureKey = crypto
    .createHash('sha512')
    .update(`${body.order_id}${body.status_code}${body.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`)
    .digest('hex');
  
  if (signatureKey !== body.signature_key) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  // Idempotency check
  const existingLog = await prisma.auditLog.findFirst({
    where: { action: 'WEBHOOK_PAYMENT', entityId: body.order_id, meta: { contains: body.transaction_id } }
  });
  
  if (existingLog) {
    return NextResponse.json({ message: 'Already processed' });
  }
  
  if (body.transaction_status === 'settlement' || body.transaction_status === 'capture') {
    const order = await prisma.order.findUnique({ where: { orderNumber: body.order_id } });
    
    if (order && order.status === 'WAITING_PAYMENT') {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: { status: 'PAID_MANUAL', paidAt: new Date() },
        }),
        prisma.auditLog.create({
          data: {
            action: 'WEBHOOK_PAYMENT',
            entity: 'Order',
            entityId: body.order_id,
            meta: JSON.stringify({ transactionId: body.transaction_id, status: body.transaction_status }),
          },
        }),
      ]);
    }
  }
  
  return NextResponse.json({ message: 'OK' });
}
```

**Environment variables:**
```env
MIDTRANS_SERVER_KEY=your-server-key
MIDTRANS_CLIENT_KEY=your-client-key
```

### 3.3 Payment Provider Abstraction

```typescript
// src/lib/payment/index.ts
export interface PaymentProvider {
  createPayment(order: OrderData): Promise<PaymentResult>;
  verifyWebhook(payload: unknown, signature: string): boolean;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
}

// Mudah ganti provider tanpa ubah business logic
export function getPaymentProvider(): PaymentProvider {
  switch (process.env.PAYMENT_PROVIDER) {
    case 'midtrans': return new MidtransProvider();
    case 'xendit': return new XenditProvider();
    default: return new MockProvider(); // untuk development
  }
}
```

---

## Phase 4 — Monetization Engine

### 4.1 Subscription Plans

```prisma
// Tambah ke schema.prisma
model Subscription {
  id          String    @id @default(cuid())
  tenantId    String    @unique
  plan        String    @default("BASIC") // BASIC | PRO | BUSINESS
  status      String    @default("ACTIVE") // ACTIVE | TRIAL | EXPIRED | CANCELLED
  trialEndsAt DateTime?
  currentPeriodStart DateTime @default(now())
  currentPeriodEnd   DateTime
  cancelledAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id])
  @@map("subscriptions")
}
```

### 4.2 Feature Gating

```typescript
// src/lib/features.ts
export const PLAN_FEATURES = {
  BASIC: {
    maxProducts: 50,
    qrisDynamic: false,
    whatsappNotif: false,
    exportCsv: false,
    multiOutlet: false,
    staffManagement: false,
  },
  PRO: {
    maxProducts: Infinity,
    qrisDynamic: true,
    whatsappNotif: true,
    exportCsv: true,
    multiOutlet: false,
    staffManagement: false,
  },
  BUSINESS: {
    maxProducts: Infinity,
    qrisDynamic: true,
    whatsappNotif: true,
    exportCsv: true,
    multiOutlet: true,
    staffManagement: true,
  },
} as const;

export type Feature = keyof typeof PLAN_FEATURES.BASIC;

export async function hasFeature(tenantId: string, feature: Feature): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({ where: { tenantId } });
  if (!subscription || subscription.status === 'EXPIRED') return false;
  
  const plan = subscription.plan as keyof typeof PLAN_FEATURES;
  return PLAN_FEATURES[plan][feature] as boolean;
}

// Penggunaan di API route
export async function POST(req: NextRequest) {
  const session = await auth();
  
  if (!await hasFeature(session.user.tenantId, 'qrisDynamic')) {
    return NextResponse.json({ 
      error: 'Fitur QRIS Dinamis hanya tersedia di paket Pro ke atas.',
      upgradeUrl: '/dashboard/billing'
    }, { status: 403 });
  }
  // ...
}
```

### 4.3 Trial & Dunning

```typescript
// src/lib/subscription.ts
export async function createTrialSubscription(tenantId: string) {
  const trialDays = 14;
  const now = new Date();
  
  return prisma.subscription.create({
    data: {
      tenantId,
      plan: 'PRO',
      status: 'TRIAL',
      trialEndsAt: addDays(now, trialDays),
      currentPeriodStart: now,
      currentPeriodEnd: addDays(now, trialDays),
    },
  });
}

// Cron job: cek trial expired (jalankan setiap hari)
export async function checkExpiredTrials() {
  const expiredTrials = await prisma.subscription.findMany({
    where: {
      status: 'TRIAL',
      trialEndsAt: { lt: new Date() },
    },
    include: { tenant: true },
  });
  
  for (const sub of expiredTrials) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'EXPIRED', plan: 'BASIC' },
    });
    
    // Kirim email/WA reminder
    await sendTrialExpiredNotification(sub.tenant);
  }
}
```

---

## Phase 5 — Scale & Differentiation

### 5.1 Job Queue (BullMQ + Redis)

```typescript
// src/lib/queue/index.ts
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL!);

// Queue untuk notifikasi
export const notificationQueue = new Queue('notifications', { connection });

// Queue untuk laporan
export const reportQueue = new Queue('reports', { connection });

// Worker notifikasi
const notificationWorker = new Worker('notifications', async (job) => {
  switch (job.name) {
    case 'whatsapp':
      await sendWhatsAppNotification(job.data.phone, job.data.message);
      break;
    case 'email':
      await sendEmail(job.data.to, job.data.subject, job.data.body);
      break;
  }
}, { connection });

// Tambah job ke queue
await notificationQueue.add('whatsapp', {
  phone: order.customerPhone,
  message: `Order ${order.orderNumber} sedang diproses...`,
}, {
  delay: 0,
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
});
```

```bash
npm install bullmq ioredis
```

### 5.2 Event-Driven Architecture

```typescript
// src/lib/events/index.ts
import EventEmitter from 'events';

export const eventBus = new EventEmitter();

// Event types
export type AppEvent = 
  | { type: 'order.created'; payload: { orderId: string; tenantId: string } }
  | { type: 'order.paid'; payload: { orderId: string; tenantId: string; amount: number } }
  | { type: 'order.completed'; payload: { orderId: string; tenantId: string } };

// Emit event
eventBus.emit('order.paid', { orderId: order.id, tenantId: order.tenantId, amount: order.total });

// Listen event
eventBus.on('order.paid', async ({ orderId, tenantId, amount }) => {
  // Update analytics
  await updateDailyRevenue(tenantId, amount);
  
  // Kirim notifikasi
  await notificationQueue.add('whatsapp', { ... });
  
  // Update loyalty points
  await updateLoyaltyPoints(orderId);
});
```

### 5.3 AI Tools (OpenAI)

```typescript
// src/lib/ai.ts
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateProductDescription(
  productName: string,
  category: string
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Buat deskripsi produk yang menarik untuk "${productName}" kategori ${category}. 
      Maksimal 100 kata, bahasa Indonesia, fokus pada manfaat dan keunikan produk.`
    }],
    max_tokens: 150,
  });
  
  return completion.choices[0].message.content || '';
}

export async function generatePromoCaption(
  storeName: string,
  promoDetails: string
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Buat caption promosi WhatsApp/Instagram untuk toko "${storeName}". 
      Detail promo: ${promoDetails}. 
      Gunakan emoji, bahasa santai, dan CTA yang kuat. Maksimal 150 kata.`
    }],
  });
  
  return completion.choices[0].message.content || '';
}
```

---

## Arsitektur Robust

### Database Connection Pooling

```typescript
// src/lib/prisma.ts (production)
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL!;
  const libsqlUrl = dbUrl.startsWith('file:./') ? `file:${dbUrl.slice(7)}` : dbUrl;
  
  const adapter = new PrismaLibSql({
    url: libsqlUrl,
    authToken: process.env.DATABASE_AUTH_TOKEN, // untuk Turso
  });
  
  return new PrismaClient({
    adapter: adapter as any,
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });
}
```

### Error Handling Terpusat

```typescript
// src/lib/api-handler.ts
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export function withErrorHandler(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: error.issues[0].message },
          { status: 400 }
        );
      }
      
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return NextResponse.json(
            { error: 'Data sudah ada (duplicate).' },
            { status: 409 }
          );
        }
        if (error.code === 'P2025') {
          return NextResponse.json(
            { error: 'Data tidak ditemukan.' },
            { status: 404 }
          );
        }
      }
      
      console.error('Unhandled error:', error);
      return NextResponse.json(
        { error: 'Terjadi kesalahan server.' },
        { status: 500 }
      );
    }
  };
}

// Penggunaan
export const POST = withErrorHandler(async (req) => {
  // handler code
});
```

### Caching dengan Redis

```typescript
// src/lib/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 300
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await fetcher();
  await redis.setex(key, ttlSeconds, JSON.stringify(data));
  return data;
}

export async function invalidateCache(pattern: string) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) await redis.del(...keys);
}

// Penggunaan
const products = await getCached(
  `products:${tenantId}`,
  () => prisma.product.findMany({ where: { tenantId } }),
  60 // 1 menit
);
```

---

## Security Hardening

### 1. Input Sanitization

```typescript
// src/lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}
```

### 2. CSRF Protection

NextAuth v5 sudah handle CSRF untuk form actions. Untuk custom API routes:

```typescript
// src/middleware.ts
import { auth } from '@/lib/auth';

export default auth((req) => {
  // Verifikasi Origin header untuk API routes
  if (req.nextUrl.pathname.startsWith('/api/') && 
      !req.nextUrl.pathname.startsWith('/api/auth/')) {
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    
    if (origin && !origin.includes(host || '')) {
      return new Response('Forbidden', { status: 403 });
    }
  }
  // ...
});
```

### 3. SQL Injection Prevention

Prisma ORM sudah parameterize semua query secara otomatis. Hindari `$queryRaw` kecuali benar-benar diperlukan:

```typescript
// ❌ Jangan lakukan ini
const result = await prisma.$queryRaw`SELECT * FROM users WHERE email = '${email}'`;

// ✅ Gunakan ini
const result = await prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`;
// atau lebih baik:
const result = await prisma.user.findUnique({ where: { email } });
```

### 4. Secrets Management

```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  // Optional
  MIDTRANS_SERVER_KEY: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  REDIS_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);
```

### 5. Security Headers

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};
```

---

## Performance Optimization

### 1. Database Query Optimization

```typescript
// Gunakan select untuk ambil field yang diperlukan saja
const orders = await prisma.order.findMany({
  where: { tenantId },
  select: {
    id: true,
    orderNumber: true,
    customerName: true,
    total: true,
    status: true,
    createdAt: true,
    _count: { select: { items: true } }, // count items tanpa load semua
  },
  orderBy: { createdAt: 'desc' },
  take: 20,
});

// Gunakan cursor-based pagination untuk dataset besar
const orders = await prisma.order.findMany({
  where: { tenantId },
  take: 20,
  skip: 1,
  cursor: { id: lastOrderId },
  orderBy: { createdAt: 'desc' },
});
```

### 2. Next.js Caching

```typescript
// Server Component dengan revalidation
export const revalidate = 60; // revalidate setiap 60 detik

// Atau per-request
import { unstable_cache } from 'next/cache';

const getProducts = unstable_cache(
  async (tenantId: string) => {
    return prisma.product.findMany({ where: { tenantId, isActive: true } });
  },
  ['products'],
  { revalidate: 60, tags: ['products'] }
);

// Invalidate cache setelah update
import { revalidateTag } from 'next/cache';
revalidateTag('products');
```

### 3. Image Optimization

```typescript
// Gunakan next/image untuk optimasi otomatis
import Image from 'next/image';

<Image
  src={product.imageUrl}
  alt={product.name}
  width={400}
  height={300}
  className="object-cover"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### 4. Bundle Size Optimization

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
};
```

---

## Testing Strategy

### 1. Unit Tests (Vitest)

```bash
npm install -D vitest @vitejs/plugin-react
```

```typescript
// src/lib/__tests__/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatRupiah, generateOrderNumber } from '../utils';

describe('formatRupiah', () => {
  it('formats number to IDR currency', () => {
    expect(formatRupiah(25000)).toBe('Rp 25.000');
    expect(formatRupiah(1000000)).toBe('Rp 1.000.000');
  });
});

describe('generateOrderNumber', () => {
  it('generates unique order numbers', () => {
    const num1 = generateOrderNumber();
    const num2 = generateOrderNumber();
    expect(num1).toMatch(/^ORD-\d{8}-\d{4}$/);
    expect(num1).not.toBe(num2);
  });
});
```

### 2. Integration Tests (API Routes)

```typescript
// src/app/api/__tests__/register.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '../register/route';
import { prisma } from '@/lib/prisma';

describe('POST /api/register', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: 'test' } } });
    await prisma.tenant.deleteMany({ where: { slug: { contains: 'test' } } });
  });

  it('creates tenant and owner user', async () => {
    const req = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({
        ownerName: 'Test Owner',
        email: 'test@example.com',
        password: 'password123',
        storeName: 'Test Store',
        storeSlug: 'test-store',
      }),
    });

    const res = await POST(req as any);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.tenantSlug).toBe('test-store');
  });
});
```

### 3. E2E Tests (Playwright)

```bash
npm install -D @playwright/test
```

```typescript
// tests/storefront.spec.ts
import { test, expect } from '@playwright/test';

test('customer can add product to cart and checkout', async ({ page }) => {
  await page.goto('/store/demo');
  
  // Tambah produk ke cart
  await page.click('button:has-text("Tambah")');
  
  // Buka cart
  await page.click('button:has-text("item")');
  
  // Lanjut checkout
  await page.click('button:has-text("Lanjut ke Checkout")');
  
  // Isi form
  await page.fill('input[placeholder="Nama lengkap"]', 'Test Customer');
  
  // Submit order
  await page.click('button:has-text("Buat Pesanan")');
  
  // Verifikasi QRIS muncul
  await expect(page.locator('text=Bayar via QRIS')).toBeVisible();
});
```

---

## Monitoring & Observability

### 1. Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

### 2. Logging Terstruktur (Pino)

```bash
npm install pino pino-pretty
```

```typescript
// src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty' } 
    : undefined,
});

// Penggunaan
logger.info({ orderId: order.id, tenantId }, 'Order created');
logger.error({ error, orderId }, 'Failed to process payment');
```

### 3. Performance Monitoring (Vercel Analytics)

```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### 4. Health Check Endpoint

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    }, { status: 503 });
  }
}
```

---

## Database Migration Strategy

### Prinsip
1. **Backward compatible** — migrasi tidak boleh break existing data
2. **Rollback plan** — setiap migrasi harus bisa di-rollback
3. **Zero downtime** — gunakan expand-contract pattern

### Expand-Contract Pattern

```sql
-- Step 1: EXPAND — tambah kolom baru (nullable)
ALTER TABLE orders ADD COLUMN payment_reference TEXT;

-- Step 2: Backfill data (background job)
UPDATE orders SET payment_reference = order_number WHERE payment_reference IS NULL;

-- Step 3: CONTRACT — buat NOT NULL setelah semua data terisi
ALTER TABLE orders ALTER COLUMN payment_reference SET NOT NULL;
```

### Prisma Migration Best Practices

```bash
# Buat migrasi baru
npx prisma migrate dev --name add-payment-reference

# Preview SQL sebelum apply
npx prisma migrate dev --create-only

# Apply di production
npx prisma migrate deploy

# Reset database (HATI-HATI: hapus semua data)
npx prisma migrate reset
```

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
        env:
          DATABASE_URL: file:./test.db
          NEXTAUTH_SECRET: test-secret-32-chars-minimum
          NEXTAUTH_URL: http://localhost:3000

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:migrate": "DATABASE_URL=file:./dev.db npx prisma migrate dev",
    "db:seed": "DATABASE_URL=file:./dev.db tsx prisma/seed.ts",
    "db:studio": "DATABASE_URL=file:./dev.db npx prisma studio",
    "db:reset": "DATABASE_URL=file:./dev.db npx prisma migrate reset"
  }
}
```

---

## Checklist Production Readiness

### Security
- [ ] Environment variables tidak di-commit ke git
- [ ] NEXTAUTH_SECRET minimal 32 karakter random
- [ ] Rate limiting di endpoint sensitif (register, login, order)
- [ ] Input validation dengan Zod di semua API routes
- [ ] Security headers (X-Frame-Options, CSP, dll)
- [ ] HTTPS enforced di production
- [ ] Webhook signature verification (Midtrans/Xendit)

### Performance
- [ ] Database indexes di kolom yang sering di-query (tenantId, status, createdAt)
- [ ] Pagination di semua list endpoint
- [ ] Image optimization (next/image atau CDN)
- [ ] Bundle size < 200KB (first load JS)
- [ ] Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1

### Reliability
- [ ] Error tracking (Sentry)
- [ ] Health check endpoint
- [ ] Database backup otomatis (Turso auto-backup)
- [ ] Graceful shutdown handling
- [ ] Retry mechanism untuk webhook processing

### Observability
- [ ] Structured logging (Pino)
- [ ] Performance monitoring (Vercel Analytics)
- [ ] Uptime monitoring (UptimeRobot/Better Uptime)
- [ ] Alert untuk error rate tinggi

### Database
- [ ] Migration strategy terdokumentasi
- [ ] Backup & restore procedure
- [ ] Connection pooling configured
- [ ] Query performance monitoring

### Testing
- [ ] Unit tests untuk business logic
- [ ] Integration tests untuk API routes
- [ ] E2E tests untuk critical user flows
- [ ] Load testing sebelum launch

### Compliance
- [ ] Privacy policy & terms of service
- [ ] Cookie consent (jika ada tracking)
- [ ] Data retention policy
- [ ] GDPR/UU PDP compliance (untuk data pelanggan)

---

## Estimasi Effort Pengembangan

| Phase | Fitur | Estimasi |
|-------|-------|----------|
| Phase 2 | Dashboard analytics + export CSV | 1-2 minggu |
| Phase 2 | Notifikasi WhatsApp | 3-5 hari |
| Phase 2 | Image upload (Cloudinary) | 2-3 hari |
| Phase 2 | Rate limiting + security hardening | 3-5 hari |
| Phase 3 | QRIS dinamis (Midtrans) | 1-2 minggu |
| Phase 3 | Webhook handler + rekonsiliasi | 1 minggu |
| Phase 4 | Subscription + feature gating | 2-3 minggu |
| Phase 4 | Billing portal | 1-2 minggu |
| Phase 5 | Job queue (BullMQ) | 1 minggu |
| Phase 5 | AI tools (OpenAI) | 3-5 hari |
| Infra | CI/CD + monitoring | 3-5 hari |
| Testing | Unit + integration + E2E | 1-2 minggu |

---

*Dokumen ini diperbarui seiring perkembangan produk. Lihat [`imp.md`](../imp.md) untuk roadmap bisnis lengkap.*
