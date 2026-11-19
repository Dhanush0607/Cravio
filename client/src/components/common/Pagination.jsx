import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (item) =>
      item === 1 ||
      item === totalPages ||
      Math.abs(item - page) <= 1
  );

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="grid h-9 w-9 place-items-center rounded-lg border border-black/10 bg-white text-ink transition hover:bg-black/[0.03] disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((item, index) => {
        const previous = pages[index - 1];
        return (
          <span key={item} className="flex items-center gap-1.5">
            {previous && item - previous > 1 ? (
              <span className="px-1 text-sm text-ink-muted">…</span>
            ) : null}
            <button
              type="button"
              onClick={() => onChange(item)}
              aria-current={item === page ? 'page' : undefined}
              className={cn(
                'grid h-9 min-w-9 place-items-center rounded-lg px-2 text-sm font-semibold transition',
                item === page
                  ? 'bg-ink text-white'
                  : 'border border-black/10 bg-white text-ink hover:bg-black/[0.03]'
              )}
            >
              {item}
            </button>
          </span>
        );
      })}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="grid h-9 w-9 place-items-center rounded-lg border border-black/10 bg-white text-ink transition hover:bg-black/[0.03] disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
