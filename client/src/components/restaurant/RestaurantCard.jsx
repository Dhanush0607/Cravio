import { Link } from 'react-router-dom';
import { Clock3, IndianRupee, Tag } from 'lucide-react';
import { ImageWithFallback } from '../common/ImageWithFallback.jsx';
import { Rating } from '../common/Rating.jsx';
import { formatDeliveryTime } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

export function RestaurantCard({ restaurant, className }) {
  return (
    <Link
      to={`/restaurant/${restaurant.slug}`}
      className={cn(
        'group block overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift',
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-black/5">
        <ImageWithFallback
          src={restaurant.image}
          alt={`${restaurant.name} food`}
          className="h-full w-full transition duration-500 group-hover:scale-[1.04]"
        />
        {restaurant.offer ? (
          <span className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10 text-xs font-semibold text-white">
            <Tag className="h-3.5 w-3.5 shrink-0 text-brand-300" />
            <span className="truncate">{restaurant.offer}</span>
          </span>
        ) : null}
        {!restaurant.isOpen ? (
          <span className="absolute inset-0 grid place-items-center bg-ink/55 text-sm font-bold uppercase tracking-wider text-white backdrop-blur-[1px]">
            Currently closed
          </span>
        ) : null}
        {restaurant.featured ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-700 shadow-sm">
            Featured
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-base font-bold text-ink transition group-hover:text-brand-600">
            {restaurant.name}
          </h3>
          <Rating value={restaurant.rating} count={restaurant.ratingCount} />
        </div>
        <p className="mt-1.5 line-clamp-1 text-sm text-ink-muted">
          {restaurant.cuisines?.join(' • ')}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-black/[0.06] pt-3 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" />
            {formatDeliveryTime(restaurant.deliveryTime)}
          </span>
          <span className="inline-flex items-center gap-1">
            <IndianRupee className="h-3 w-3" />
            {restaurant.priceForTwo} for two
          </span>
        </div>
      </div>
    </Link>
  );
}
