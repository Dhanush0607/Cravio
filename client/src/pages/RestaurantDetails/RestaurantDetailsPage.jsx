import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock3,
  Info,
  MapPin,
  Search,
  ShoppingBag,
  Star,
  Tag,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { restaurantService } from '../../services/restaurantService.js';
import { useCart } from '../../context/CartContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { MenuItemCard } from '../../components/restaurant/MenuItemCard.jsx';
import { CartPreview } from '../../components/cart/CartPreview.jsx';
import { ImageWithFallback } from '../../components/common/ImageWithFallback.jsx';
import { Rating } from '../../components/common/Rating.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { PageLoader, ErrorState, EmptyState, Skeleton } from '../../components/common/Feedback.jsx';
import { formatCurrency, formatDeliveryTime } from '../../utils/format.js';

function MenuSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-black/[0.05] bg-white p-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="mt-3 h-5 w-2/3" />
          <Skeleton className="mt-2 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}

export default function RestaurantDetailsPage() {
  const { slug } = useParams();
  const { addItem, replaceCart, getItemQuantity, incrementItem, decrementItem, items, totals } =
    useCart();
  const { toast } = useToast();

  const [menuSearch, setMenuSearch] = useState('');
  const [conflict, setConflict] = useState(null);

  const resource = useApi(async () => {
    const { restaurant } = await restaurantService.get(slug);
    const menu = await restaurantService.menu(restaurant._id);
    return { restaurant, items: menu.items, categories: menu.categories };
  }, [slug]);

  const restaurant = resource.data?.restaurant;
  const menuItems = useMemo(() => resource.data?.items || [], [resource.data]);

  const filteredItems = useMemo(() => {
    const term = menuSearch.trim().toLowerCase();
    if (!term) return menuItems;
    return menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term)
    );
  }, [menuItems, menuSearch]);

  const grouped = useMemo(() => {
    return filteredItems.reduce((groups, item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
      return groups;
    }, {});
  }, [filteredItems]);

  const categories = Object.keys(grouped);

  function handleAdd(item) {
    if (!restaurant?.isOpen) return;
    const result = addItem(item, restaurant);
    if (result.conflict) {
      setConflict(item);
      return;
    }
    toast.success(`${item.name} added to cart.`, 2200);
  }

  function confirmReplace() {
    if (!conflict || !restaurant) return;
    replaceCart(conflict, restaurant);
    toast.success(`Cart replaced with ${conflict.name}.`);
    setConflict(null);
  }

  function anchorId(category) {
    return `menu-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  }

  if (resource.loading) return <PageLoader label="Opening the menu…" />;
  if (resource.error) {
    return (
      <div className="container-page py-16">
        <ErrorState
          title="Restaurant menu unavailable"
          message={resource.error.message}
          onRetry={resource.refetch}
        />
      </div>
    );
  }
  if (!restaurant) return null;

  return (
    <div className="pb-24 xl:pb-12">
      <div className="container-page pt-5">
        <Link
          to="/restaurants"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Back to restaurants
        </Link>
      </div>

      <div className="container-page mt-4">
        <div className="relative h-52 overflow-hidden rounded-3xl bg-ink sm:h-72">
          <ImageWithFallback
            src={restaurant.bannerImage}
            alt={`${restaurant.name} interior`}
            className="h-full w-full opacity-90"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink">
                  {restaurant.isOpen ? 'Open now' : 'Currently closed'}
                </span>
                {restaurant.offer ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-500 px-2.5 py-1 text-[10px] font-bold text-white">
                    <Tag className="h-3 w-3" /> {restaurant.offer}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {restaurant.name}
              </h1>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-3 -mt-7 rounded-3xl border border-black/[0.06] bg-white p-5 shadow-card sm:mx-6 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Rating value={restaurant.rating} count={restaurant.ratingCount} />
                <span className="text-xs text-ink-muted">
                  {restaurant.cuisines?.join(' • ')}
                </span>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-muted">
                {restaurant.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5 text-brand-500" />
                  {formatDeliveryTime(restaurant.deliveryTime)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-brand-500" />
                  {restaurant.address?.area}, {restaurant.address?.city}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-brand-500" />
                  Min. order {formatCurrency(restaurant.minOrder)}
                </span>
              </div>
            </div>
            <div className="flex gap-5 rounded-2xl bg-canvas px-5 py-4 lg:min-w-72">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  Delivery
                </p>
                <p className="mt-1 text-sm font-bold">
                  {restaurant.deliveryFee > 0
                    ? formatCurrency(restaurant.deliveryFee)
                    : 'Free'}
                </p>
              </div>
              <div className="border-l border-black/10 pl-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  For two
                </p>
                <p className="mt-1 text-sm font-bold">{formatCurrency(restaurant.priceForTwo)}</p>
              </div>
              <div className="border-l border-black/10 pl-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  Rating
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-sm font-bold">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {restaurant.rating.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {!restaurant.isOpen ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This kitchen is currently closed. You can browse the menu, but ordering is disabled
            until it reopens.
          </div>
        ) : null}

        <div className="mt-8 grid gap-7 lg:grid-cols-[180px_minmax(0,1fr)] xl:grid-cols-[180px_minmax(0,1fr)_320px]">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-ink-muted">
                Menu
              </p>
              <nav className="space-y-0.5" aria-label="Menu categories">
                {categories.map((category) => (
                  <a
                    key={category}
                    href={`#${anchorId(category)}`}
                    className="block rounded-lg px-3 py-2 text-sm text-ink-soft transition hover:bg-white hover:text-brand-600"
                  >
                    {category}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">Menu</h2>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {menuItems.length} dishes · cooked to order
                </p>
              </div>
              <label className="flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3">
                <Search className="h-4 w-4 text-ink-muted" />
                <span className="sr-only">Search this menu</span>
                <input
                  value={menuSearch}
                  onChange={(event) => setMenuSearch(event.target.value)}
                  placeholder="Search this menu"
                  className="h-10 w-full bg-transparent text-sm outline-none sm:w-48"
                />
              </label>
            </div>

            {filteredItems.length === 0 ? (
              <div className="mt-5">
                <EmptyState
                  title="No dishes match your search"
                  description="Try another dish name or clear the menu search."
                  action={
                    <button
                      type="button"
                      onClick={() => setMenuSearch('')}
                      className="text-sm font-semibold text-brand-600"
                    >
                      Clear menu search
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="mt-5 space-y-8">
                {categories.map((category) => (
                  <section key={category} id={anchorId(category)} className="scroll-mt-24">
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="text-base font-bold">{category}</h3>
                      <span className="text-xs text-ink-muted">{grouped[category].length}</span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {grouped[category].map((item) => (
                        <MenuItemCard
                          key={item._id}
                          item={item}
                          quantity={getItemQuantity(item._id)}
                          onAdd={() => handleAdd(item)}
                          onIncrement={() => incrementItem(item._id)}
                          onDecrement={() => decrementItem(item._id)}
                          restaurantClosed={!restaurant.isOpen}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>

          <div className="hidden xl:block">
            <div className="sticky top-28">
              <CartPreview />
            </div>
          </div>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.08] bg-white/95 p-3 shadow-[0_-8px_30px_-20px_rgba(0,0,0,0.4)] backdrop-blur xl:hidden">
          <div className="container-page flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold">
                {totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'} ·{' '}
                {formatCurrency(totals.subtotal)}
              </p>
              <p className="truncate text-[11px] text-ink-muted">{restaurant.name}</p>
            </div>
            <Link
              to="/cart"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-bold text-white"
            >
              <ShoppingBag className="h-4 w-4" /> View cart
            </Link>
          </div>
        </div>
      ) : null}

      <Modal
        open={Boolean(conflict)}
        onClose={() => setConflict(null)}
        title="Start a new cart?"
        description="Cravio carts can contain dishes from one restaurant at a time."
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConflict(null)}
              className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold"
            >
              Keep current cart
            </button>
            <button
              type="button"
              onClick={confirmReplace}
              className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              Replace cart
            </button>
          </>
        }
      >
        <div className="rounded-2xl bg-canvas p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Current cart</p>
          <p className="mt-1 font-semibold">{items.length ? 'Your existing items' : 'Empty'}</p>
          <p className="mt-3 text-xs text-ink-muted">New dish</p>
          <p className="mt-1 font-semibold">{conflict?.name}</p>
        </div>
        <p className="mt-4 text-sm leading-6 text-ink-muted">
          Adding this dish will remove the items currently in your cart. Your coupons will also be
          cleared. Nothing is removed until you confirm.
        </p>
      </Modal>
    </div>
  );
}
