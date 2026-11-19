import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock3, MapPin, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';
import { CouponBox } from '../../components/cart/CouponBox.jsx';
import { OrderSummary } from '../../components/cart/OrderSummary.jsx';
import { QuantityControl } from '../../components/common/QuantityControl.jsx';
import { EmptyState } from '../../components/common/Feedback.jsx';
import { FoodTypeBadge } from '../../components/common/FoodTypeBadge.jsx';
import { ImageWithFallback } from '../../components/common/ImageWithFallback.jsx';
import { formatCurrency, formatDeliveryTime } from '../../utils/format.js';

export default function CartPage() {
  const {
    restaurant,
    items,
    coupon,
    totals,
    isEmpty,
    incrementItem,
    decrementItem,
    removeItem,
    applyCoupon,
    clearCoupon,
  } = useCart();
  const navigate = useNavigate();

  if (isEmpty) {
    return (
      <div className="container-page py-12 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is waiting for something delicious"
            description="Browse restaurants near you, add a few dishes, and they will show up here."
            action={
              <Link
                to="/restaurants"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-600"
              >
                Browse restaurants <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const belowMinimum = totals.subtotal < (restaurant?.minOrder || 0);
  const amountShort = Math.max(0, (restaurant?.minOrder || 0) - totals.subtotal);

  return (
    <div className="container-page py-8 sm:py-12">
      <Link
        to={restaurant?.slug ? `/restaurants/${restaurant.slug}` : '/restaurants'}
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Add more items
      </Link>

      <div className="mt-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Your order</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Review your cart</h1>
        </div>
        <p className="text-sm text-ink-muted">
          {totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'} from{' '}
          <span className="font-semibold text-ink">{restaurant?.name}</span>
        </p>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="space-y-5">
          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <ImageWithFallback
                  src={restaurant?.image}
                  alt={restaurant?.name}
                  className="h-12 w-12 shrink-0 rounded-xl"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{restaurant?.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatDeliveryTime(restaurant?.deliveryTime)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {restaurant?.city || 'Your city'}
                    </span>
                  </div>
                </div>
              </div>
              <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                {restaurant?.deliveryFee === 0
                  ? 'Free delivery'
                  : `${formatCurrency(restaurant?.deliveryFee || 0)} delivery`}
              </span>
            </div>

            <ul className="divide-y divide-black/[0.05]">
              {items.map((item) => (
                <li key={item.menuItemId} className="flex gap-3.5 px-4 py-4 sm:gap-4 sm:px-6">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.name}
                    className="h-20 w-20 shrink-0 rounded-xl sm:h-24 sm:w-24"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <FoodTypeBadge type={item.foodType} />
                          <h2 className="truncate text-sm font-semibold">{item.name}</h2>
                        </div>
                        <p className="mt-1 text-xs text-ink-muted">
                          {item.category} · {formatCurrency(item.price)} each
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.menuItemId)}
                        className="rounded-lg p-1.5 text-ink-muted transition hover:bg-red-50 hover:text-danger"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                      <QuantityControl
                        quantity={item.quantity}
                        size="sm"
                        onIncrement={() => incrementItem(item.menuItemId)}
                        onDecrement={() => decrementItem(item.menuItemId)}
                      />
                      <p className="text-sm font-bold">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <CouponBox
            subtotal={totals.subtotal}
            appliedCoupon={coupon}
            onApply={applyCoupon}
            onRemove={clearCoupon}
          />

          {belowMinimum ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Add {formatCurrency(amountShort)} more to reach the {formatCurrency(restaurant?.minOrder)}{' '}
              minimum order for this restaurant.
            </div>
          ) : null}
        </div>

        <OrderSummary
          totals={totals}
          coupon={coupon}
          className="lg:sticky lg:top-28"
          footer={
            <button
              type="button"
              disabled={belowMinimum}
              onClick={() => navigate('/checkout')}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-sm font-bold text-white shadow-glow transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
            >
              Proceed to checkout <ArrowRight className="h-4 w-4" />
            </button>
          }
        />
      </div>
    </div>
  );
}
