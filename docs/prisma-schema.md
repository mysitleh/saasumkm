# Prisma Schema UMKMStore

## Models

### Tenant (UMKM Store)
- id, name, slug (unique), description, logoUrl, address, phone
- qrisImageUrl: URL gambar QRIS statis
- isActive: toggle aktif/nonaktif toko

### User
- id, tenantId (FK), name, email (unique), password (bcrypt)
- role: OWNER | CASHIER | CUSTOMER
- isActive: toggle aktif/nonaktif user

### Category
- id, tenantId (FK), name
- Digunakan untuk filter produk di storefront

### Product
- id, tenantId (FK), categoryId (FK nullable)
- name, description, price (IDR), stock, imageUrl
- isActive: toggle tampil/sembunyi di storefront

### Promo
- id, tenantId (FK), code (unique per tenant)
- type: PERCENT | NOMINAL
- value, minOrder, maxDiscount, expiresAt
- isActive

### Order
- id, tenantId (FK), userId (FK nullable), promoId (FK nullable)
- orderNumber (unique), customerName, customerPhone, customerNote
- deliveryType: PICKUP | DELIVERY, deliveryAddress
- subtotal, discountAmount, total
- status: WAITING_PAYMENT → PAID_MANUAL → PROCESSING → COMPLETED | CANCELLED
- paymentMethod: QRIS_STATIC (Phase 1) | QRIS_DYNAMIC (Phase 3)
- paidAt: timestamp konfirmasi bayar

### OrderItem
- id, orderId (FK), productId (FK)
- name (snapshot), price (snapshot), quantity, subtotal

### AuditLog
- id, userId (FK nullable), action, entity, entityId, meta (JSON)
- Actions: LOGIN, REGISTER, CREATE_ORDER, UPDATE_ORDER_STATUS
