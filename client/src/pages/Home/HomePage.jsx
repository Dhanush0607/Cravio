import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bike,
  BadgePercent,
  Clock3,
  Headphones,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { useLocation } from '../../context/LocationContext.jsx';
import { restaurantService } from '../../services/restaurantService.js';
import { couponService } from '../../services/couponService.js';
import { CategoryGrid } from '../../components/home/CategoryGrid.jsx';
import { SectionHeading } from '../../components/common/SectionHeading.jsx';
import { RestaurantCard } from '../../components/restaurant/RestaurantCard.jsx';
import { TopDishCard } from '../../components/food/TopDishCard.jsx';
import { ErrorState, RestaurantCardSkeleton, Skeleton } from '../../components/common/Feedback.jsx';
import { ImageWithFallback } from '../../components/common/ImageWithFallback.jsx';
import { formatCurrency } from '../../utils/format.js';
import { POPULAR_SEARCHES } from '../../utils/constants.js';

const benefits = [
  {
    icon: Sparkles,
    title: 'Curated local kitchens',
    text: 'Discover restaurants selected for food quality, consistency, and customer experience.',
  },
  {
    icon: Wallet,
    title: 'Transparent pricing',
    text: 'Every fee is shown before checkout, and totals are recalculated securely on the server.',
  },
  {
    icon: Bike,
    title: 'Delivery you can follow',
    text: 'Track each step from confirmation to preparation and delivery in your order timeline.',
  },
  {
    icon: Headphones,
    title: 'Real human support',
    text: 'Order issues are handled by people who can review the order and make things right.',
  },
];

