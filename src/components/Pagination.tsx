import Link from "next/link";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";

/**
 * Pagination — robust, modern, eye-catching page navigator.
 *
 * Features:
 *  - Windowed page numbers with ellipsis (handles 1000s of pages gracefully)
 *  - Always shows first + last page
 *  - Prev / Next arrows (disabled at bounds)
 *  - Result-range summary ("Menampilkan 21–40 dari 176")
 *  - Active page in violet; pill-shaped, soft shadow
 *
 * Server-component friendly: caller provides `hrefFor(page)` so it works with
 * any query-string scheme.
 */
interface Props {
  currentPage: number;
  totalPages: number;
  /** Build the href for a given page number. */
  hrefFor: (page: number) => string;
  /** Optional totals for the result-range summary. */
  totalItems?: number;
  pageSize?: number;
  /** How many page links to show around the current page. */
  siblings?: number;
}

function range(start: number, end: number): number[] {
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
}

/** Compute the page list with ellipsis sentinels (-1 = gap). */
function buildPages(current: number, total: number, siblings: number): number[] {
  const totalNumbers = siblings * 2 + 5; // first, last, current, 2 ellipsis
  if (total <= totalNumbers) return range(1, total);

  const left = Math.max(current - siblings, 1);
  const right = Math.min(current + siblings, total);
  const showLeftDots = left > 2;
  const showRightDots = right < total - 1;

  if (!showLeftDots && showRightDots) {
    return [...range(1, siblings * 2 + 3), -1, total];
  }
  if (showLeftDots && !showRightDots) {
    return [1, -1, ...range(total - (siblings * 2 + 2), total)];
  }
  return [1, -1, ...range(left, right), -2, total];
}

export default function Pagination({ currentPage, totalPages, hrefFor, totalItems, pageSize, siblings = 1 }: Props) {
  if (totalPages <= 1) return null;
  const pages = buildPages(currentPage, totalPages, siblings);
  const atStart = currentPage <= 1;
  const atEnd = currentPage >= totalPages;

  const from = pageSize ? (currentPage - 1) * pageSize + 1 : null;
  const to = pageSize && totalItems ? Math.min(currentPage * pageSize, totalItems) : null;

  return (
    <nav className="pagination" aria-label="Navigasi halaman">
      {from && to && totalItems != null && (
        <p className="pagination-summary tabular">
          Menampilkan <strong>{from}–{to}</strong> dari <strong>{totalItems}</strong>
        </p>
      )}

      <div className="pagination-bar">
        {/* Prev */}
        {atStart ? (
          <span className="pagination-btn is-disabled" aria-hidden="true"><CaretLeft size={15} weight="bold" /></span>
        ) : (
          <Link href={hrefFor(currentPage - 1)} className="pagination-btn" aria-label="Halaman sebelumnya" rel="prev">
            <CaretLeft size={15} weight="bold" />
          </Link>
        )}

        {/* Numbers */}
        {pages.map((p, i) =>
          p < 0 ? (
            <span key={`gap-${i}`} className="pagination-gap" aria-hidden="true">…</span>
          ) : p === currentPage ? (
            <span key={p} className="pagination-btn is-active tabular" aria-current="page">{p}</span>
          ) : (
            <Link key={p} href={hrefFor(p)} className="pagination-btn tabular" aria-label={`Halaman ${p}`}>
              {p}
            </Link>
          ),
        )}

        {/* Next */}
        {atEnd ? (
          <span className="pagination-btn is-disabled" aria-hidden="true"><CaretRight size={15} weight="bold" /></span>
        ) : (
          <Link href={hrefFor(currentPage + 1)} className="pagination-btn" aria-label="Halaman berikutnya" rel="next">
            <CaretRight size={15} weight="bold" />
          </Link>
        )}
      </div>
    </nav>
  );
}
