import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useLocation } from '../../context/LocationContext.jsx';
import { restaurantService } from '../../services/restaurantService.js';
import { RestaurantCard } from '../../components/restaurant/RestaurantCard.jsx';
import { RestaurantCardSkeleton, EmptyState, ErrorState } from '../../components/common/Feedback.jsx';
import { Pagination } from '../../components/common/Pagination.jsx';
import { Select } from '../../components/common/Input.jsx';
import { RATING_OPTIONS, SORT_OPTIONS } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

export default function RestaurantsPage() {
  const { city } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') || '';
  const cuisine = searchParams.get('cuisine') || '';
  const minRating = searchParams.get('rating') || '';
  const sort = searchParams.get('sort') || 'featured';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const debouncedQuery = useDebounce(query, 350);

  const cuisinesResource = useApi(() => restaurantService.cuisines(city.name), [city.name]);
  const restaurantsResource = useApi(
    () =>
      restaurantService.list({
        city: city.name,
        search: debouncedQuery || undefined,
        cuisine: cuisine || undefined,
        minRating: minRating || undefined,
        sort,
        page,
        limit: 12,
      }),
    [city.name, debouncedQuery, cuisine, minRating, sort, page]
  );

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next, { replace: true });
  }

  const hasFilters = query || cuisine || minRating || sort !== 'featured';
  const restaurants = restaurantsResource.data?.data?.restaurants || [];
  const meta = restaurantsResource.data?.meta;

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">
          {city.name} food guide
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Restaurants worth ordering from
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">
          Search local kitchens, filter by cuisine and rating, and find your next favourite meal.
        </p>
      </div>

      <div className="mt-7 rounded-2xl border border-black/[0.06] bg-white p-3 shadow-card sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <label className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-black/[0.08] px-3.5">
            <Search className="h-4 w-4 shrink-0 text-ink-muted" />
            <span className="sr-only">Search restaurants</span>
            <input
              value={query}
              onChange={(event) => updateParam('q', event.target.value)}
              placeholder="Search restaurant, cuisine, or vibe"
              className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-black/35"
            />
            {query ? (
              <button
                type="button"
                onClick={() => updateParam('q', '')}
                aria-label="Clear search"
                className="rounded p-1 text-ink-muted hover:bg-black/5"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </label>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Select
              aria-label="Minimum rating"
              value={minRating}
              onChange={(event) => updateParam('rating', event.target.value)}
              className="h-11 min-w-36 py-0"
            >
              {RATING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Sort restaurants"
              value={sort}
              onChange={(event) => updateParam('sort', event.target.value)}
              className="h-11 min-w-40 py-0"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
          <button
            type="button"
            onClick={() => updateParam('cuisine', '')}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
              !cuisine
                ? 'border-ink bg-ink text-white'
                : 'border-black/10 bg-white text-ink-soft hover:border-black/20'
            )}
          >
            All cuisines
          </button>
          {(cuisinesResource.data?.cuisines || []).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => updateParam('cuisine', item)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                cuisine === item
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-black/10 bg-white text-ink-soft hover:border-black/20'
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-sm text-ink-muted">
          {restaurantsResource.loading
            ? 'Finding restaurants…'
            : `${meta?.total || 0} ${meta?.total === 1 ? 'restaurant' : 'restaurants'}`}
        </p>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            <X className="h-3.5 w-3.5" /> Clear all filters
          </button>
        ) : null}
      </div>

      {restaurantsResource.loading ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <RestaurantCardSkeleton key={index} />
          ))}
        </div>
      ) : restaurantsResource.error ? (
        <div className="mt-6">
          <ErrorState
            message={restaurantsResource.error.message}
            onRetry={restaurantsResource.refetch}
          />
        </div>
      ) : restaurants.length ? (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant._id} restaurant={restaurant} />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={meta?.totalPages || 1}
            onChange={(nextPage) => updateParam('page', String(nextPage))}
          />
        </>
      ) : (
        <div className="mt-6">
          <EmptyState
            title="No restaurants match those filters"
            description="Try a different cuisine, lower the rating filter, or clear your search to see everything in your city."
            action={
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                Show all restaurants
              </button>
            }
          />
        </div>
      )}
    </div>
  );
}
