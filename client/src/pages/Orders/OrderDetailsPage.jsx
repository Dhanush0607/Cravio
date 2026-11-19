import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Bike,
  Check,
  ChefHat,
  Circle,
  Clock3,
  CreditCard,
  Headphones,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  ReceiptText,
  XCircle,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { orderService } from '../../services/orderService.js';
import { paymentService } from '../../services/paymentService.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { PageLoader, ErrorState, FormBanner } from '../../components/common/Feedback.jsx';
import { StatusBadge, PaymentBadge } from '../../components/common/StatusBadge.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Button } from '../../components/common/Button.jsx';
import { ImageWithFallback } from '../../components/common/ImageWithFallback.jsx';
import { ORDER_STATUS_FLOW, ORDER_STATUS_META, PAYMENT_METHOD_LABELS } from '../../utils/constants.js';
import { formatCurrency, formatDateTime, getApiError, titleCase } from '../../utils/format.js';
import { loadRazorpayScript } from '../../utils/razorpay.js';
import { cn } from '../../utils/cn.js';

const statusStepIcon = {
  pending: ReceiptText,
  confirmed: Check,
  preparing: ChefHat,
  out_for_delivery: Bike,
  delivered: Package,
};

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const resource = useApi(() => orderService.get(orderId), [orderId]);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [devPayment, setDevPayment] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const order = resource.data?.order;

  if (resource.loading) return <PageLoader label="Loading order details…" />;
  if (resource.error) {
    return (
      <div className="container-page py-12">
        <div className="mx-auto max-w-xl">
          <ErrorState message={resource.error.message} onRetry={resource.refetch} />
        </div>
      </div>
    );
  }
  if (!order) return null;

  const historyByStatus = new Map();
  for (const entry of order.statusHistory || []) {
    historyByStatus.set(entry.status, entry);
  }
  const isCancelled = order.orderStatus === 'cancelled';
  const canCancel = ['pending', 'confirmed'].includes(order.orderStatus);
  const canPay =
    order.paymentMethod === 'online' &&
    order.paymentStatus !== 'paid' &&
    order.orderStatus !== 'cancelled';

  async function submitCancellation() {
    if (cancelReason.trim().length < 5) {
      setError('Please provide a short reason (at least 5 characters).');
      return;
    }
    setCancelling(true);
    setError('');
    try {
      await orderService.cancel(order._id, cancelReason.trim());
      setCancelOpen(false);
      setCancelReason('');
      toast.success('Your order has been cancelled.');
      resource.refetch();
    } catch (requestError) {
      setError(getApiError(requestError).message);
    } finally {
      setCancelling(false);
    }
  }

  async function retryPayment() {
    setPaying(true);
    setError('');
    try {
      const payment = await paymentService.create(order._id);

      if (payment.checkout.mode === 'development') {
        setDevPayment({ payment: payment.payment, checkout: payment.checkout });
        return;
      }

      await loadRazorpayScript();

      await new Promise((resolve, reject) => {
        const checkout = new window.Razorpay({
          key: payment.checkout.keyId,
          amount: payment.checkout.amount,
          currency: payment.checkout.currency,
          name: payment.checkout.name,
          description: payment.checkout.description,
          order_id: payment.checkout.providerOrderId,
          prefill: {
            name: order.contact?.name || user?.name || '',
            email: order.contact?.email || user?.email || '',
            contact: order.contact?.phone || user?.phone || '',
          },
          theme: { color: '#ff6b35' },
          handler: async (response) => {
            try {
              await paymentService.verify({
                orderId: order._id,
                providerOrderId: payment.checkout.providerOrderId,
                providerPaymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });
              toast.success('Payment received. Your order is confirmed.');
              resource.refetch();
              resolve();
            } catch (requestError) {
              reject(requestError);
            }
          },
          modal: {
            ondismiss: () => {
              toast.info('Payment cancelled. You can try again when ready.');
              resolve();
            },
          },
        });

        checkout.on('payment.failed', (response) => {
          reject(new Error(response.error?.description || 'The payment could not be completed.'));
        });

        checkout.open();
      });
    } catch (requestError) {
      setError(getApiError(requestError).message);
    } finally {
      setPaying(false);
    }
  }

  async function confirmDevPayment() {
    if (!devPayment) return;
    setVerifying(true);
    setError('');
    try {
      await paymentService.verify({
        orderId: order._id,
        providerOrderId: devPayment.checkout.providerOrderId,
      });
      setDevPayment(null);
      toast.success('Test payment successful. Your order is confirmed.');
      resource.refetch();
    } catch (requestError) {
      setError(getApiError(requestError).message);
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> All orders
        </Link>
        <button
          type="button"
          onClick={resource.refetch}
          className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-semibold transition hover:bg-black/[0.03]"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', resource.loading && 'animate-spin')} /> Refresh status
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={order.orderStatus} />
            <PaymentBadge status={order.paymentStatus} />
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {order.restaurant?.name}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Order {order.orderNumber} · placed {formatDateTime(order.createdAt)}
          </p>
        </div>
        {canCancel ? (
          <Button variant="secondary" onClick={() => setCancelOpen(true)}>
            <XCircle className="h-4 w-4" /> Cancel order
          </Button>
        ) : null}
      </div>

      {error ? <div className="mt-4"><FormBanner message={error} /></div> : null}

      {order.paymentMethod === 'online' && order.paymentStatus === 'pending' ? (
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-bold">Payment is still pending</p>
              <p className="mt-0.5 text-xs">
                Your order is saved. Complete the online payment to keep it moving.
              </p>
            </div>
          </div>
          <Button size="sm" isLoading={paying} onClick={retryPayment} disabled={!canPay}>
            <CreditCard className="h-4 w-4" /> Pay {formatCurrency(order.total)}
          </Button>
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="space-y-5">
          <section className="card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Bike className="h-5 w-5 text-brand-500" /> Order timeline
            </h2>

            {isCancelled ? (
              <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
                <div className="flex items-start gap-2.5">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
                  <div>
                    <p className="text-sm font-bold text-red-800">Order cancelled</p>
                    <p className="mt-1 text-xs leading-5 text-red-700">
                      {order.cancellation?.reason || 'This order was cancelled.'}
                    </p>
                    {order.cancellation?.at ? (
                      <p className="mt-1 text-[11px] text-red-600">
                        {formatDateTime(order.cancellation.at)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <ol className="mt-5 space-y-0">
                {ORDER_STATUS_FLOW.map((status, index) => {
                  const entry = historyByStatus.get(status);
                  const isCurrent = order.orderStatus === status;
                  const isDone = Boolean(entry) && !isCurrent;
                  const Icon = statusStepIcon[status] || Circle;
                  const meta = ORDER_STATUS_META[status];
                  return (
                    <li key={status} className="flex gap-3.5">
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            'grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 transition',
                            isCurrent
                              ? 'border-brand-500 bg-brand-500 text-white shadow-glow'
                              : isDone
                                ? 'border-success bg-success text-white'
                                : 'border-black/10 bg-white text-ink-muted'
                          )}
                        >
                          {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                        </span>
                        {index < ORDER_STATUS_FLOW.length - 1 ? (
                          <span
                            className={cn('my-1 h-10 w-0.5', isDone ? 'bg-success' : 'bg-black/10')}
                            aria-hidden="true"
                          />
                        ) : null}
                      </div>
                      <div className={cn('pb-4', index === ORDER_STATUS_FLOW.length - 1 && 'pb-0')}>
                        <p
                          className={cn(
                            'text-sm font-semibold',
                            isCurrent ? 'text-brand-700' : isDone ? 'text-ink' : 'text-ink-muted'
                          )}
                        >
                          {meta.label}
                          {isCurrent ? (
                            <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700">
                              Current
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-xs leading-5 text-ink-muted">
                          {entry?.note || meta.description}
                        </p>
                        {entry?.at ? (
                          <p className="mt-0.5 text-[11px] text-ink-muted">{formatDateTime(entry.at)}</p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-5 py-4 sm:px-6">
              <h2 className="flex items-center gap-2 text-base font-bold">
                <ReceiptText className="h-5 w-5 text-brand-500" /> Items
              </h2>
              <span className="text-xs text-ink-muted">{order.items.length} dishes</span>
            </div>
            <ul className="divide-y divide-black/[0.05]">
              {order.items.map((item) => (
                <li key={item.menuItem} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.name}
                    className="h-12 w-12 shrink-0 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-ink-muted">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-bold">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="space-y-2 border-t border-black/[0.06] bg-canvas/60 px-5 py-4 text-sm sm:px-6">
              <div className="flex justify-between text-ink-muted">
                <span>Item subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Delivery fee</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Platform fee</span>
                <span>{formatCurrency(order.platformFee)}</span>
              </div>
              {order.discount > 0 ? (
                <div className="flex justify-between text-success">
                  <span>Coupon {order.coupon?.code}</span>
                  <span>− {formatCurrency(order.discount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-dashed border-black/10 pt-2 text-base font-bold">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28">
          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <MapPin className="h-4 w-4 text-brand-500" /> Delivery address
            </h2>
            <p className="mt-3 text-sm font-semibold">{order.deliveryAddress?.label}</p>
            <p className="mt-1 text-sm leading-6 text-ink-muted">
              {[order.deliveryAddress?.line1, order.deliveryAddress?.line2]
                .filter(Boolean)
                .join(', ')}
              <br />
              {order.deliveryAddress?.landmark ? `${order.deliveryAddress.landmark}, ` : ''}
              {order.deliveryAddress?.city}, {order.deliveryAddress?.state}{' '}
              {order.deliveryAddress?.pincode}
            </p>
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Phone className="h-4 w-4 text-brand-500" /> Contact
            </h2>
            <p className="mt-3 text-sm font-semibold">{order.contact?.name}</p>
            <p className="mt-1 text-xs text-ink-muted">{order.contact?.phone}</p>
            <p className="text-xs text-ink-muted">{order.contact?.email}</p>
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <CreditCard className="h-4 w-4 text-brand-500" /> Payment
            </h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-muted">Method</span>
                <span className="font-semibold">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Status</span>
                <span className="font-semibold">{titleCase(order.paymentStatus)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Amount</span>
                <span className="font-bold">{formatCurrency(order.total)}</span>
              </div>
            </div>
            {canPay ? (
              <Button className="mt-4" fullWidth size="sm" onClick={retryPayment} isLoading={paying}>
                Complete payment
              </Button>
            ) : null}
          </section>

          <section className="rounded-2xl border border-dashed border-black/10 bg-white/60 p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Headphones className="h-4 w-4 text-brand-500" /> Need help?
            </h2>
            <p className="mt-2 text-xs leading-5 text-ink-muted">
              If something looks wrong with this order, contact support with your order number and we
              will review it.
            </p>
            <Link
              to="/info/help"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Visit help centre <Clock3 className="h-3.5 w-3.5" />
            </Link>
          </section>
        </aside>
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => {
          setCancelOpen(false);
          setError('');
        }}
        title="Cancel this order?"
        description="Cancellation is only available before the restaurant starts preparing your food."
        size="sm"
      >
        <label htmlFor="cancel-reason" className="label">
          Reason for cancellation
        </label>
        <textarea
          id="cancel-reason"
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
          rows={3}
          maxLength={300}
          placeholder="e.g. Ordered by mistake, changed my mind"
          className="input-base resize-y"
        />
        {error ? <div className="mt-3"><FormBanner message={error} /></div> : null}
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setCancelOpen(false)}>
            Keep order
          </Button>
          <Button variant="danger" isLoading={cancelling} onClick={submitCancellation}>
            Cancel order
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(devPayment)}
        onClose={() => setDevPayment(null)}
        title="Development test payment"
        description="Razorpay is not configured, so this payment is simulated."
        size="sm"
      >
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          <p className="font-bold">TEST MODE — no real money will be charged.</p>
          <p className="mt-1 text-xs">
            Configure Razorpay credentials to enable real online payments in production.
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-canvas px-4 py-3 text-sm">
          <span className="text-ink-muted">Amount payable</span>
          <span className="font-bold">{formatCurrency(order.total)}</span>
        </div>
        {error ? <div className="mt-3"><FormBanner message={error} /></div> : null}
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDevPayment(null)}>
            Not now
          </Button>
          <Button isLoading={verifying} onClick={confirmDevPayment}>
            Pay {formatCurrency(order.total)} (test)
          </Button>
        </div>
      </Modal>
    </div>
  );
}
