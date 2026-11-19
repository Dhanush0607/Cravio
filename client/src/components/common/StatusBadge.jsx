import { ORDER_STATUS_META } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

const tones = {
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  orange: 'bg-brand-50 text-brand-700 border-brand-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  red: 'bg-red-50 text-red-700 border-red-200',
};

export function StatusBadge({ status, className }) {
  const meta = ORDER_STATUS_META[status] || {
    label: status,
    tone: 'amber',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold',
        tones[meta.tone],
        className
      )}
    >
      {meta.label}
    </span>
  );
}

export function PaymentBadge({ status }) {
  const classes = {
    paid: 'bg-green-50 text-green-700 border-green-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    refunded: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize',
        classes[status] || classes.pending
      )}
    >
      {status}
    </span>
  );
}
