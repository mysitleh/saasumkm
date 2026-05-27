/**
 * Brand glyph set — Unicode geometric marks that read as editorial signature
 * rather than mainstream emoji. Used in eyebrows, KPI markers, and section
 * heads across the system.
 *
 * Design rationale: design.md prescribes a typographic, editorial brand
 * voice. Mainstream emojis (🚀 📊 💰 🔔) compete with the thin display
 * type and break the magazine feel. Geometric Unicode marks sit naturally
 * in `eyebrow-cap` text and respect the `ss03` stylistic set.
 */

export const GLYPH = {
  // Module / system markers
  hex: "⬡",          // module / cluster (outlets, tenants)
  hexFilled: "⬢",    // primary module marker (dashboard, products)
  hexRing: "⏣",      // hub / integration (outlet-network)
  hexMolecule: "⌬",  // system-wide / setup
  diamond: "◈",      // feature accent (revenue, KPI)
  diamondThin: "◊",  // list bullet
  circle: "◉",       // active / selected state
  circleRing: "◎",   // focus / optional
  asterism: "⊹",     // ornament (eyebrow terminator)
  lozenge: "⟡",      // tag / chip ornament

  // Insight / featured
  sparkle: "✦",      // featured / AI / insight
  sparkleOpen: "✧",  // secondary insight
  premium: "❖",      // premium tier marker

  // Trend / direction (KPI deltas)
  up: "▲",
  down: "▼",
  upRight: "↗",
  downRight: "↘",
  arrow: "→",
  arrowSlim: "▸",

  // Progress states
  qFull: "●",
  qThree: "◕",
  qHalf: "◑",
  qOne: "◔",
  qEmpty: "○",

  // Checklist
  done: "▣",
  pending: "□",

  // Editorial / fine-print marks
  endMark: "∎",      // end-of-section block
  therefore: "∴",    // callout / conclusion
  because: "∵",      // reason / footnote
  section: "§",      // chapter
  reference: "※",    // cross-reference / annotation

  // Domain-flavour
  pickup: "⬡",       // ambil di toko
  delivery: "→",     // diantar

  // Spacers
  bullet: "·",
  dot: "•",
} as const;

/** Convenience grouping for KPI cards (dashboard home / insights). */
export const KPI_GLYPH = {
  revenue: GLYPH.diamond,
  orders: GLYPH.hexFilled,
  pending: GLYPH.circleRing,
  products: GLYPH.hex,
  customers: GLYPH.lozenge,
  loyalty: GLYPH.premium,
  forecast: GLYPH.sparkle,
  ai: GLYPH.sparkle,
} as const;

export type Glyph = typeof GLYPH[keyof typeof GLYPH];
