import { Link } from 'react-router-dom';
import { ArrowRight, BadgePercent, Compass, Sparkles } from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { useLocation } from '../../context/LocationContext.jsx';
import { restaurantService } from '../../services/restaurantService.js';
import { couponService } from '../../services/couponService.js';
import { CategoryGrid } from '../../components/home/CategoryGrid.jsx';
import { SectionHeading } from '../../components/common/SectionHeading.jsx';
import { RestaurantCard } from '../../components/restaurant/RestaurantCard.jsx';
import { TopDishCard } from '../../components/food/TopDishCard.jsx';
import {
  ErrorState,
  RestaurantCardSkeleton,
  Skeleton,
} from '../../components/common/Feedback.jsx';
import { formatCurrency } from '../../utils/format.js';

export default function ExplorePage() {
  const { city } = useLocation();
  const resource = useApi(
    async () => {
      const [restaurants, dishes, coupons, cuisines] = await Promise.all([
        restaurantService.list({ city: city.name, sort: 'featured', limit: 8 }),
        restaurantService.topDishes({ city: city.name, limit: 8 }),
        couponService.featured(),
        restaurantService.cuisines(city.name),
      ]);
      return {
        restaurants: restaurants.data.restaurants,
        dishes: dishes.items,
        coupons: coupons.coupons,
        cuisines: cuisines.cuisines,
      };
    },
    [city.name]
  );

  const data = resource.data;

  return (
    <div>
      <section className="relative overflow-hidden border-b border-black/[0.05] bg-ink py-14 text-white sm:py-20">
        <div
          className="absolute -right-20 -top-20 h-96 w-96 rounded-full border-[54px] border-white/[0.04]"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="container-page relative">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/75">
              <Compass className="h-3.5 w-3.5 text-brand-400" />
              The Cravio discovery edit
            </p>
            <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-[-0.04em] sm:text-6xl">
              Follow your appetite, not the algorithm.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
              Explore standout kitchens, cuisines, and dishes across {city.name}. Everything here
              comes directly from active Cravio restaurant menus.
            </p>
            <Link
              to="/restaurants"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-600"
            >
              Browse all restaurants <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        <SectionHeading
          eyebrow="Start with a craving"
          title="Choose a category"
          description="Tap a category to search menus and restaurants instantly."
        />
        <CategoryGrid />
      </section>

      <section className="border-y border-black/[0.05] bg-white/60 py-12 sm:py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="Cuisines near you"
            title="A world of flavour in one city"
            description={`Explore kitchens serving ${city.name} right now.`}
          />
          <div className="flex flex-wrap gap-2.5">
            {(data?.cuisines || []).map((cuisine) => (
              <Link
                key={cuisine}
                to={`/restaurants?cuisine=${encodeURIComponent(cuisine)}`}
                className="rounded-full border border-black/[0.08] bg-white px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              >
                {cuisine}
              </Link>
            ))}
            {!data && resource.loading ? (
              <>
                {Array.from({ length: 8 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-28 rounded-full" />
                ))}
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        <SectionHeading
          eyebrow="Featured kitchens"
          title="Worth a closer look"
          description="A curated mix of established favourites and newer local kitchens."
          actionLabel="See everything"
          actionHref="/restaurants"
        />
        {resource.loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <RestaurantCardSkeleton key={index} />
            ))}
          </div>
        ) : resource.error ? (
          <ErrorState message={resource.error.message} onRetry={resource.refetch} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(data?.restaurants || []).slice(0, 8).map((restaurant) => (
              <RestaurantCard key={restaurant._id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </section>

      {resource.loading ? null : data?.dishes?.length ? (
        <section className="border-y border-black/[0.05] bg-white/60 py-12 sm:py-16">
          <div className="container-page">
            <SectionHeading
              eyebrow="Dish-led discovery"
              title="Order the dish, not just the restaurant"
              description="Popular plates from kitchens around your city."
            />
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {data.dishes.map((item) => (
                <TopDishCard key={item._id} item={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {data?.coupons?.length ? (
        <section id="offers" className="container-page py-12 sm:py-16">
          <SectionHeading
            eyebrow="More value"
            title="Live offers"
            description="Apply these codes in your cart before checkout."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.coupons.map((coupon) => (
              <div
                key={coupon.code}
                className="rounded-2xl border border-dashed border-brand-300 bg-brand-50/60 p-5"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-white">
                  <BadgePercent className="h-4 w-4" />
                </span>
                <p className="mt-4 text-xl font-extrabold text-brand-700">
                  {coupon.discountType === 'percentage'
                    ? `${coupon.discountValue}% off`
                    : `${formatCurrency(coupon.discountValue)} off`}
                </p>
                <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-ink-muted">
                  {coupon.description}
                </p>
                <div className="mt-4 flex items-center justify-between rounded-lg border border-dashed border-brand-300 bg-white px-2.5 py-1.5">
                  <span className="text-xs font-bold tracking-wider text-brand-700">
                    {coupon.code}
                  </span>
                  <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
