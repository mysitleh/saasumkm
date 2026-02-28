# roadmap.md
# 🚀 Roadmap UMKMStore SaaS (Mobile-First + QRIS + Next.js)

Tanggal acuan: 2026-02-28 (WITA)

---

## 0) Visi Produk
UMKMStore adalah SaaS multi-tenant (banyak UMKM dalam 1 platform) yang membantu UMKM:
- bikin toko digital (katalog, stok, promo)
- terima order (pickup/delivery)
- terima pembayaran QRIS (mulai dari QRIS statis → upgrade QRIS dinamis + webhook)
- punya dashboard penjualan
- mudah digunakan via mobile (PWA dulu, native kemudian)

---

## 1) North Star Metric & KPI
**North Star Metric:** jumlah transaksi sukses (PAID) per UMKM per minggu.

**KPI awal (3 bulan):**
- Aktivasi: % UMKM yang publish toko + upload ≥10 produk
- Conversion: % order yang menjadi paid
- Retensi: UMKM aktif transaksi ≥4 minggu berturut-turut
- GMV: total omzet yang lewat sistem
- Churn: UMKM berhenti berlangganan / tidak aktif 30 hari

---

## 2) Prinsip Eksekusi
- Mobile-first UI (PWA supaya cepat rilis)
- Multi-tenant sejak awal (tenant_id di semua tabel)
- MVP: QRIS statis & konfirmasi manual dulu (cepat jalan)
- Scale: QRIS dinamis + webhook + rekonsiliasi
- Semua modul dibuat modular: auth, tenant, product, order, payment, subscription

---

## 3) Roadmap Fase & Deliverables

### Phase 0 — Validasi (1–2 minggu)
**Tujuan:** memastikan niche UMKM & alur transaksi cocok.

**Deliverables:**
- 1 landing page sederhana (value, harga, CTA)
- 10–20 interview UMKM (kuliner/hampers/kopi)
- Wireframe mobile flow (customer & owner)
- Definisi paket subscription (Basic/Pro/Business)
- Definisi alur pembayaran: QRIS statis (MVP) + target QRIS dinamis (phase 2)

**Output sukses:**
- minimal 10 UMKM bersedia jadi pilot
- checklist fitur MVP terkunci

---

### Phase 1 — MVP Launch (4 minggu)
**Tujuan:** platform bisa dipakai jualan beneran walau verifikasi pembayaran masih manual.

#### 1.1 Core Platform (Week 1–2)
**Fitur:**
- Multi-tenant setup (tenant + user role)
- Auth (owner/kasir/customer)
- Profil toko + slug storefront
- CRUD produk + foto + stok sederhana
- Storefront customer (katalog + detail produk)

**Deliverables teknis:**
- Skema DB v1 (tenants, users, products, orders)
- Middleware role + tenant isolation
- Storage image (R2/S3)
- Audit log minimal (login, create order, update status)

#### 1.2 Order & QRIS Statis (Week 3–4)
**Fitur:**
- Cart + checkout
- Pilih pickup/delivery (manual)
- Upload QRIS statis per toko (gambar/QR)
- Status order: `waiting_payment` → `paid_manual` → `processing` → `completed`
- Konfirmasi pembayaran manual oleh kasir/owner
- Invoice digital sederhana

**Output sukses:**
- 10 UMKM pilot bisa terima order & catat transaksi
- minimal 100 transaksi tercatat (manual paid)

---

### Phase 2 — Stabilize & Grow (4–6 minggu)
**Tujuan:** bikin operasional nyaman, laporan jelas, onboarding cepat.

**Fitur:**
- Dashboard penjualan (harian/mingguan/bulanan)
- Produk terlaris, omzet, total order
- Export CSV transaksi
- Manajemen staff (role kasir)
- Promo sederhana (diskon % / nominal)
- Notifikasi order (WhatsApp template / email)

**Non-fitur:**
- Error tracking + logging
- Rate limit endpoint sensitif
- Backup & migration strategy
- Monitoring performa (web vitals, API latency)

**Output sukses:**
- Activation rate naik (UMKM publish toko + upload produk)
- order-to-paid conversion meningkat walau manual

---

### Phase 3 — QRIS Dinamis + Webhook (6–10 minggu)
**Tujuan:** pembayaran otomatis, status update realtime, mengurangi kerja kasir.

**Fitur:**
- Integrasi Payment Gateway yang support QRIS dinamis
- Endpoint create payment: generate QRIS per transaksi
- Webhook handler: verifikasi signature + update payment
- Auto update status order: `waiting_payment` → `paid`
- Rekonsiliasi transaksi (payment reference)
- Payment receipt & settlement report sederhana

