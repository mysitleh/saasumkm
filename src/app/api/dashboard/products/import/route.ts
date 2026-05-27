import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, unauthorized, badRequest } from "@/lib/api-handler";
import { sanitizeText } from "@/lib/utils";
import { checkProductLimit, PLAN_LABELS } from "@/lib/features";

/**
 * POST: Import produk dari CSV.
 * Format CSV: name,price,stock,category,description
 * Header row opsional (auto-detect).
 */
export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  const tenantId = session.user.tenantId;

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) throw badRequest("File CSV diperlukan.");
  if (file.size > 1024 * 1024) throw badRequest("Ukuran file maksimal 1 MB.");

  const text = await file.text();
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) throw badRequest("File kosong.");

  // Detect header
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes("name") || firstLine.includes("nama") || firstLine.includes("produk");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  if (dataLines.length === 0) throw badRequest("Tidak ada data produk.");
  if (dataLines.length > 200) throw badRequest("Maksimal 200 produk per import.");

  // Check product limit
  const limit = await checkProductLimit(tenantId);
  const currentCount = limit.current;
  const maxAllowed = limit.max;
  if (Number.isFinite(maxAllowed) && currentCount + dataLines.length > maxAllowed) {
    throw badRequest(
      `Paket ${PLAN_LABELS[limit.plan]} hanya mengizinkan ${maxAllowed} produk. Anda sudah punya ${currentCount}. Upgrade untuk import lebih banyak.`,
    );
  }

  // Get existing categories
  const existingCats = await prisma.category.findMany({ where: { tenantId }, select: { id: true, name: true } });
  const catMap = new Map(existingCats.map((c) => [c.name.toLowerCase(), c.id]));

  const results: { success: number; errors: string[] } = { success: 0, errors: [] };

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    const cols = parseCsvLine(line);
    const [name, priceStr, stockStr, categoryName, description] = cols;

    if (!name || !priceStr) {
      results.errors.push(`Baris ${i + 1}: nama dan harga wajib diisi.`);
      continue;
    }

    const price = parseInt(priceStr.replace(/[^0-9]/g, ""), 10);
    const stock = parseInt((stockStr || "0").replace(/[^0-9]/g, ""), 10);
    if (isNaN(price) || price < 0) {
      results.errors.push(`Baris ${i + 1}: harga tidak valid.`);
      continue;
    }

    // Resolve or create category
    let categoryId: string | null = null;
    if (categoryName && categoryName.trim()) {
      const catKey = categoryName.trim().toLowerCase();
      if (catMap.has(catKey)) {
        categoryId = catMap.get(catKey)!;
      } else {
        const newCat = await prisma.category.create({
          data: { name: sanitizeText(categoryName.trim(), 50), tenantId },
        });
        catMap.set(catKey, newCat.id);
        categoryId = newCat.id;
      }
    }

    await prisma.product.create({
      data: {
        tenantId,
        name: sanitizeText(name, 120),
        price,
        stock: isNaN(stock) ? 0 : stock,
        description: description ? sanitizeText(description, 2000) : null,
        categoryId,
      },
    });
    results.success++;
  }

  return NextResponse.json({
    success: true,
    imported: results.success,
    errors: results.errors.slice(0, 10),
    totalErrors: results.errors.length,
  });
});

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if ((ch === "," || ch === ";") && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}
