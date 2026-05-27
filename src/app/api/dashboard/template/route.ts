import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, unauthorized, forbidden } from "@/lib/api-handler";

const schema = z.object({
  layoutTemplate: z.enum(["classic", "magazine", "minimal", "showcase"]).optional(),
  buttonStyle: z.enum(["pill", "rounded", "square", "ghost"]).optional(),
  iconStyle: z.enum(["regular", "fill", "duotone", "thin", "bold"]).optional(),
  categoryStyle: z.enum(["chips", "grid", "tabs", "sidebar"]).optional(),
  heroEnabled: z.boolean().optional(),
  heroImageUrl: z.string().url().optional().or(z.literal("")),
  heroHeadline: z.string().max(120).optional().or(z.literal("")),
  heroSubheadline: z.string().max(240).optional().or(z.literal("")),
  heroCtaLabel: z.string().max(40).optional().or(z.literal("")),
  carouselEnabled: z.boolean().optional(),
  carouselProductIds: z.array(z.string().cuid()).max(12).optional(),
});

/** PUT — save tenant template config. */
export const PUT = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  if (session.user.role !== "OWNER") throw forbidden();

  const body = schema.parse(await req.json());
  const tenant = await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: {
      layoutTemplate: body.layoutTemplate ?? undefined,
      buttonStyle: body.buttonStyle ?? undefined,
      iconStyle: body.iconStyle ?? undefined,
      categoryStyle: body.categoryStyle ?? undefined,
      heroEnabled: body.heroEnabled ?? undefined,
      heroImageUrl: body.heroImageUrl === undefined ? undefined : body.heroImageUrl || null,
      heroHeadline: body.heroHeadline === undefined ? undefined : body.heroHeadline || null,
      heroSubheadline: body.heroSubheadline === undefined ? undefined : body.heroSubheadline || null,
      heroCtaLabel: body.heroCtaLabel === undefined ? undefined : body.heroCtaLabel || null,
      carouselEnabled: body.carouselEnabled ?? undefined,
      carouselProductIds:
        body.carouselProductIds === undefined ? undefined : JSON.stringify(body.carouselProductIds),
    },
  });

  return NextResponse.json({ success: true, tenant });
});
