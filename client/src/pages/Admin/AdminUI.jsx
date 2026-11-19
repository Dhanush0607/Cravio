import { Skeleton } from '../../components/common/Feedback.jsx';
import { Pagination } from '../../components/common/Pagination.jsx';
import { cn } from '../../utils/cn.js';

export function AdminPageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminCard({ children, className }) {
  return (
    <div className={cn('rounded-2xl border border-black/[0.06] bg-white shadow-card', className)}>
      {children}
    </div>
  );
}

const tones = {
  brand: 'bg-brand-50 text-brand-600',
  green: 'bg-green-50 text-green-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  violet: 'bg-violet-50 text-violet-600',
  gray: 'bg-slate-100 text-slate-600',
};

export function StatCard({ icon: Icon, label, value, hint, tone = 'brand' }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-ink-muted">{label}</p>
          <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink">{value}</p>
        </div>
        {Icon ? (
          <span className={cn('grid h-10 w-10 place-items-center rounded-xl', tones[tone])}>
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>
      {hint ? <p className="mt-2 text-[11px] leading-4 text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function AdminToolbar({ children, className }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2.5 border-b border-black/[0.06] p-3 sm:flex-row sm:items-center sm:p-4',
        className
      )}
    >
      {children}
    </div>
  );
}

export function AdminTableWrap({ children }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function AdminTable({ children, className }) {
  return <table className={cn('w-full min-w-[720px] text-left text-sm', className)}>{children}</table>;
}

export function Th({ children, className }) {
  return (
    <th
      className={cn(
        'whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted',
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className, colSpan }) {
  return (
    <td colSpan={colSpan} className={cn('px-4 py-3.5 align-middle text-ink-soft', className)}>
      {children}
    </td>
  );
}

export function TableLoading({ rows = 5, columns = 5 }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-t border-black/[0.05]">
          {Array.from({ length: columns }).map((__, cellIndex) => (
            <Td key={cellIndex}>
              <Skeleton className={cn('h-4', cellIndex === 0 ? 'w-40' : 'w-24')} />
            </Td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function AdminPagination({ page, totalPages, onChange }) {
  return <Pagination page={page} totalPages={totalPages} onChange={onChange} />;
}

export function TableEmpty({ colSpan, title, description }) {
  return (
    <tbody>
      <tr>
        <Td colSpan={colSpan} className="py-14 text-center">
          <p className="text-sm font-bold text-ink">{title}</p>
          {description ? <p className="mt-1 text-xs text-ink-muted">{description}</p> : null}
        </Td>
      </tr>
    </tbody>
  );
}
