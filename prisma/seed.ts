import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const libsqlUrl = dbUrl.startsWith("file:./") ? `file:${dbUrl.slice(7)}` : dbUrl.startsWith("file:") ? dbUrl : `file:${dbUrl}`;
const adapter = new PrismaLibSql({ url: libsqlUrl });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🌱 Seeding...");
  const tenant = await prisma.tenant.upsert({ where: { slug:"demo" }, update: {}, create: { name:"Kedai Kopi Demo", slug:"demo", description:"Kedai kopi terbaik di kota.", address:"Jl. Contoh No. 1, Jakarta", phone:"08123456789" } });
  const hash = await bcrypt.hash("password123", 12);
  await prisma.user.upsert({ where: { email:"owner@demo.com" }, update: {}, create: { name:"Budi Santoso", email:"owner@demo.com", password:hash, role:"OWNER", tenantId:tenant.id } });
  const cats = await Promise.all([
    prisma.category.upsert({ where:{id:"cat-kopi"}, update:{}, create:{id:"cat-kopi",name:"Kopi",tenantId:tenant.id} }),
    prisma.category.upsert({ where:{id:"cat-nonkopi"}, update:{}, create:{id:"cat-nonkopi",name:"Non-Kopi",tenantId:tenant.id} }),
    prisma.category.upsert({ where:{id:"cat-makanan"}, update:{}, create:{id:"cat-makanan",name:"Makanan",tenantId:tenant.id} }),
  ]);
  const products = [
    {id:"prod-kopi-susu",name:"Kopi Susu Gula Aren",description:"Kopi susu dengan gula aren asli",price:25000,stock:100,categoryId:cats[0].id,imageUrl:"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400"},
    {id:"prod-americano",name:"Americano",description:"Espresso dengan air panas",price:20000,stock:100,categoryId:cats[0].id,imageUrl:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400"},
    {id:"prod-cappuccino",name:"Cappuccino",description:"Espresso dengan steamed milk",price:28000,stock:100,categoryId:cats[0].id,imageUrl:"https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400"},
    {id:"prod-matcha",name:"Matcha Latte",description:"Matcha premium dengan susu segar",price:30000,stock:50,categoryId:cats[1].id,imageUrl:"https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?w=400"},
    {id:"prod-croissant",name:"Croissant",description:"Croissant butter fresh dari oven",price:18000,stock:30,categoryId:cats[2].id,imageUrl:"https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400"},
    {id:"prod-sandwich",name:"Sandwich Tuna",description:"Sandwich tuna mayo dengan sayuran",price:22000,stock:20,categoryId:cats[2].id,imageUrl:"https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400"},
  ];
  for (const p of products) await prisma.product.upsert({ where:{id:p.id}, update:{}, create:{...p,tenantId:tenant.id} });
  await prisma.promo.upsert({ where:{tenantId_code:{tenantId:tenant.id,code:"HEMAT10"}}, update:{}, create:{tenantId:tenant.id,code:"HEMAT10",type:"PERCENT",value:10,minOrder:50000,maxDiscount:15000} });
  console.log("✅ Seed complete!");
  console.log("📋 Demo: owner@demo.com / password123 | /store/demo");
}
main().catch(console.error).finally(()=>prisma.$disconnect());
