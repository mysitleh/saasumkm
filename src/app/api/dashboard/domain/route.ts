import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { promises as dns } from "node:dns";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, unauthorized, forbidden, badRequest, conflict } from "@/lib/api-handler";

const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(\.[a-z0-9-]{1,63})+$/i;

const schema = z.object({
  domain: z.string().min(4).max(253).refine((d) => DOMAIN_RE.test(d), "Format domain tidak valid"),
});

const ROOT = process.env.UMKMSTORE_ROOT_DOMAIN ?? "umkmstore.id";

/**
 * GET — return current custom domain state + DNS instructions.
 */
export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: {
      slug: true,
      customDomain: true,
      customDomainStatus: true,
      customDomainVerifyToken: true,
      customDomainVerifiedAt: true,
    },
  });
  if (!tenant) throw unauthorized();

  return NextResponse.json({
    slug: tenant.slug,
    domain: tenant.customDomain,
    status: tenant.customDomainStatus ?? "NONE",
    verifyToken: tenant.customDomainVerifyToken,
    verifiedAt: tenant.customDomainVerifiedAt,
    rootDomain: ROOT,
  });
});

/**
 * POST — claim a custom domain; generates a TXT verify token. The
 * tenant adds the token to their DNS, then calls /verify to confirm.
 */
export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  if (session.user.role !== "OWNER") throw forbidden();
  const body = schema.parse(await req.json());
  const domain = body.domain.toLowerCase();

  // Block reserved suffixes
  if (domain.endsWith(`.${ROOT}`) || domain === ROOT) {
    throw badRequest(`Domain tidak boleh berada di bawah ${ROOT}.`);
  }

  // Block duplicate claim
  const existing = await prisma.tenant.findUnique({ where: { customDomain: domain } });
  if (existing && existing.id !== session.user.tenantId) {
    throw conflict("Domain ini sudah diklaim oleh tenant lain.");
  }

  const token = `umkmstore-verify-${randomBytes(8).toString("hex")}`;
  const tenant = await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: {
      customDomain: domain,
      customDomainStatus: "PENDING",
      customDomainVerifyToken: token,
      customDomainVerifiedAt: null,
    },
  });

  return NextResponse.json({
    domain,
    status: tenant.customDomainStatus,
    verifyToken: token,
    instructions: {
      cname: { host: `@ atau www`, value: `cname.${ROOT}` },
      txt: { host: `_umkmstore-verify`, value: token },
    },
  });
});

/**
 * DELETE — release custom domain.
 */
export const DELETE = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  if (session.user.role !== "OWNER") throw forbidden();
  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: {
      customDomain: null,
      customDomainStatus: "NONE",
      customDomainVerifyToken: null,
      customDomainVerifiedAt: null,
    },
  });
  return NextResponse.json({ success: true });
});

/**
 * PATCH — verify TXT record. Looks up `_umkmstore-verify.<domain>` and
 * checks that the token matches what we issued. Marks status VERIFIED.
 */
export const PATCH = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user.tenantId) throw unauthorized();
  if (session.user.role !== "OWNER") throw forbidden();

  const tenant = await prisma.tenant.findUnique({ where: { id: session.user.tenantId } });
  if (!tenant?.customDomain || !tenant.customDomainVerifyToken) {
    throw badRequest("Domain belum di-claim.");
  }

  let txtValues: string[] = [];
  try {
    const records = await dns.resolveTxt(`_umkmstore-verify.${tenant.customDomain}`);
    txtValues = records.flat();
  } catch {
    // dns lookup failed — treat as not yet propagated
  }

  const ok = txtValues.includes(tenant.customDomainVerifyToken);
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      customDomainStatus: ok ? "VERIFIED" : "FAILED",
      customDomainVerifiedAt: ok ? new Date() : null,
    },
  });

  return NextResponse.json({
    verified: ok,
    status: ok ? "VERIFIED" : "FAILED",
    foundRecords: txtValues,
    expectedToken: tenant.customDomainVerifyToken,
  });
});
