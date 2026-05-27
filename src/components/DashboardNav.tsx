"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  House,
  Receipt,
  Package,
  Tag,
  UsersThree,
  Trophy,
  Lightning,
  Storefront,
  IdentificationBadge,
  ChartLine,
  CreditCard,
  GearSix,
  SignOut,
  ArrowSquareOut,
  DotsThree,
  X,
  Sparkle,
  Palette,
  Globe,
  type Icon,
} from "@phosphor-icons/react";
import { UStoreMark } from "@/components/icons";
import { GLYPH } from "@/lib/glyphs";
import type { Session } from "next-auth";

type Role = "OWNER" | "CASHIER";

interface NavItem {
  href: string;
  label: string;
  icon: Icon;
  roles: Role[];
  featured?: boolean;
}

interface NavGroup {
  /** All-caps group label rendered as eyebrow above items. */
  label: string;
  glyph: string;
  items: NavItem[];
}

/**
 * Categorized nav structure.
 * - "Operasi"   : daily transactional work (Dashboard, Pesanan, POS)
 * - "Katalog"   : selling surface mgmt (Produk, Promo)
 * - "Pertumbuhan": growth/insight tools (Insights, Analytics, Pelanggan, Loyalty)
 * - "Organisasi": tenant config (Outlet, Staff, Billing, Pengaturan)
 *
 * Spacers + section eyebrows make the sidebar scannable instead of a
 * flat 12-item dump. Mobile drawer keeps the same grouping.
 */
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Operasi",
    glyph: GLYPH.hexFilled,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: House, roles: ["OWNER", "CASHIER"] },
      { href: "/dashboard/orders", label: "Pesanan", icon: Receipt, roles: ["OWNER", "CASHIER"] },
      { href: "/dashboard/pos", label: "POS", icon: Lightning, roles: ["OWNER", "CASHIER"] },
    ],
  },
  {
    label: "Katalog",
    glyph: GLYPH.hex,
    items: [
      { href: "/dashboard/products", label: "Produk", icon: Package, roles: ["OWNER"] },
      { href: "/dashboard/promos", label: "Promo", icon: Tag, roles: ["OWNER"] },
    ],
  },
  {
    label: "Pertumbuhan",
    glyph: GLYPH.sparkle,
    items: [
      { href: "/dashboard/insights", label: "Insights", icon: Sparkle, roles: ["OWNER"], featured: true },
      { href: "/dashboard/analytics", label: "Analytics", icon: ChartLine, roles: ["OWNER"] },
      { href: "/dashboard/customers", label: "Pelanggan", icon: UsersThree, roles: ["OWNER"] },
      { href: "/dashboard/loyalty", label: "Loyalty", icon: Trophy, roles: ["OWNER"] },
    ],
  },
  {
    label: "Organisasi",
    glyph: GLYPH.hexRing,
    items: [
      { href: "/dashboard/outlets", label: "Outlet", icon: Storefront, roles: ["OWNER"] },
      { href: "/dashboard/staff", label: "Staff", icon: IdentificationBadge, roles: ["OWNER"] },
      { href: "/dashboard/billing", label: "Billing", icon: CreditCard, roles: ["OWNER"] },
      { href: "/dashboard/settings", label: "Pengaturan", icon: GearSix, roles: ["OWNER"] },
    ],
  },
  {
    label: "Branding",
    glyph: GLYPH.diamond,
    items: [
      { href: "/dashboard/theme", label: "Theme Builder", icon: Palette, roles: ["OWNER"] },
      { href: "/dashboard/domain", label: "Custom Domain", icon: Globe, roles: ["OWNER"] },
    ],
  },
];

function filterGroups(groups: NavGroup[], role: Role): NavGroup[] {
  return groups
    .map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role)) }))
    .filter((g) => g.items.length > 0);
}

function flatten(groups: NavGroup[]): NavItem[] {
  return groups.flatMap((g) => g.items);
}