**Deliverables teknis:**
- Modul payment provider abstraction (agar bisa ganti gateway)
- Idempotency key untuk webhook
- Retry mechanism untuk event processing

**Output sukses:**
- 90% transaksi paid otomatis tanpa konfirmasi manual
- Dispute rate turun

---

### Phase 4 — Monetization Engine (4–6 minggu)
**Tujuan:** SaaS beneran: subscription, billing, limit fitur.

**Fitur:**
- Paket langganan: Basic/Pro/Business
- Billing portal (upgrade/downgrade)
- Feature gating (mis. QRIS dinamis hanya Pro+)
- Multi outlet (Business)
- Trial 14 hari + reminder
- Dunning (tagihan gagal → reminder → limited mode)

**Output sukses:**
- MRR mulai terbentuk
- churn terukur & turun dengan onboarding yang baik

---

### Phase 5 — Scale & Differentiation (berjalan)
**Tujuan:** bikin produk unggul, retensi tinggi, siap ekspansi.

**Fitur unggulan:**
- Loyalty (poin/stamp) + voucher
- CRM pelanggan (repeat order, segmentasi)
- WhatsApp automation (order status, promo broadcast)
- Analytics lanjutan: cohort, retention, LTV
- POS mode (kasir cepat) & offline-first (opsional)
- AI tools: deskripsi produk, caption promo, rekomendasi stok

**Arsitektur scale:**
- Job queue (Redis + worker)
- Event-driven (order_paid event → notif → laporan)
- Read replicas untuk reporting (opsional)
- Modularization (payment/analytics service dipisah jika perlu)

---

## 4) Timeline Ringkas (Versi Cepat)
- Minggu 1–2: Validasi + wireframe + landing
- Minggu 3–6: MVP (katalog + order + QRIS statis manual)
- Minggu 7–12: Stabilize + dashboard + onboarding + notif
- Minggu 13–22: QRIS dinamis + webhook + rekonsiliasi
- Minggu 23–28: Subscription engine + feature gating
- Minggu 29+: Scale features + AI + POS + multi outlet

---

## 5) Checklist “Definition of Done” per Phase

### MVP DoD
- [ ] Toko publish dan bisa diakses customer
- [ ] Produk bisa ditambah + foto tersimpan
- [ ] Customer bisa checkout
- [ ] Order tercatat dengan status
- [ ] Pembayaran QRIS statis tampil
- [ ] Kasir/owner bisa set order menjadi paid (manual)
- [ ] Dashboard minimal: total order + omzet manual

### QRIS Dinamis DoD
- [ ] QRIS per transaksi muncul (nominal tepat)
- [ ] Webhook sukses update status paid otomatis
- [ ] Rekonsiliasi payment reference
- [ ] Aman (signature verification + idempotent)
- [ ] Log & monitoring tersedia

### SaaS Billing DoD
- [ ] Paket langganan aktif
- [ ] Feature gating jalan
- [ ] Trial + reminder
- [ ] Upgrade/downgrade tercatat
- [ ] Mode terbatas jika tidak bayar

---

## 6) Risiko Utama & Mitigasi

1) **QRIS Dinamis & Kebutuhan Legal**
- Mitigasi: mulai QRIS statis (MVP) → integrasi gateway resmi setelah traction

2) **UMKM Gap Literasi Digital**
- Mitigasi: onboarding super sederhana + template toko + import produk (CSV)

3) **Kualitas Foto/Deskripsi Produk**
- Mitigasi: AI copywriting & panduan upload foto (phase 5)

4) **Operasional Delivery**
- Mitigasi: delivery manual dulu, integrasi kurir belakangan

5) **Fraud / Bukti Bayar Palsu**
- Mitigasi: QRIS dinamis + webhook (phase 3), audit log & review

---

## 7) Output Dokumen Pendukung (opsional tapi recommended)
- `blueprint.md` (arsitektur & modul)
- `prisma-schema.md` (draft schema)
- `ui-flow.md` (screen-by-screen)
- `pricing.md` (paket & fitur)
- `pilot-plan.md` (rencana 10 UMKM pilot)

---

## 8) Target Pilot yang Disarankan
Mulai dari niche yang transaksinya cepat & repeat:
- Kedai kopi
- Kuliner pre-order
- Hampers & snack lokal
- Fashion simple (tanpa varian kompleks dulu)

---

# ✅ End of roadmap.md