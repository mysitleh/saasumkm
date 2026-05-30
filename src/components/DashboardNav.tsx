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
  BellRinging,
  MagnifyingGlass,
  type Icon,
} from "@phosphor-icons/react";
import { UStoreMark } from "@/components/icons";
import { GLYPH } from "@/lib/glyphs";
import CommandPalette from "@/components/ui/CommandPalette";
import NotificationBell from "@/components/NotificationBell";
import type { TickerItem } from "@/components/MarqueeTicker";
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
  label: string;
  glyph: string;
  items: NavItem[];
}

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
      { href: "/dashboard/notifications", label: "Notifikasi", icon: BellRinging, roles: ["OWNER"] },
      { href: "/dashboard/billing", label: "Billing", icon: CreditCard, roles: ["OWNER"] },
      { href: "/dashboard/settings", label: "Pengaturan", icon: GearSix, roles: ["OWNER"] },
    ],
  },
  {
    label: "Branding",
    glyph: GLYPH.diamond,
    items: [
      { href: "/dashboard/theme", label: "Theme Builder", icon: Palette, roles: ["OWNER"] },
      { href: "/dashboard/template", label: "Template", icon: Sparkle, roles: ["OWNER"] },
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

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function DashboardNav({
  session,
  isAdmin = false,
  notifications = [],
  alertCount = 0,
}: {
  session: Session;
  isAdmin?: boolean;
  notifications?: TickerItem[];
  alertCount?: number;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const role = session.user.role as Role;
  const groups = filterGroups(NAV_GROUPS, role);
  const flat = flatten(groups);
  const mobileMain = flat.slice(0, 3);

  return (
    <>
      <CommandPalette role={role} />

      {/* Header — nav-bar-light */}
      <header
        className="sticky top-0 z-40"
        style={{ background: "var(--canvas-light)", borderBottom: "1px solid var(--hairline-light)", height: 56 }}
      >
        <div className="flex items-center justify-between gap-3 px-4 md:px-6 h-full">
          <div className="flex items-center gap-3 min-w-0">
            <UStoreMark size="sm" />
            <span className="hidden md:inline" style={{ color: "var(--hairline-light)" }}>│</span>
            <span className="caption hidden md:inline truncate" style={{ color: "var(--shade-50)" }}>
              {session.user.name}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* ⌘K search trigger */}
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
              className="ums-search-trigger hidden sm:flex items-center gap-2"
              style={{
                background: "var(--canvas-cream)",
                border: "1px solid var(--hairline-light)",
                borderRadius: 9999,
                padding: "6px 8px 6px 12px",
                color: "var(--shade-50)",
                fontSize: 13,
                cursor: "pointer",
              }}
              aria-label="Buka pencarian cepat"
            >
              <MagnifyingGlass size={14} />
              <span className="hidden lg:inline">Cari…</span>
              <kbd
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  background: "var(--canvas-light)",
                  border: "1px solid var(--hairline-light)",
                  borderRadius: 5,
                  padding: "1px 5px",
                }}
              >
                ⌘K
              </kbd>
            </button>
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
            <NotificationBell items={notifications} alertCount={alertCount} />
            {isAdmin && (
              <Link
                href="/admin"
                className="caption hidden sm:inline-flex items-center gap-1.5"
                style={{
                  color: "var(--on-primary)",
                  background: "var(--iso-violet)",
                  padding: "4px 12px",
                  borderRadius: 9999,
                  fontWeight: 600,
                }}
              >
                <span className="glyph">{GLYPH.sparkle}</span> Admin
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

      {/* Mobile bottom nav */}
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
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center py-2.5 gap-0.5 micro min-w-0 ums-tap"
                style={{ color: active ? "var(--iso-violet)" : "var(--shade-50)" }}
              >
                <ActiveIcon size={20} weight={active ? "fill" : "regular"} />
                <span className="truncate max-w-full">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className="flex-1 flex flex-col items-center py-2.5 gap-0.5 micro ums-tap"
            style={{ color: moreOpen ? "var(--ink)" : "var(--shade-50)" }}
          >
            <DotsThree size={20} weight="bold" />
            Lainnya
          </button>
        </div>
      </nav>

      {/* Mobile "More" drawer */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 ums-fade"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto ums-sheet"
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
                      const active = isActivePath(pathname, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMoreOpen(false)}
                          className="flex flex-col items-center justify-center gap-1.5 micro text-center min-w-0 ums-tap"
                          style={{
                            padding: "12px 6px",
                            background: active ? "var(--iso-violet-soft)" : "transparent",
                            color: active ? "var(--iso-violet-deep)" : "var(--ink)",
                            border: active ? "1px solid var(--iso-violet)" : "1px solid var(--hairline-light)",
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

      {/* Sidebar desktop — minimalist, separators, active-bar indicator */}
      <aside
        className="hidden md:flex fixed left-0 flex-col z-30 overflow-y-auto ums-sidebar"
        style={{
          top: 56,
          bottom: 0,
          width: 224,
          background: "var(--canvas-light)",
          borderRight: "1px solid var(--hairline-light)",
          padding: "16px 12px 24px",
        }}
        aria-label="Navigasi utama"
      >
        {groups.map((group, gIdx) => (
          <div key={group.label} style={{ marginTop: gIdx === 0 ? 0 : 14 }}>
            {/* Group separator + label */}
            <div className="flex items-center gap-2" style={{ padding: "0 12px", marginBottom: 8 }}>
              <span className="eyebrow-cap" style={{ color: "var(--shade-40)", fontSize: 10, letterSpacing: "0.9px", whiteSpace: "nowrap" }}>
                {group.label}
              </span>
              <span style={{ flex: 1, height: 1, background: "var(--hairline-light)" }} aria-hidden="true" />
            </div>

            <ul className="flex flex-col" style={{ gap: 1 }}>
              {group.items.map((item) => {
                const ActiveIcon = item.icon;
                const active = isActivePath(pathname, item.href);
                const featured = item.featured && !active;
                return (
                  <li key={item.href} style={{ position: "relative" }}>
                    {/* active indicator bar */}
                    {active && (
                      <span
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 3,
                          height: 18,
                          borderRadius: 9999,
                          background: "var(--iso-violet)",
                        }}
                      />
                    )}
                    <Link
                      href={item.href}
                      className="ums-navlink flex items-center gap-3 caption"
                      data-active={active}
                      style={{
                        padding: "9px 12px",
                        background: active
                          ? "var(--iso-violet-soft)"
                          : featured
                            ? "var(--tint-lemon)"
                            : "transparent",
                        color: active ? "var(--iso-violet-deep)" : "var(--ink)",
                        fontWeight: active ? 600 : 500,
                        borderRadius: 10,
                        minHeight: 38,
                      }}
                    >
                      <ActiveIcon size={17} weight={active ? "fill" : "regular"} />
                      <span className="truncate flex-1">{item.label}</span>
                      {featured && (
                        <span
                          className="micro tabular flex-shrink-0"
                          style={{
                            color: "var(--ink)",
                            letterSpacing: "0.4px",
                            background: "var(--canvas-light)",
                            borderRadius: 9999,
                            padding: "1px 7px",
                            fontSize: 10,
                          }}
                        >
                          BI
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Footer tip */}
        <div style={{ marginTop: "auto", paddingTop: 16 }}>
          <div
            className="flex items-center gap-2 micro"
            style={{ padding: "8px 12px", color: "var(--shade-50)", background: "var(--canvas-cream)", borderRadius: 10 }}
          >
            <MagnifyingGlass size={13} />
            <span>Tekan</span>
            <kbd style={{ fontFamily: "var(--font-mono)", fontSize: 10, border: "1px solid var(--hairline-light)", borderRadius: 4, padding: "1px 5px", background: "var(--canvas-light)" }}>⌘K</kbd>
          </div>
        </div>
      </aside>
    </>
  );
}
