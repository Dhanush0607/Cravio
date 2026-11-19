import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Sparkles, UtensilsCrossed, X } from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useLocation } from '../../context/LocationContext.jsx';
import { restaurantService } from '../../services/restaurantService.js';
import { RestaurantCard } from '../../components/restaurant/RestaurantCard.jsx';
import { TopDishCard } from '../../components/food/TopDishCard.jsx';
import {
  DishCardSkeleton,
  EmptyState,
  ErrorState,
  RestaurantCardSkeleton,
} from '../../components/common/Feedback.jsx';
import { FOOD_CATEGORIES, POPULAR_SEARCHES } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

const tabs = [
  { value: 'all', label: 'All results' },
  { value: 'restaurants', label: 'Restaurants' },
  { value: 'dishes', label: 'Dishes' },
];

export default function SearchPage() {
  const { city } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [input, setInput] = useState(query);
  const [tab, setTab] = useState('all');
  const [foodType, setFoodType] = useState('');
  const debouncedQuery = useDebounce(input.trim(), 350);

  useEffect(() => {
    setInput(query);
  }, [query]);

  const enabled = debouncedQuery.length >= 2;
  const resource = useApi(
    async () => {
      const [restaurantResults, dishResults] = await Promise.all([
        restaurantService.list({
          search: debouncedQuery,
          city: city.name,
          limit: 8,
          sort: 'rating',
        }),
        restaurantService.searchMenu({
          search: debouncedQuery,
          city: city.name,
          limit: 12,
          foodType: foodType || undefined,
        }),
      ]);
      return {
        restaurants: restaurantResults.data.restaurants,
        dishes: dishResults.data.items,
      };
    },
    [debouncedQuery, city.name, foodType],
    { enabled }
  );

  function updateQuery(value) {
    setInput(value);
    const next = new URLSearchParams(searchParams);
    if (value.trim()) next.set('q', value);
    else next.delete('q');
    setSearchParams(next, { replace: true });
  }

  const restaurants = resource.data?.restaurants || [];
  const dishes = resource.data?.dishes || [];
  const totalResults = restaurants.length + dishes.length;

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">
          Search {city.name}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Find exactly what you’re craving
        </h1>
        <label className="mt-6 flex items-center gap-3 rounded-2xl border border-black/[0.08] bg-white px-4 shadow-card focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-500/10">
          <Search className="h-5 w-5 shrink-0 text-brand-500" />
          <span className="sr-only">Search dishes and restaurants</span>
          <input
            value={input}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Try biryani, pizza, dosa, or a restaurant name"
            className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-black/35 sm:text-base"
            autoFocus
          />
          {input ? (
            <button
              type="button"
              onClick={() => updateQuery('')}
              aria-label="Clear search"
              className="rounded-lg p-1.5 text-ink-muted hover:bg-black/5"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </label>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {POPULAR_SEARCHES.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => updateQuery(term)}
              className="rounded-full border border-black/[0.07] bg-white px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-brand-200 hover:text-brand-600"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {!enabled ? (
        <div className="mx-auto mt-12 max-w-4xl">
          {input.trim().length > 0 && input.trim().length < 2 ? (
            <p className="text-center text-sm text-ink-muted">
              Type at least two characters to search.
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FOOD_CATEGORIES.map((category) => (
              <button
                key={category.name}
                type="button"
                onClick={() => updateQuery(category.query)}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-white text-left shadow-card transition hover:-translate-y-1 hover:shadow-lift"
              >
                <img
                  src={category.image}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-4 text-sm font-bold text-white">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-dashed border-black/10 bg-white/60 p-6 text-center">
            <Sparkles className="mx-auto h-5 w-5 text-brand-500" />
            <p className="mt-2 text-sm text-ink-muted">
              Search by dish, cuisine, category, or restaurant name. Suggestions update as you
              type.
            </p>
          </div>
        </div>
      ) : resource.loading ? (
        <div className="mt-10">
          <div className="mb-5 flex justif-between">
            <div className="h-5 w-40 skeleton" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <RestaurantCardSkeleton key={index} />
            ))}
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <DishCardSkeleton key={index} />
            ))}
          </div>
        </div>
      ) : resource.error ? (
        <div className="mt-10">
          <ErrorState
            title="Search is temporarily unavailable"
            message={resource.error.message}
            onRetry={resource.refetch}
          />
        </div>
      ) : (
        <div className="mt-9">
          <div className="flex flex-col gap-4 border-b border-black/[0.06] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-ink-muted">
                <span className="font-semibold text-ink">{totalResults}</span>{' '}
                {totalResults === 1 ? 'result' : 'results'} for “{debouncedQuery}”
              </p>
            </div>
            <div className="flex gap-1 rounded-xl bg-black/[0.035] p-1">
              {tabs.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setTab(item.value)}
                  className={cn(
                    'rounded-lg px-3 py-2 text-xs font-semibold transition',
                    tab === item.value
                      ? 'bg-white text-ink shadow-sm'
                      : 'text-ink-muted hover:text-ink'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {totalResults === 0 ? (
            <div className="mt-8">
              <EmptyState
                title={`No results for “${debouncedQuery}”`}
                description="Check the spelling, try a broader term, or explore a category. We search restaurant names, cuisines, dish names, and categories."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    {['Biryani', 'Pizza', 'Dosa', 'Burger'].map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => updateQuery(term)}
                        className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold"
                      >
                        Try {term}
                      </button>
                    ))}
                  </div>
                }
              />
            </div>
          ) : (
            <>
              {(tab === 'all' || tab === 'restaurants') && restaurants.length ? (
                <section className="mt-8">
                  <div className="mb-4 flex items-center gap-2">
                    <UtensilsCrossed className="h-4 w-4 text-brand-500" />
                    <h2 className="text-lg font-bold">Restaurants</h2>
                    <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
                      {restaurants.length}
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {restaurants.map((restaurant) => (
                      <RestaurantCard key={restaurant._id} restaurant={restaurant} />
                    ))}
                  </div>
                </section>
              ) : null}

              {(tab === 'all' || tab === 'dishes') && dishes.length ? (
                <section className="mt-10">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-brand-500" />
                      <h2 className="text-lg font-bold">Dishes</h2>
                      <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
                        {dishes.length}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {[
                        { value: '', label: 'All' },
                        { value: 'veg', label: 'Veg' },
                        { value: 'non-veg', label: 'Non-veg' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFoodType(option.value)}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                            foodType === option.value
                              ? 'border-brand-500 bg-brand-50 text-brand-700'
                              : 'border-black/10 bg-white text-ink-soft'
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    {dishes.map((item) => (
                      <TopDishCard key={item._id} item={item} />
                    ))}
                  </div>
                </section>
              ) : null}

              {tab !== 'all' &&
              ((tab === 'restaurants' && !restaurants.length) ||
                (tab === 'dishes' && !dishes.length)) ? (
                <div className="mt-8">
                  <EmptyState
                    title={`No ${tab} found`}
                    description="Try switching tabs or searching for a broader term."
                    action={
                      <button
                        type="button"
                        onClick={() => setTab('all')}
                        className="text-sm font-semibold text-brand-600"
                      >
                        View all results
                      </button>
                    }
                  />
                </div>
              ) : null}
            </>
          )}

          <div className="mt-10 rounded-2xl border border-black/[0.06] bg-white p-5 text-center text-sm text-ink-muted">
            Looking for a full menu?{' '}
            <Link to="/restaurants" className="font-semibold text-brand-600 hover:underline">
              Browse all restaurants in {city.name}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
