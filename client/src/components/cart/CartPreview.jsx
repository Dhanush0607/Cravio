import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';
import { formatCurrency } from '../../utils/format.js';

export function CartPreview() {
  const { items, restaurant, totals, isEmpty, incrementItem, decrementItem } = useCart();

  if (isEmpty) {
    return (
      <div className="rounded-3xl border border-dashed border-black/10 bg-white/70 p-5 text-center">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-500">
          <ShoppingBag className="h-5 w-5" />
        </span>
        <p className="mt-3 text-sm font-semibold">Your cart is empty</p>
        <p className="mt-1 text-xs leading-5 text-ink-muted">
          Add a dish from this menu to get started.
        </p>
      </div>
    );
  }

  return (
    <aside className="rounded-3xl border border-black/[0.07] bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">Your order</h2>
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
          {totals.itemCount} items
        </span>
      </div>
      <p className="mt-1 text-xs text-ink-muted">{restaurant?.name}</p>

      <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.menuItemId} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-xs font-semibold">{item.name}</p>
              <p className="mt-0.5 text-[11px] text-ink-muted">
                {formatCurrency(item.price)} each
              </p>
            </div>
            <div className="flex items-center rounded-lg border border-brand-500 text-[11px] font-bold text-brand-600">
              <button
                type="button"
                onClick={() => decrementItem(item.menuItemId)}
                className="px-2 py-1 transition hover:bg-brand-50"
                aria-label={`Decrease ${item.name}`}
              >
                −
              </button>
              <span className="min-w-5 text-center">{item.quantity}</span>
              <button
                type="button"
                onClick={() => incrementItem(item.menuItemId)}
                className="px-2 py-1 transition hover:bg-brand-50"
                aria-label={`Increase ${item.name}`}
              >
                +
              </button>
            </div>
            <span className="w-14 text-right text-xs font-bold">
              {formatCurrency(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2 border-t border-dashed border-black/10 pt-4 text-xs">
        <div className="flex justify-between text-ink-muted">
          <span>Subtotal</span>
          <span>{formatCurrency(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between text-ink-muted">
          <span>Delivery</span>
          <span>{formatCurrency(totals.deliveryFee)}</span>
        </div>
        <div className="flex justify-between pt-1 text-sm font-bold">
          <span>Total</span>
          <span>{formatCurrency(totals.subtotal + totals.deliveryFee + totals.platformFee)}</span>
        </div>
      </div>

      <Link
        to="/cart"
        className="mt-4 flex h-10 items-center justify-center gap-2 rounded-xl bg-ink text-xs font-bold text-white transition hover:bg-ink-soft"
      >
        Review cart <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </aside>
  );
}
