import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_PREFIXES = [
  "/api/auth",
  "/api/health",
  "/api/webhooks",
  "/login",
  "/register",
  "/store/",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // CSRF mitigation: tolak mutating cross-origin request ke /api/* (kecuali webhook & auth).
  const method = req.method.toUpperCase();
  const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const isApi = pathname.startsWith("/api/");
  const isAuthApi = pathname.startsWith("/api/auth");
  const isWebhook = pathname.startsWith("/api/webhooks");
  if (isApi && isMutating && !isAuthApi && !isWebhook) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host) {
      try {
        const o = new URL(origin);
        if (o.host !== host) {
          return new NextResponse("Forbidden (cross-origin)", { status: 403 });
        }
      } catch {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
  }

  // Public paths: allow.
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (pathname === "/" || pathname === "/api") return NextResponse.next();

  // Dashboard guard.
  if (pathname.startsWith("/dashboard")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    if (!["OWNER", "CASHIER"].includes(session.user.role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // /api/dashboard guard.
  if (pathname.startsWith("/api/dashboard")) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
