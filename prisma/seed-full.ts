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
      description: "Kedai kopi specialty dengan biji pilihan dari seluruh Nusantara. Fresh roasted daily.",
      address: "Jl. Sudirman No. 42, Jakarta Selatan",
      phone: "08123456789",
      themeColor: "green",
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

  // Products
  const products = await Promise.all([
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catKopi.id, name: "Kopi Susu Gula Aren", description: "Kopi susu signature dengan gula aren asli Banten. Creamy dan manis alami.", price: 25000, stock: 100, imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400", variants: JSON.stringify([{name:"Ukuran",options:[{label:"Regular",priceAdd:0},{label:"Large",priceAdd:5000}]},{name:"Es",options:[{label:"Normal",priceAdd:0},{label:"Extra Es",priceAdd:0},{label:"Less Ice",priceAdd:0}]}]) } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catKopi.id, name: "Americano", description: "Double shot espresso dengan air panas. Bold dan clean.", price: 22000, stock: 100, imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400" } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catKopi.id, name: "Cappuccino", description: "Espresso dengan steamed milk dan foam tebal. Classic Italian style.", price: 28000, stock: 80, imageUrl: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400" } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catKopi.id, name: "V60 Single Origin", description: "Pour over V60 dengan biji single origin Toraja. Fruity dan floral.", price: 35000, stock: 30, imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400" } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catKopi.id, name: "Espresso", description: "Double shot espresso. Intense dan bold.", price: 18000, stock: 100, imageUrl: "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400" } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catNonKopi.id, name: "Matcha Latte", description: "Matcha premium Uji dengan susu segar. Creamy dan earthy.", price: 30000, stock: 50, imageUrl: "https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?w=400" } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catNonKopi.id, name: "Taro Latte", description: "Taro asli dengan susu. Manis natural dan creamy.", price: 28000, stock: 40, imageUrl: "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=400" } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catNonKopi.id, name: "Lemon Tea", description: "Teh hitam dengan perasan lemon segar. Refreshing!", price: 18000, stock: 60, imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400" } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catMakanan.id, name: "Croissant Butter", description: "Croissant premium dengan French butter. Flaky dan rich.", price: 22000, stock: 25, imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400" } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catMakanan.id, name: "Sandwich Club", description: "Triple decker sandwich dengan ayam, telur, dan sayuran segar.", price: 35000, stock: 20, imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400" } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catMakanan.id, name: "Toast Avocado", description: "Sourdough toast dengan avocado, telur, dan microgreens.", price: 32000, stock: 15, imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400" } }),
    prisma.product.create({ data: { tenantId: tenant.id, categoryId: catDessert.id, name: "Tiramisu", description: "Classic Italian tiramisu dengan mascarpone dan espresso.", price: 28000, stock: 12, imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400" } }),
  ]);

  // Promos
  await prisma.promo.create({ data: { tenantId: tenant.id, code: "HEMAT10", type: "PERCENT", value: 10, minOrder: 50000, maxDiscount: 15000 } });
  await prisma.promo.create({ data: { tenantId: tenant.id, code: "NEWUSER", type: "NOMINAL", value: 10000, minOrder: 30000 } });
  await prisma.promo.create({ data: { tenantId: tenant.id, code: "WEEKEND20", type: "PERCENT", value: 20, minOrder: 75000, maxDiscount: 25000, expiresAt: new Date("2026-12-31") } });

  // Create orders (simulate last 14 days)
  const customers = [
    { name: "Andi Pratama", phone: "081234567001" },
    { name: "Siti Rahayu", phone: "081234567002" },
    { name: "Dewi Lestari", phone: "081234567003" },
    { name: "Rudi Hartono", phone: "081234567004" },
    { name: "Maya Sari", phone: "081234567005" },
    { name: "Bimo Arya", phone: "081234567006" },
    { name: "Putri Ayu", phone: "081234567007" },
    { name: "Fajar Nugroho", phone: "081234567008" },
    { name: "Lina Marlina", phone: "081234567009" },
    { name: "Doni Setiawan", phone: "081234567010" },
  ];

  const statuses = ["COMPLETED", "COMPLETED", "COMPLETED", "PROCESSING", "PAID_MANUAL", "WAITING_PAYMENT"];
  const orderNumbers = new Set<string>();

  for (let day = 13; day >= 0; day--) {
    const ordersPerDay = Math.floor(Math.random() * 4) + 2; // 2-5 orders per day
    for (let j = 0; j < ordersPerDay; j++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const numItems = Math.floor(Math.random() * 3) + 1;
      const selectedProducts = [];
      for (let k = 0; k < numItems; k++) {
        const p = products[Math.floor(Math.random() * products.length)];
        selectedProducts.push({ product: p, quantity: Math.floor(Math.random() * 2) + 1 });
      }
      const subtotal = selectedProducts.reduce((s, i) => s + i.product.price * i.quantity, 0);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - day);
      orderDate.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60));

      let orderNum = randomOrderNumber();
      while (orderNumbers.has(orderNum)) orderNum = randomOrderNumber();
      orderNumbers.add(orderNum);

      const order = await prisma.order.create({
        data: {
          tenantId: tenant.id,
          orderNumber: orderNum,
          customerName: customer.name,
          customerPhone: customer.phone,
          deliveryType: Math.random() > 0.7 ? "DELIVERY" : "PICKUP",
          deliveryAddress: Math.random() > 0.7 ? "Jl. Merdeka No. " + Math.floor(Math.random() * 100) : null,
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

  // Outlet
  await prisma.outlet.create({ data: { tenantId: tenant.id, name: "Cabang Kemang", address: "Jl. Kemang Raya No. 15", phone: "081999000111" } });

  const totalOrders = await prisma.order.count({ where: { tenantId: tenant.id } });
  const totalLoyalty = await prisma.loyaltyCard.count({ where: { tenantId: tenant.id } });

  console.log("✅ Full seed complete!");
  console.log(`📋 Demo: owner@demo.com / password123 (OWNER)`);
  console.log(`📋 Demo: kasir@demo.com / password123 (CASHIER)`);
  console.log(`🏪 Storefront: /store/demo`);
  console.log(`📦 ${totalOrders} orders created`);
  console.log(`🏆 ${totalLoyalty} loyalty members`);
  console.log(`💎 Subscription: PRO (TRIAL)`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
