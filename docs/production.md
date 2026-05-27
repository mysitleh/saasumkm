# 🚀 Production Deployment Guide

Panduan praktis menerbitkan UMKMStore ke production. Setiap langkah punya
catatan keamanan & rollback. Cocok untuk Vercel + Turso (default), tapi
arsitekturnya mendukung host lain (Render, Fly.io, AWS) selama bisa
menjalankan Next.js dan tersambung ke libsql/SQLite-compatible.

---

## 1. Checklist sebelum rilis

### Konfigurasi
- [ ] `.env.production` (atau env vars di host) terisi sesuai `.env.example`
- [ ] `NEXTAUTH_SECRET` minimal 32 karakter random (`openssl rand -base64 32`)
- [ ] `NEXTAUTH_URL` cocok dengan domain final (HTTPS)
- [ ] `DATABASE_URL` mengarah ke libsql/Turso production, bukan file lokal
- [ ] `PAYMENT_PROVIDER` di-set (`midtrans` di prod, `mock` hanya dev)
- [ ] Webhook URL (`/api/webhooks/payment`) sudah didaftarkan di Midtrans

### Quality gates
- [ ] `npm run lint`
- [ ] `npm run type-check`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] Smoke test: register → buat toko → buat produk → checkout → konfirmasi bayar

### Operasional
- [ ] Backup strategi disepakati (Turso punya snapshot harian otomatis)
- [ ] Health check endpoint dipakai uptime monitoring (`/api/health`)
- [ ] Log forwarding ke Vercel Logs / Datadog / Loki

---

## 2. Setup Database (Turso)

```bash
# Sekali saja
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login
turso db create umkmstore-prod
turso db show umkmstore-prod              # ambil URL libsql://...
turso db tokens create umkmstore-prod     # ambil token panjang
```

Set di environment variables host:

```
DATABASE_URL=libsql://umkmstore-prod-<org>.turso.io
DATABASE_AUTH_TOKEN=<token>
```

Apply migrasi sekali (atau biarkan CI/CD melakukannya):

```bash
DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... npx prisma migrate deploy
```

> Untuk operasi destruktif (drop/reset), selalu confirm — Turso tidak
> auto-rollback. Lakukan di staging dulu.

---

## 3. Deploy ke Vercel

1. Push repo ke GitHub.
2. Import di [vercel.com/new](https://vercel.com/new).
3. Set environment variables (semua yang ada di `.env.example` + secrets).
4. Build command default (`npm run build`) sudah memanggil `prisma generate`.
5. Untuk migrasi otomatis di setiap deploy, tambahkan post-build hook:
   - Tambah pada Vercel Project → "Build & Deployment" → "Build Command":
     `npx prisma migrate deploy && npm run build`

> Catatan: Vercel menjalankan build command sebelum function deploy,
> jadi pastikan migrasi backward-compatible (lihat strategi
> expand-contract di [`DEVELOPMENT.md`](../DEVELOPMENT.md)).

---

## 4. Konfigurasi Payment (Midtrans)

1. Daftar Sandbox di https://dashboard.midtrans.com
2. Ambil Server Key & Client Key.
3. Set di env:
   ```
   PAYMENT_PROVIDER=midtrans
   MIDTRANS_SERVER_KEY=SB-Mid-server-...
   MIDTRANS_CLIENT_KEY=SB-Mid-client-...
   MIDTRANS_IS_PRODUCTION=false
   ```
4. Daftarkan webhook URL ke Midtrans:
   `https://<domain>/api/webhooks/payment`
5. Test: buat order, klik tombol bayar, simulasikan settlement di Sandbox.

> Webhook UMKMStore idempotent (event disimpan unik per provider+eventId).
> Kirim ulang aman.

---

## 5. WhatsApp Notifications (Fonnte)

Opsional, hanya untuk paket Pro+.

```
FONNTE_TOKEN=<token>
```

Kalau token kosong, sistem akan log skip dan tetap berjalan normal.

---

## 6. Monitoring

### Health Check

```
GET /api/health → 200 ok | 503 disconnected
```

Set uptime check setiap 60 detik. Latency p95 sebaiknya < 500ms.

### Log

Logger menulis JSON ke stdout — terbaca oleh Vercel Logs / Datadog langsung.

### Sentry (opsional)

Set `SENTRY_DSN` lalu install paket sesuai kebutuhan tim.

---

## 7. Rollback

### Code
Vercel menyediakan rollback ke deployment sebelumnya dengan satu klik.

### Database
- Turso punya backup point-in-time. Restore via dashboard.
- Jangan jalankan `prisma migrate reset` di production. Pakai migrasi baru
  (revert) untuk membatalkan perubahan schema.

---

## 8. Hardening Lanjutan

- Aktifkan **2FA** untuk akun OWNER (akan datang).
- Aktifkan **rate limit Redis-backed** (lihat `src/lib/rate-limit.ts`) saat
  multi-instance.
- Aktifkan **Cloudflare/Vercel WAF** untuk endpoint publik.
- Audit `audit_logs` secara berkala.

---

## 9. Cron / Scheduled Tasks

Saat ini sistem mengandalkan ekstensi platform untuk cron:

- Vercel Cron: tambahkan endpoint `/api/cron/expire-trials` (belum dibuat
  di MVP) lalu jadwalkan harian.
- Atau manual: panggil `expireOverdueSubscriptions()` dari script harian.

Kerangka di `src/lib/subscription.ts` sudah idempotent.
