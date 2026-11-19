import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ChefHat,
  Clock3,
  MapPin,
  Package,
  ReceiptText,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { orderService } from '../../services/orderService.js';
import { PageLoader, ErrorState } from '../../components/common/Feedback.jsx';
import { StatusBadge, PaymentBadge } from '../../components/common/StatusBadge.jsx';
import { ImageWithFallback } from '../../components/common/ImageWithFallback.jsx';
import { formatCurrency, formatDeliveryTime } from '../../utils/format.js';
import { PAYMENT_METHOD_LABELS } from '../../utils/constants.js';

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const { data, loading, error, refetch } = useApi(() => orderService.get(orderId), [orderId]);

  if (loading) return <PageLoader label="Confirming your order…" />;
  if (error) {
    return (
      <div className="container-page py-12">
        <div className="mx-auto max-w-xl">
          <ErrorState message={error.message} onRetry={refetch} />
        </div>
      </div>
    );
  }

  const order = data?.order;
  if (!order) return null;

  return (
    <div className="container-page py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="text-center animate-fade-up">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-50 text-success ring-8 ring-green-50/50">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-success">
            Order {order.paymentStatus === 'paid' ? 'confirmed' : 'placed'}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Your food is on its way to being made.
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-ink-muted">
            {order.restaurant?.name} has received your order. You can follow each step from
            confirmation to delivery in your order timeline.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <StatusBadge status={order.orderStatus} />
            <PaymentBadge status={order.paymentStatus} />
            {order.paymentMethod === 'online' && order.paymentStatus === 'pending' ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                Payment pending
              </span>
            ) : null}
          </div>
        </div>

        <div className="card mt-8 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] px-5 py-4 sm:px-6">
            <div>
              <p className="text-xs text-ink-muted">Order number</p>
              <p className="text-sm font-bold tracking-wide">{order.orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-muted">Estimated arrival</p>
              <p className="text-sm font-bold">
                {formatDeliveryTime(order.restaurant?.deliveryTime) ||
                  `${order.estimatedDeliveryMinutes} min`}
              </p>
            </div>
          </div>

          <div className="grid gap-5 px-5 py-5 sm:grid-cols-[1.3fr_1fr] sm:px-6">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <ReceiptText className="h-4 w-4 text-brand-500" /> Order summary
              </h2>
              <ul className="mt-3 space-y-3">
                {order.items.map((item) => (
                  <li key={item.menuItem} className="flex items-center gap-3">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.name}
                      className="h-10 w-10 shrink-0 rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-ink-muted">× {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-1.5 border-t border-dashed border-black/10 pt-3 text-sm">
                <div className="flex justify-between text-ink-muted">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-ink-muted">
                  <span>Delivery + platform fee</span>
                  <span>{formatCurrency(order.deliveryFee + order.platformFee)}</span>
                </div>
                {order.discount > 0 ? (
                  <div className="flex justify-between text-success">
                    <span>Coupon {order.coupon?.code}</span>
                    <span>− {formatCurrency(order.discount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between pt-1 text-base font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-canvas p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-muted">
                  <MapPin className="h-3.5 w-3.5" /> Delivering to
                </p>
                <p className="mt-2 text-sm font-semibold">{order.deliveryAddress?.label}</p>
                <p className="mt-1 text-xs leading-5 text-ink-muted">
                  {[
                    order.deliveryAddress?.line1,
                    order.deliveryAddress?.line2,
                    order.deliveryAddress?.landmark,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                  <br />
                  {order.deliveryAddress?.city}, {order.deliveryAddress?.state}{' '}
                  {order.deliveryAddress?.pincode}
                </p>
              </div>
              <div className="rounded-2xl bg-canvas p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-muted">
                  <Clock3 className="h-3.5 w-3.5" /> Payment
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {order.paymentMethod === 'cod'
                    ? 'Pay cash or UPI when your order arrives.'
                    : order.paymentStatus === 'paid'
                      ? 'Online payment received.'
                      : 'Complete payment from the order details page.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            to={`/orders/${order._id}`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 text-sm font-bold text-white shadow-glow transition hover:bg-brand-600"
          >
            <Package className="h-4 w-4" /> Track this order
          </Link>
          <Link
            to="/orders"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-6 text-sm font-semibold transition hover:bg-black/[0.03]"
          >
            All orders <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/restaurants"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold text-ink-muted transition hover:text-ink"
          >
            <ChefHat className="h-4 w-4" /> Keep browsing
          </Link>
        </div>
      </div>
    </div>
  );
}
