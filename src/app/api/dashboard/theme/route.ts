import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, unauthorized, forbidden } from "@/lib/api-handler";
import { isValidHex, FONT_OPTIONS } from "@/lib/theme-runtime";

const FONT_VALUES = FONT_OPTIONS.map((f) => f.value) as [string, ...string[]];

const schema = z.object({
  themeMode: z.enum(["light", "dark", "auto"]).optional(),
  themePrimary: z.string().refine(isValidHex, "Hex tidak valid").optional().or(z.literal("")),
  themeAccent: z.string().refine(isValidHex, "Hex tidak valid").optional().or(z.literal("")),
  themeSurface: z.string().refine(isValidHex, "Hex tidak valid").optional().or(z.literal("")),
  themeInk: z.string().refine(isValidHex, "Hex tidak valid").optional().or(z.literal("")),
  themeRadius: z.number().int().min(0).max(32).optional(),
  themeFont: z.enum(FONT_VALUES).optional(),
});

/** Save a tenant's custom theme (Theme Builder GUI submits here). */
export const PUT = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  if (session.user.role !== "OWNER") throw forbidden("Hanya pemilik yang bisa mengubah tema.");
  const body = schema.parse(await req.json());

  const tenant = await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: {
      themeMode: body.themeMode ?? undefined,
      themePrimary: body.themePrimary || null,
      themeAccent: body.themeAccent || null,
      themeSurface: body.themeSurface || null,
      themeInk: body.themeInk || null,
      themeRadius: body.themeRadius ?? undefined,
      themeFont: body.themeFont ?? undefined,
    },
  });

  return NextResponse.json({
    success: true,
    theme: {
      mode: tenant.themeMode,
      primary: tenant.themePrimary,
      accent: tenant.themeAccent,
      surface: tenant.themeSurface,
      ink: tenant.themeInk,
      radius: tenant.themeRadius,
      font: tenant.themeFont,
    },
  });
});

/** Reset to defaults (NULL all custom fields → fall back to legacy preset). */
export const DELETE = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  if (session.user.role !== "OWNER") throw forbidden();

  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: {
      themePrimary: null,
      themeAccent: null,
      themeSurface: null,
      themeInk: null,
      themeRadius: 12,
      themeFont: "Inter",
      themeMode: "light",
    },
  });

  return NextResponse.json({ success: true });
});
