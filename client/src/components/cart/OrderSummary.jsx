import { ReceiptText, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

function Row({ label, value, strong = false, accent = false, muted = false }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 text-sm',
        strong ? 'font-bold text-ink' : muted ? 'text-ink-muted' : 'text-ink-soft'
      )}
    >
      <span>{label}</span>
      <span className={cn(accent && 'text-success')}>{value}</span>
    </div>
  );
}

export function OrderSummary({
  totals,
  coupon,
  title = 'Bill details',
  children,
  footer,
  className,
}) {
  const belowMinimum = coupon && totals.subtotal < (coupon.minimumOrderAmount || 0);

  return (
    <aside className={cn('card p-5 sm:p-6', className)}>
      <div className="mb-5 flex items-center gap-2">
        <ReceiptText className="h-5 w-5 text-brand-500" />
        <h2 className="text-base font-bold">{title}</h2>
      </div>

      <div className="space-y-3">
        <Row label="Item subtotal" value={formatCurrency(totals.subtotal)} />
        <Row
          label="Delivery fee"
          value={totals.deliveryFee === 0 ? 'FREE' : formatCurrency(totals.deliveryFee)}
          accent={totals.deliveryFee === 0}
        />
        <Row label="Platform fee" value={formatCurrency(totals.platformFee)} />
        {coupon ? (
          <Row
            label={`Coupon (${coupon.code})`}
            value={totals.discount > 0 ? `− ${formatCurrency(totals.discount)}` : 'Not applicable'}
            accent={totals.discount > 0}
          />
        ) : null}
      </div>

      {belowMinimum ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
          {coupon.code} needs a subtotal of {formatCurrency(coupon.minimumOrderAmount)} to apply.
        </p>
      ) : null}

      <div className="my-4 border-t border-dashed border-black/10" />
      <Row label="Grand total" value={formatCurrency(totals.total)} strong />

      {children ? <div className="mt-5">{children}</div> : null}

      <p className="mt-4 flex items-start gap-2 text-[11px] leading-4 text-ink-muted">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
        All prices and discounts are verified again on the server when you place your order.
      </p>

      {footer ? <div className="mt-5">{footer}</div> : null}
    </aside>
  );
}