export default function DashboardNav({ session }: { session: Session }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const role = session.user.role as Role;
  const groups = filterGroups(NAV_GROUPS, role);
  const flat = flatten(groups);
  const mobileMain = flat.slice(0, 3);

  return (
    <>
      {/* Header — nav-bar-light */}
      <header
        className="sticky top-0 z-40"
        style={{ background: "var(--canvas-light)", borderBottom: "1px solid var(--hairline-light)", height: 56 }}
      >
        <div className="flex items-center justify-between gap-3 px-4 md:px-6 h-full">
          <div className="flex items-center gap-3 min-w-0">
            <UStoreMark size="sm" />
            <span className="hidden sm:inline" style={{ color: "var(--shade-30)" }}>|</span>
            <span className="caption hidden sm:inline truncate" style={{ color: "var(--shade-50)" }}>
              {session.user.name}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {session.user.tenantSlug && (
              <Link
                href={`/store/${session.user.tenantSlug}`}
                target="_blank"
                className="caption hidden sm:inline-flex items-center gap-1.5 hover:underline"
                style={{ color: "var(--ink)" }}
              >
                Lihat Toko <ArrowSquareOut size={13} weight="regular" />
              </Link>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="caption inline-flex items-center gap-1.5"
              style={{ color: "var(--shade-50)" }}
            >
              <SignOut size={16} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav (3 main items + More button) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
        style={{
          background: "rgba(255,255,255,0.95)",
          borderTop: "1px solid var(--hairline-light)",
          backdropFilter: "blur(12px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="flex">
          {mobileMain.map((item) => {
            const ActiveIcon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center py-2.5 gap-0.5 micro min-w-0"
                style={{ color: active ? "var(--ink)" : "var(--shade-50)" }}
              >
                <ActiveIcon size={20} weight={active ? "fill" : "regular"} />
                <span className="truncate max-w-full">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className="flex-1 flex flex-col items-center py-2.5 gap-0.5 micro"
            style={{ color: moreOpen ? "var(--ink)" : "var(--shade-50)" }}
          >
            <DotsThree size={20} weight="bold" />
            Lainnya
          </button>
        </div>
      </nav>

      {/* Mobile "More" drawer — keeps the categorized grouping */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto"
            style={{
              background: "var(--canvas-light)",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: "20px 20px 32px",
              paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="heading-sm">Menu Lainnya</h3>
              <button onClick={() => setMoreOpen(false)} aria-label="Tutup">
                <X size={18} weight="bold" />
              </button>
            </div>
            <div className="space-y-5">
              {groups.map((group) => (
                <div key={group.label}>
                  <p className="eyebrow-cap mb-3">
                    <span className="glyph">{group.glyph}</span> {group.label}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {group.items.map((item) => {
                      const ActiveIcon = item.icon;
                      const active = pathname === item.href || pathname.startsWith(item.href + "/");
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMoreOpen(false)}
                          className="flex flex-col items-center justify-center gap-1.5 micro text-center min-w-0"
                          style={{
                            padding: "12px 6px",
                            background: active ? "var(--aloe-10)" : "transparent",
                            color: "var(--ink)",
                            border: active ? "1px solid var(--aloe-10)" : "1px solid var(--hairline-light)",
                            borderRadius: 12,
                            minHeight: 72,
                            fontSize: 11,
                            lineHeight: 1.2,
                          }}
                        >
                          <ActiveIcon size={20} weight={active ? "fill" : "regular"} />
                          <span className="truncate max-w-full">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar desktop — categorized with eyebrow group heads + spacers */}
      <aside
        className="hidden md:flex fixed left-0 flex-col z-30 overflow-y-auto"
        style={{
          top: 56,
          bottom: 0,
          width: 224,
          background: "var(--canvas-light)",
          borderRight: "1px solid var(--hairline-light)",
          padding: "20px 12px",
        }}
        aria-label="Navigasi utama"
      >
        {groups.map((group, gIdx) => (
          <div key={group.label} style={{ marginTop: gIdx === 0 ? 0 : 18 }}>
            <p
              className="eyebrow-cap"
              style={{
                paddingLeft: 12,
                paddingRight: 12,
                marginBottom: 8,
                color: "var(--shade-40)",
                fontSize: 10.5,
                letterSpacing: "0.84px",
              }}
            >
              <span className="glyph" style={{ marginRight: 6, color: "var(--shade-40)" }}>
                {group.glyph}
              </span>
              {group.label}
            </p>
            <ul className="flex flex-col" style={{ gap: 2 }}>
              {group.items.map((item) => {
                const ActiveIcon = item.icon;
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const featured = item.featured && !active;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 caption transition-colors"
                      style={{
                        padding: "9px 12px",
                        background: active
                          ? "var(--aloe-10)"
                          : featured
                            ? "var(--pistachio-10)"
                            : "transparent",
                        color: "var(--ink)",
                        fontWeight: active ? 550 : 500,
                        borderRadius: 9999,
                        minHeight: 36,
                      }}
                    >
                      <ActiveIcon size={16} weight={active ? "fill" : "regular"} />
                      <span className="truncate flex-1">{item.label}</span>
                      {featured && (
                        <span
                          className="micro tabular flex-shrink-0"
                          style={{ color: "var(--shade-60)", letterSpacing: "0.4px" }}
                        >
                          BI
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {/* Spacer hairline between groups except after the last one */}
            {gIdx < groups.length - 1 && (
              <hr
                aria-hidden="true"
                style={{
                  border: 0,
                  borderTop: "1px solid var(--hairline-light)",
                  margin: "18px 12px 0",
                }}
              />
            )}
          </div>
        ))}
      </aside>
    </>
  );
}
