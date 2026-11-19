import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock3 } from 'lucide-react';
import { ImageWithFallback } from '../common/ImageWithFallback.jsx';
import { FoodTypeBadge } from '../common/FoodTypeBadge.jsx';
import { formatCurrency, formatDeliveryTime } from '../../utils/format.js';

export function TopDishCard({ item }) {
  const restaurant = item.restaurant;

  return (
    <Link
      to={`/restaurants/${restaurant?.slug || ''}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-black/[0.06] bg-white p-3 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[5/4] overflow-hidden rounded-2xl bg-black/5">
        <ImageWithFallback
          src={item.image}
          alt={item.name}
          className="h-full w-full transition duration-500 group-hover:scale-[1.04]"
        />
        <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-ink shadow-sm transition group-hover:bg-brand-500 group-hover:text-white">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        <div className="flex items-center justify-between gap-2">
          <FoodTypeBadge type={item.foodType} />
          <span className="text-sm font-bold text-ink">{formatCurrency(item.price)}</span>
        </div>
        <h3 className="mt-2 line-clamp-1 text-sm font-bold text-ink group-hover:text-brand-600">
          {item.name}
        </h3>
        <p className="mt-1 line-clamp-1 text-xs text-ink-muted">{restaurant?.name}</p>
        <div className="mt-auto flex items-center gap-3 pt-3 text-[11px] text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3 w-3" /> {formatDeliveryTime(restaurant?.deliveryTime)}
          </span>
          {restaurant?.address?.city ? <span>{restaurant.address.city}</span> : null}
        </div>
      </div>
    </Link>
  );
}
