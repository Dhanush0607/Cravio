import { Plus } from 'lucide-react';
import { FoodTypeBadge } from '../common/FoodTypeBadge.jsx';
import { ImageWithFallback } from '../common/ImageWithFallback.jsx';
import { QuantityControl } from '../common/QuantityControl.jsx';
import { formatCurrency } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

export function MenuItemCard({
  item,
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
  restaurantClosed,
}) {
  const unavailable = !item.isAvailable || restaurantClosed;

  return (
    <article
      className={cn(
        'flex gap-4 rounded-2xl border border-black/[0.06] bg-white p-4 transition hover:border-black/[0.1]',
        unavailable && 'opacity-65'
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <FoodTypeBadge type={item.foodType} />
          {item.isRecommended ? (
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
              Bestseller
            </span>
          ) : null}
        </div>
        <h3 className="mt-2 text-sm font-bold text-ink sm:text-base">{item.name}</h3>
        <p className="mt-1 text-sm font-semibold text-ink">
          {formatCurrency(item.price)}
        </p>
        <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-ink-muted">
          {item.description}
        </p>
        {!item.isAvailable ? (
          <p className="mt-2 text-[11px] font-semibold text-danger">Currently unavailable</p>
        ) : restaurantClosed ? (
          <p className="mt-2 text-[11px] font-semibold text-ink-muted">Restaurant closed</p>
        ) : null}
      </div>

      <div className="relative w-24 shrink-0 sm:w-32">
        <div className="aspect-square overflow-hidden rounded-xl bg-black/5">
          <ImageWithFallback
            src={item.image}
            alt={item.name}
            className="h-full w-full"
            fallback="/images/foods/hero-food.jpg"
          />
        </div>
        <div className="absolute inset-x-2 -bottom-3 flex justify-center">
          {quantity > 0 ? (
            <QuantityControl
              quantity={quantity}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              size="sm"
              disabled={restaurantClosed}
            />
          ) : (
            <button
              type="button"
              onClick={onAdd}
              disabled={unavailable}
              className="inline-flex h-8 min-w-[4.5rem] items-center justify-center gap-1 rounded-lg border border-brand-500 bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-brand-600 shadow-sm transition hover:bg-brand-500 hover:text-white disabled:cursor-not-allowed disabled:border-black/10 disabled:bg-black/[0.03] disabled:text-ink-muted"
            >
              {!unavailable ? <Plus className="h-3 w-3" /> : null}
              {item.isAvailable ? 'Add' : 'Sold out'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
