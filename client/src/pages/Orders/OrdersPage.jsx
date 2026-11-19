import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  ChefHat,
  Clock3,
  MapPin,
  Package,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { orderService } from '../../services/orderService.js';
import { EmptyState, ErrorState, PageLoader } from '../../components/common/Feedback.jsx';
import { StatusBadge, PaymentBadge } from '../../components/common/StatusBadge.jsx';
import { Pagination } from '../../components/common/Pagination.jsx';
import { ImageWithFallback } from '../../components/common/ImageWithFallback.jsx';
import { formatCurrency, formatDateTime } from '../../utils/format.js';
import { ORDER_STATUS_META } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

const tabs = [
  { value: 'all', label: 'All orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'out_for_delivery', label: 'On the way' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || 'all';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const resource = useApi(
    () => orderService.myOrders({ status, page, limit: 8 }),
    [status, page]
  );

  const orders = resource.data?.data?.orders || [];
  const meta = resource.data?.meta;

  function selectStatus(nextStatus) {
    const next = new URLSearchParams();
    if (nextStatus !== 'all') next.set('status', nextStatus);
    setSearchParams(next, { replace: true });
  }

  function changePage(nextPage) {
    const next = new URLSearchParams(searchParams);
    if (nextPage > 1) next.set('page', String(nextPage));
    else next.delete('page');
    setSearchParams(next, { replace: true });
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Order history</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Your orders</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Follow live orders, review past meals, and pick up where you left off.
          </p>
        </div>
        <button
          type="button"
          onClick={resource.refetch}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-black/[0.03] sm:self-auto"
        >
          <RefreshCw className={cn('h-4 w-4', resource.loading && 'animate-spin')} /> Refresh
        </button>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => selectStatus(tab.value)}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition',
              status === tab.value
                ? 'border-ink bg-ink text-white'
                : 'border-black/10 bg-white text-ink-soft hover:border-black/20'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {resource.loading ? (
          <PageLoader label="Loading your orders…" />
        ) : resource.error ? (
          <ErrorState message={resource.error.message} onRetry={resource.refetch} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title={status === 'all' ? 'No orders yet' : 'No orders in this status'}
            description={
              status === 'all'
                ? 'Your first Cravio order is waiting to happen. Explore restaurants near you and add something delicious to your cart.'
                : 'Try another status filter to see the rest of your order history.'
            }
            action={
              status === 'all' ? (
                <Link
                  to="/restaurants"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
                >
                  Browse restaurants <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => selectStatus('all')}
                  className="rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold"
                >
                  Show all orders
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="space-y-3">
              {orders.map((order) => {
                const activeStatus = ['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(
                  order.orderStatus
                );
                return (
                  <article key={order._id} className="card overflow-hidden transition hover:shadow-lift">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] bg-white/70 px-4 py-3 sm:px-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={order.orderStatus} />
                        <PaymentBadge status={order.paymentStatus} />
                        {activeStatus ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
                            <Clock3 className="h-3 w-3" /> {ORDER_STATUS_META[order.orderStatus].description}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-ink-muted">{formatDateTime(order.createdAt)}</p>
                    </div>

                    <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                      <ImageWithFallback
                        src={order.restaurant?.image}
                        alt={order.restaurant?.name}
                        className="h-16 w-16 shrink-0 rounded-2xl sm:h-20 sm:w-20"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h2 className="text-base font-bold">{order.restaurant?.name}</h2>
                          <span className="text-xs text-ink-muted">{order.orderNumber}</span>
                        </div>
                        <p className="mt-1 line-clamp-1 text-sm text-ink-muted">
                          {order.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                          <span className="inline-flex items-center gap-1">
                            <Package className="h-3.5 w-3.5" /> {order.items.length} item
                            {order.items.length === 1 ? '' : 's'}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {order.deliveryAddress?.city}
                          </span>
                          <span className="font-bold text-ink">{formatCurrency(order.total)}</span>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Link
                          to={`/orders/${order._id}`}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition',
                            activeStatus || order.paymentStatus === 'pending'
                              ? 'bg-brand-500 text-white hover:bg-brand-600'
                              : 'border border-black/10 bg-white text-ink hover:bg-black/[0.03]'
                          )}
                        >
                          {activeStatus ? 'Track order' : 'View details'} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          to={order.restaurant?.slug ? `/restaurants/${order.restaurant.slug}` : '/restaurants'}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-2.5 text-xs font-semibold text-ink-soft transition hover:bg-black/[0.03]"
                        >
                          <ChefHat className="h-3.5 w-3.5" /> Order again
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <Pagination page={page} totalPages={meta?.totalPages || 1} onChange={changePage} />
          </>
        )}
      </div>
    </div>
  );
}
