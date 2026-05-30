import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const libsqlUrl = dbUrl.startsWith("file:./") ? `file:${dbUrl.slice(7)}` : dbUrl.startsWith("file:") ? dbUrl : `file:${dbUrl}`;
const adapter = new PrismaLibSql({ url: libsqlUrl });
const prisma = new PrismaClient({ adapter } as never);

function randomOrderNumber() {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `ORD-${d}-${Math.floor(Math.random() * 9000) + 1000}`;
}

async function main() {
  console.log("🌱 Full seed starting...");

  // Clean existing data
  await prisma.loyaltyPointLog.deleteMany();
  await prisma.loyaltyCard.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.promo.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.outlet.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // Create tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: "Kedai Kopi Nusantara",
      slug: "demo",
      description: "Kedai kopi specialty dengan biji pilihan dari seluruh Nusantara. Fresh roasted daily, brewed with passion.",
      address: "Jl. Sudirman No. 42, Jakarta Selatan",
      phone: "08123456789",
      themeColor: "green",
      isPlatformAdmin: true,
      logoUrl: "https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=200&h=200&fit=crop",
      qrisImageUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=QRIS-DEMO-KEDAI-KOPI",
    },
  });

  // Subscription PRO trial
  const now = new Date();
  const in14d = new Date(now.getTime() + 14 * 24 * 60 * 60_000);
  await prisma.subscription.create({
    data: { tenantId: tenant.id, plan: "PRO", status: "TRIAL", trialEndsAt: in14d, currentPeriodStart: now, currentPeriodEnd: in14d },
  });

  // Users
  const hash = await bcrypt.hash("password123", 12);
  const owner = await prisma.user.create({
    data: { name: "Budi Santoso", email: "owner@demo.com", password: hash, role: "OWNER", tenantId: tenant.id },
  });
  await prisma.user.create({
    data: { name: "Sari Kasir", email: "kasir@demo.com", password: hash, role: "CASHIER", tenantId: tenant.id },
  });

  // Categories
  const catKopi = await prisma.category.create({ data: { name: "Kopi", tenantId: tenant.id } });
  const catNonKopi = await prisma.category.create({ data: { name: "Non-Kopi", tenantId: tenant.id } });
  const catMakanan = await prisma.category.create({ data: { name: "Makanan", tenantId: tenant.id } });
  const catDessert = await prisma.category.create({ data: { name: "Dessert", tenantId: tenant.id } });
  const catSnack = await prisma.category.create({ data: { name: "Snack", tenantId: tenant.id } });

  // Products — 20 produk dengan gambar HD Unsplash (800px)
  const products = await Promise.all([
    // Kopi (7)
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catKopi.id, name: "Kopi Susu Gula Aren", description: "Kopi susu signature dengan gula aren asli Banten. Creamy dan manis alami.", price: 25000, stock: 120, imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&h=800&fit=crop", variants: JSON.stringify([{name:"Ukuran",options:[{label:"Regular",priceAdd:0},{label:"Large",priceAdd:5000}]},{name:"Es",options:[{label:"Normal",priceAdd:0},{label:"Extra Es",priceAdd:0},{label:"Less Ice",priceAdd:0}]}]) } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catKopi.id, name: "Americano", description: "Double shot espresso dengan air panas. Bold dan clean.", price: 22000, stock: 100, imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=800&fit=crop" } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catKopi.id, name: "Cappuccino", description: "Espresso dengan steamed milk dan foam tebal. Classic Italian style.", price: 28000, stock: 80, imageUrl: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&h=800&fit=crop" } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catKopi.id, name: "V60 Single Origin Toraja", description: "Pour over V60 dengan biji single origin Toraja. Fruity, floral, dan complex.", price: 38000, stock: 30, imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=800&fit=crop" } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catKopi.id, name: "Espresso Double Shot", description: "Double shot espresso. Intense, bold, dan full-bodied.", price: 18000, stock: 100, imageUrl: "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=800&h=800&fit=crop" } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catKopi.id, name: "Cold Brew 12 Jam", description: "Kopi cold brew yang direndam 12 jam. Smooth, low acidity, chocolatey.", price: 32000, stock: 45, imageUrl: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&h=800&fit=crop" } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catKopi.id, name: "Affogato", description: "Vanilla gelato disiram espresso panas. Dessert meets coffee.", price: 35000, stock: 25, imageUrl: "https://images.unsplash.com/photo-1579992357154-faf4bde95b3d?w=800&h=800&fit=crop" } }),
    // Non-Kopi (4)
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catNonKopi.id, name: "Matcha Latte", description: "Matcha premium Uji dengan susu segar. Creamy dan earthy.", price: 30000, stock: 50, imageUrl: "https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?w=800&h=800&fit=crop" } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catNonKopi.id, name: "Taro Latte", description: "Taro asli dengan susu. Manis natural dan creamy purple.", price: 28000, stock: 40, imageUrl: "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=800&h=800&fit=crop" } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catNonKopi.id, name: "Lemon Tea Sparkling", description: "Teh hitam dengan perasan lemon segar dan soda. Refreshing!", price: 22000, stock: 60, imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=800&fit=crop" } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catNonKopi.id, name: "Chocolate Hazelnut", description: "Belgian chocolate dengan hazelnut syrup dan susu. Rich dan indulgent.", price: 32000, stock: 35, imageUrl: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=800&h=800&fit=crop" } }),
    // Makanan (5)
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catMakanan.id, name: "Croissant Butter", description: "Croissant premium dengan French butter. Flaky, golden, dan rich.", price: 25000, stock: 30, imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&h=800&fit=crop" } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catMakanan.id, name: "Club Sandwich", description: "Triple decker sandwich dengan ayam panggang, telur, bacon, dan sayuran segar.", price: 42000, stock: 20, imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&h=800&fit=crop" } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catMakanan.id, name: "Avocado Toast", description: "Sourdough toast dengan smashed avocado, poached egg, dan microgreens.", price: 38000, stock: 15, imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&h=800&fit=crop" } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catMakanan.id, name: "Nasi Goreng Kampung", description: "Nasi goreng dengan bumbu kampung, telur ceplok, kerupuk, dan acar.", price: 35000, stock: 25, imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&h=800&fit=crop" } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catMakanan.id, name: "Pasta Aglio Olio", description: "Spaghetti aglio olio dengan udang, chili flakes, dan parsley segar.", price: 45000, stock: 18, imageUrl: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&h=800&fit=crop" } }),
    // Dessert (2)
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catDessert.id, name: "Tiramisu", description: "Classic Italian tiramisu dengan mascarpone, espresso, dan cocoa.", price: 32000, stock: 12, imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=800&fit=crop" } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catDessert.id, name: "Cheesecake Blueberry", description: "New York cheesecake dengan blueberry compote. Creamy dan tangy.", price: 35000, stock: 10, imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&h=800&fit=crop" } }),
    // Snack (2)
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catSnack.id, name: "French Fries Truffle", description: "Kentang goreng crispy dengan truffle oil dan parmesan.", price: 28000, stock: 40, imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=800&fit=crop" } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catSnack.id, name: "Chicken Wings BBQ", description: "Sayap ayam crispy dengan saus BBQ smoky. 6 pcs.", price: 38000, stock: 30, imageUrl: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&h=800&fit=crop" } }),
  ]);

  // Promos — 5 kode promo aktif
  await prisma.promo.create({ data: { tenantId: tenant.id, code: "HEMAT10", type: "PERCENT", value: 10, minOrder: 50000, maxDiscount: 15000 } });
  await prisma.promo.create({ data: { tenantId: tenant.id, code: "NEWUSER", type: "NOMINAL", value: 15000, minOrder: 30000 } });
  await prisma.promo.create({ data: { tenantId: tenant.id, code: "WEEKEND20", type: "PERCENT", value: 20, minOrder: 75000, maxDiscount: 30000, expiresAt: new Date("2026-12-31") } });
  await prisma.promo.create({ data: { tenantId: tenant.id, code: "KOPISUSU", type: "NOMINAL", value: 5000, minOrder: 25000 } });
  await prisma.promo.create({ data: { tenantId: tenant.id, code: "LOYALTY50", type: "PERCENT", value: 50, minOrder: 100000, maxDiscount: 50000, expiresAt: new Date("2026-09-30") } });

  // Customers — 15 pelanggan dengan nama realistis
  const customers = [
    { name: "Andi Pratama", phone: "081234567001" },
    { name: "Siti Rahayu", phone: "081234567002" },
    { name: "Dewi Lestari", phone: "081234567003" },
    { name: "Rudi Hartono", phone: "081234567004" },
    { name: "Maya Sari", phone: "081234567005" },
    { name: "Bimo Arya", phone: "081234567006" },
    { name: "Putri Ayu Wulandari", phone: "081234567007" },
    { name: "Fajar Nugroho", phone: "081234567008" },
    { name: "Lina Marlina", phone: "081234567009" },
    { name: "Doni Setiawan", phone: "081234567010" },
    { name: "Ratna Permata", phone: "081234567011" },
    { name: "Agus Wijaya", phone: "081234567012" },
    { name: "Nadia Kusuma", phone: "081234567013" },
    { name: "Hendra Gunawan", phone: "081234567014" },
    { name: "Fitri Handayani", phone: "081234567015" },
  ];

  // Create orders — 30 hari, 3-8 order/hari = ~150+ orders
  const statuses = ["COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "PROCESSING", "PAID_MANUAL", "WAITING_PAYMENT"];
  const orderNumbers = new Set<string>();

  for (let day = 29; day >= 0; day--) {
    const ordersPerDay = Math.floor(Math.random() * 6) + 3; // 3-8 orders per day
    for (let j = 0; j < ordersPerDay; j++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const numItems = Math.floor(Math.random() * 4) + 1; // 1-4 items
      const selectedProducts: { product: typeof products[0]; quantity: number }[] = [];
      const usedIds = new Set<string>();
      for (let k = 0; k < numItems; k++) {
        const p = products[Math.floor(Math.random() * products.length)];
        if (usedIds.has(p.id)) continue;
        usedIds.add(p.id);
        selectedProducts.push({ product: p, quantity: Math.floor(Math.random() * 3) + 1 });
      }
      if (selectedProducts.length === 0) continue;

      const subtotal = selectedProducts.reduce((s, i) => s + i.product.price * i.quantity, 0);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - day);
      orderDate.setHours(Math.floor(Math.random() * 14) + 7, Math.floor(Math.random() * 60));

      let orderNum = randomOrderNumber();
      while (orderNumbers.has(orderNum)) orderNum = randomOrderNumber();
      orderNumbers.add(orderNum);

      const order = await prisma.order.create({
        data: {
          tenantId: tenant.id,
          orderNumber: orderNum,
          customerName: customer.name,
          customerPhone: customer.phone,
          deliveryType: Math.random() > 0.65 ? "DELIVERY" : "PICKUP",
          deliveryAddress: Math.random() > 0.65 ? `Jl. ${["Merdeka","Sudirman","Gatot Subroto","Thamrin","Rasuna Said"][Math.floor(Math.random()*5)]} No. ${Math.floor(Math.random() * 100) + 1}` : null,
          subtotal,
          discountAmount: 0,
          total: subtotal,
          status,
          paidAt: ["COMPLETED", "PROCESSING", "PAID_MANUAL"].includes(status) ? orderDate : null,
          createdAt: orderDate,
          updatedAt: orderDate,
          items: {
            create: selectedProducts.map((i) => ({
              productId: i.product.id,
              name: i.product.name,
              price: i.product.price,
              quantity: i.quantity,
              subtotal: i.product.price * i.quantity,
            })),
          },
        },
      });

      // Create loyalty for paid orders
      if (["COMPLETED", "PROCESSING", "PAID_MANUAL"].includes(status) && customer.phone) {
        const points = Math.floor(subtotal / 10000);
        if (points > 0) {
          const card = await prisma.loyaltyCard.upsert({
            where: { tenantId_customerPhone: { tenantId: tenant.id, customerPhone: customer.phone } },
            create: { tenantId: tenant.id, customerPhone: customer.phone, customerName: customer.name, points, totalSpent: subtotal, totalOrders: 1 },
            update: { points: { increment: points }, totalSpent: { increment: subtotal }, totalOrders: { increment: 1 } },
          });
          await prisma.loyaltyPointLog.create({
            data: { cardId: card.id, type: "EARN", points, reason: `Order ${order.orderNumber}` },
          });
        }
      }
    }
  }

  // Audit logs
  await prisma.auditLog.create({ data: { userId: owner.id, tenantId: tenant.id, action: "LOGIN", entity: "User", entityId: owner.id } });
  await prisma.auditLog.create({ data: { userId: owner.id, tenantId: tenant.id, action: "REGISTER", entity: "Tenant", entityId: tenant.id } });
  await prisma.auditLog.create({ data: { userId: owner.id, tenantId: tenant.id, action: "PRODUCT_CREATE", entity: "Product", entityId: products[0].id } });

  // Outlets — 2 cabang
  await prisma.outlet.create({ data: { tenantId: tenant.id, name: "Cabang Kemang", address: "Jl. Kemang Raya No. 15, Jakarta Selatan", phone: "081999000111" } });
  await prisma.outlet.create({ data: { tenantId: tenant.id, name: "Cabang Senopati", address: "Jl. Senopati No. 8, Jakarta Selatan", phone: "081999000222" } });

  // Second tenant for admin dashboard variety
  const tenant2 = await prisma.tenant.create({
    data: {
      name: "Warung Makan Sederhana",
      slug: "warung-sederhana",
      description: "Masakan rumahan khas Padang dengan cita rasa autentik.",
      address: "Jl. Sabang No. 12, Jakarta Pusat",
      phone: "08567890123",
      themeColor: "orange",
      logoUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=200&fit=crop",
    },
  });
  await prisma.subscription.create({
    data: { tenantId: tenant2.id, plan: "BASIC", status: "ACTIVE", currentPeriodStart: now, currentPeriodEnd: in14d },
  });
  await prisma.user.create({
    data: { name: "Pak Ahmad", email: "ahmad@warung.com", password: hash, role: "OWNER", tenantId: tenant2.id },
  });

  // Third tenant
  const tenant3 = await prisma.tenant.create({
    data: {
      name: "Bakery Artisan Jakarta",
      slug: "bakery-artisan",
      description: "Roti artisan dan pastry premium, dibuat fresh setiap hari.",
      address: "Jl. Cikini Raya No. 55, Jakarta Pusat",
      phone: "08198765432",
      themeColor: "blue",
      logoUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop",
    },
  });
  await prisma.subscription.create({
    data: { tenantId: tenant3.id, plan: "BUSINESS", status: "ACTIVE", currentPeriodStart: now, currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60_000) },
  });
  await prisma.user.create({
    data: { name: "Sarah Baker", email: "sarah@bakery.com", password: hash, role: "OWNER", tenantId: tenant3.id },
  });

  const totalOrders = await prisma.order.count({ where: { tenantId: tenant.id } });
  const totalLoyalty = await prisma.loyaltyCard.count({ where: { tenantId: tenant.id } });

  console.log("✅ Full seed complete!");
  console.log(`📋 Demo: owner@demo.com / password123 (OWNER)`);
  console.log(`📋 Demo: kasir@demo.com / password123 (CASHIER)`);
  console.log(`🏪 Storefront: /store/demo`);
  console.log(`📦 ${totalOrders} orders created (30 days)`);
  console.log(`🏆 ${totalLoyalty} loyalty members`);
  console.log(`💎 Subscription: PRO (TRIAL)`);
  console.log(`🏢 3 tenants total (for admin dashboard)`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