function Hero({ city, setCity, cities }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  function submit(event) {
    event.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/restaurants');
  }

  return (
    <section className="relative overflow-hidden pb-14 pt-10 sm:pb-20 sm:pt-14 lg:pb-24">
      <div
        className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-100/60 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-20 top-40 h-80 w-80 rounded-full bg-amber-100/50 blur-3xl"
        aria-hidden="true"
      />

      <div className="container-page relative grid items-center gap-10 lg:grid-cols-[1.06fr_0.94fr] lg:gap-14">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200/70 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold text-brand-700">
            <Sparkles className="h-3.5 w-3.5" />
            Now serving {city.name}
          </div>

          <h1 className="mt-5 max-w-2xl text-balance text-[2.7rem] font-extrabold leading-[1.03] tracking-[-0.055em] text-ink sm:text-6xl lg:text-[4.5rem]">
            Your cravings.
            <br />
            <span className="text-brand-500">Delivered.</span>
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-base leading-7 text-ink-muted sm:text-lg sm:leading-8">
            From slow-cooked biryani to late-night burgers, discover the food you actually want
            from local kitchens that care.
          </p>

          <form
            onSubmit={submit}
            className="mt-7 rounded-2xl border border-black/[0.07] bg-white p-2 shadow-lift sm:rounded-3xl sm:p-2.5"
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex items-center gap-2 rounded-xl border border-black/[0.07] px-3 sm:w-40">
                <MapPin className="h-4 w-4 shrink-0 text-brand-500" />
                <select
                  value={city.name}
                  onChange={(event) => setCity(event.target.value)}
                  className="h-11 w-full cursor-pointer appearance-none bg-transparent text-sm font-semibold outline-none"
                  aria-label="Delivery city"
                >
                  {cities.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-3" htmlFor="hero-search">
                <Search className="h-5 w-5 shrink-0 text-ink-muted" />
                <input
                  id="hero-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search dishes, cuisines, or restaurants"
                  className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-black/35"
                />
              </label>
              <button
                type="submit"
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-bold text-white shadow-glow transition hover:bg-brand-600"
              >
                Find food
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-ink-muted">Popular:</span>
            {POPULAR_SEARCHES.slice(0, 5).map((term) => (
              <Link
                key={term}
                to={`/search?q=${encodeURIComponent(term)}`}
                className="rounded-full border border-black/[0.07] bg-white/70 px-3 py-1 text-xs font-medium text-ink-soft transition hover:border-brand-200 hover:text-brand-600"
              >
                {term}
              </Link>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-success" /> Secure checkout
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-4 w-4 text-brand-500" /> Live order status
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-current text-amber-400" /> Quality-first kitchens
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl animate-fade-in lg:max-w-none">
          <div className="relative overflow-hidden rounded-[2.5rem] border-8 border-white bg-brand-100 shadow-lift">
            <ImageWithFallback
              src="/images/foods/hero-food.jpg"
              alt="A colourful spread of freshly prepared food"
              className="aspect-[4/3] w-full"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>

          <div className="absolute -left-3 bottom-6 flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white/95 p-3.5 pr-5 shadow-lift backdrop-blur sm:-left-8 sm:bottom-10">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-green-50 text-success">
              <Bike className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold text-ink">At your door</p>
              <p className="text-[11px] text-ink-muted">in 25–35 minutes</p>
            </div>
          </div>

          <div className="absolute -right-2 -top-4 rounded-2xl border border-brand-100 bg-white/95 p-3.5 shadow-lift backdrop-blur sm:-right-5 sm:top-7">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <BadgePercent className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-ink">Save up to ₹80</p>
                <p className="text-[10px] text-ink-muted">with SPECIAL80</p>
              </div>
            </div>
          </div>

          <span className="absolute -right-5 bottom-2 hidden h-20 w-20 rotate-6 place-items-center rounded-3xl bg-ink text-center text-[10px] font-bold uppercase leading-4 tracking-wider text-white shadow-xl sm:grid">
            Fresh
            <br />
            local
            <br />
            food
          </span>
        </div>
      </div>
    </section>
  );
}

function OfferCard({ coupon, index }) {
  const isPercentage = coupon.discountType === 'percentage';
  const headline = isPercentage
    ? `${coupon.discountValue}% OFF`
    : `${formatCurrency(coupon.discountValue)} OFF`;

  return (
    <Link
      to="/search"
      className={`group relative overflow-hidden rounded-3xl p-6 text-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-7 ${
        index % 2 === 0 ? 'bg-ink' : 'bg-brand-500'
      }`}
    >
      <div
        className={`absolute -right-12 -top-12 h-44 w-44 rounded-full ${
          index % 2 === 0 ? 'bg-brand-500/20' : 'bg-white/15'
        }`}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-16 -right-6 h-40 w-40 rounded-full border-[22px] border-white/10"
        aria-hidden="true"
      />
      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">
          {index === 0 ? 'Today’s spotlight' : 'Limited-time offer'}
        </p>
        <p className="mt-3 text-4xl font-extrabold tracking-tight sm:text-[2.7rem]">{headline}</p>
        <p className="mt-2 max-w-xs text-sm leading-6 text-white/75">
          {coupon.description ||
            `On orders above ${formatCurrency(coupon.minimumOrderAmount)}.`}
        </p>
        <div className="mt-5 flex items-center gap-3">
          <span className="rounded-lg border border-dashed border-white/40 px-3 py-1.5 text-xs font-bold tracking-widest">
            {coupon.code}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-white/80 transition group-hover:text-white">
            Order now <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { city, setCity, cities } = useLocation();
  const { data, loading, error, refetch } = useApi(
    async () => {
      const [restaurants, coupons, top] = await Promise.all([
        restaurantService.list({ city: city.name, limit: 8, sort: 'rating' }),
        couponService.featured(),
        restaurantService.topDishes({ city: city.name, limit: 8 }),
      ]);
      return {
        restaurants: restaurants.data.restaurants,
        coupons: coupons.coupons,
        dishes: top.items,
      };
    },
    [city.name]
  );

  return (
    <>
      <Hero city={city} setCity={setCity} cities={cities} />

      <section className="container-page pb-14 sm:pb-20">
        <SectionHeading
          eyebrow="What are you craving?"
          title="Explore by category"
          description="Eight cravings. Hundreds of possibilities."
          actionLabel="Explore all"
          actionHref="/explore"
        />
        <CategoryGrid />
      </section>

      <section className="border-y border-black/[0.05] bg-white/60 py-14 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Locally loved"
            title={`Popular restaurants in ${city.name}`}
            description="Kitchens rated highly by Cravio customers, ready to cook for you."
            actionLabel="View all restaurants"
            actionHref="/restaurants"
          />

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <RestaurantCardSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <ErrorState message={error.message} onRetry={refetch} />
          ) : data?.restaurants?.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.restaurants.slice(0, 4).map((restaurant) => (
                <RestaurantCard key={restaurant._id} restaurant={restaurant} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-black/10 bg-white p-10 text-center">
              <p className="font-semibold">No restaurants listed in {city.name} yet.</p>
              <p className="mt-1 text-sm text-ink-muted">Try another delivery city.</p>
            </div>
          )}
        </div>
      </section>

      {loading ? (
        <section className="container-page py-14 sm:py-20">
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-56 rounded-3xl" />
            <Skeleton className="h-56 rounded-3xl" />
          </div>
        </section>
      ) : data?.coupons?.length ? (
        <section id="offers" className="container-page py-14 sm:py-20">
          <SectionHeading
            eyebrow="A little extra"
            title="Offers worth craving"
            description="Use a coupon at checkout. Discounts are validated securely before your order is created."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {data.coupons.slice(0, 2).map((coupon, index) => (
              <OfferCard key={coupon.code} coupon={coupon} index={index} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="border-y border-black/[0.05] bg-white/60 py-14 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Cravio top picks"
            title="Dishes people come back for"
            description="A rotating edit of standout dishes from kitchens near you."
            actionLabel="Discover more"
            actionHref="/explore"
          />
          {loading ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-72 rounded-3xl" />
              ))}
            </div>
          ) : data?.dishes?.length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {data.dishes.slice(0, 4).map((item) => (
                <TopDishCard key={item._id} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Top picks are being prepared for this city.</p>
          )}
        </div>
      </section>

      <section className="container-page py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-600">
              Why Cravio
            </p>
            <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
              Good food should feel effortless.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-ink-muted">
              We focus on the details that make ordering reliable: clear pricing, honest
              availability, secure accounts, and a support path when something goes wrong.
            </p>
            <Link
              to="/restaurants"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-soft"
            >
              Browse restaurants <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {benefits.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-black/[0.06] bg-white p-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-sm font-bold">{title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-ink-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
