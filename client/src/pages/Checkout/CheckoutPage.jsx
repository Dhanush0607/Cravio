import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Check,
  CreditCard,
  MapPin,
  Plus,
  ShieldCheck,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { userService } from '../../services/userService.js';
import { orderService } from '../../services/orderService.js';
import { paymentService } from '../../services/paymentService.js';
import { OrderSummary } from '../../components/cart/OrderSummary.jsx';
import { AddressForm } from '../../components/common/AddressForm.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Input } from '../../components/common/Input.jsx';
import { EmptyState, FormBanner, PageLoader } from '../../components/common/Feedback.jsx';
import { ImageWithFallback } from '../../components/common/ImageWithFallback.jsx';
import { PAYMENT_METHODS } from '../../utils/constants.js';
import { formatCurrency, getApiError } from '../../utils/format.js';
import { loadRazorpayScript } from '../../utils/razorpay.js';
import { cn } from '../../utils/cn.js';

const paymentIcons = {
  cod: Banknote,
  online: CreditCard,
};

function addressLine(address) {
  return [address.line1, address.line2, address.landmark, address.city, address.state]
    .filter(Boolean)
    .join(', ');
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const {
    restaurant,
    items,
    coupon,
    totals,
    isEmpty,
    clearCart,
  } = useCart();

  const idempotencyKey = useRef(
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `cravio-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  const submittingRef = useRef(false);

  const addressesResource = useApi(() => userService.addresses(), []);
  const paymentConfigResource = useApi(() => paymentService.config(), []);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [devPayment, setDevPayment] = useState(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!addressesResource.data) return;
    const list = addressesResource.data.addresses || [];
    setAddresses(list);
    const preferred = list.find((address) => address.isDefault) || list[0];
    setSelectedAddressId((current) => current || preferred?._id || '');
  }, [addressesResource.data]);

  const paymentProvider = paymentConfigResource.data?.provider;

  const payableItems = useMemo(
    () => items.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity })),
    [items]
  );

  const belowMinimum = totals.subtotal < (restaurant?.minOrder || 0);

  const finalizePaidOrder = useCallback(
    (orderId, message) => {
      clearCart();
      toast.success(message);
      navigate(`/order-success/${orderId}`, { replace: true });
    },
    [clearCart, navigate, toast]
  );

  async function handleAddAddress(values) {
    setAddingAddress(true);
    try {
      const response = await userService.addAddress(values);
      const nextAddresses = response.data.addresses || [];
      setAddresses(nextAddresses);
      const newest = nextAddresses[nextAddresses.length - 1];
      if (newest) setSelectedAddressId(newest._id);
      setAddAddressOpen(false);
      await refreshUser();
      toast.success('Address saved.');
    } catch (requestError) {
      toast.error(getApiError(requestError).message);
    } finally {
      setAddingAddress(false);
    }
  }

  async function startOnlinePayment(order) {
    const payment = await paymentService.create(order._id);

    if (payment.checkout.mode === 'development') {
      setDevPayment({ order, checkout: payment.checkout, payment: payment.payment });
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
          name: user?.name || '',
          email: user?.email || '',
          contact: contactPhone,
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
            finalizePaidOrder(order._id, 'Payment successful. Your order is confirmed.');
            resolve();
          } catch (requestError) {
            reject(requestError);
          }
        },
        modal: {
          ondismiss: () => {
            resolve();
            toast.info('Payment cancelled. Your order is saved — you can pay from order details.');
            navigate(`/orders/${order._id}`, { replace: true });
          },
        },
      });

      checkout.on('payment.failed', (response) => {
        reject(new Error(response.error?.description || 'The payment could not be completed.'));
      });

      checkout.open();
    }).catch((paymentError) => {
      setError(getApiError(paymentError).message);
      navigate(`/orders/${order._id}`, { replace: true });
    });
  }

  async function placeOrder() {
    if (submittingRef.current) return;

    setError('');
    if (!selectedAddressId) {
      setError('Choose a delivery address before placing your order.');
      return;
    }
    if (!/^\+?[0-9]{10,15}$/.test(contactPhone.trim())) {
      setError('Enter a valid contact phone number for delivery updates.');
      return;
    }
    if (belowMinimum) {
      setError('Add a few more items to meet this restaurant’s minimum order value.');
      return;
    }

    submittingRef.current = true;
    setPlacing(true);

    try {
      const response = await orderService.create(
        {
          restaurantId: restaurant.id,
          items: payableItems,
          addressId: selectedAddressId,
          paymentMethod,
          couponCode: coupon?.code || undefined,
          contactPhone: contactPhone.trim(),
          idempotencyKey: idempotencyKey.current,
        },
        idempotencyKey.current
      );

      const order = response.data.order;
      clearCart();

      if (paymentMethod === 'cod') {
        finalizePaidOrder(order._id, 'Order placed. Pay cash or UPI on delivery.');
        return;
      }

      await startOnlinePayment(order);
    } catch (requestError) {
      setError(getApiError(requestError).message);
      submittingRef.current = false;
    } finally {
      setPlacing(false);
    }
  }

  async function confirmDevPayment() {
    if (!devPayment) return;
    setVerifying(true);
    setError('');
    try {
      await paymentService.verify({
        orderId: devPayment.order._id,
        providerOrderId: devPayment.checkout.providerOrderId,
      });
      const orderId = devPayment.order._id;
      setDevPayment(null);
      finalizePaidOrder(orderId, 'Test payment successful. Your order is confirmed.');
    } catch (requestError) {
      setError(getApiError(requestError).message);
    } finally {
      setVerifying(false);
    }
  }

  if (isEmpty && !devPayment) {
    return (
      <div className="container-page py-12 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <EmptyState
            icon={MapPin}
            title="Nothing to check out yet"
            description="Add dishes from a restaurant before heading to checkout."
            action={
              <Link
                to="/restaurants"
                className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                Find something to eat
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  if (addressesResource.loading) {
    return <PageLoader label="Preparing secure checkout…" />;
  }

  const onlineDisabled = paymentProvider && !paymentProvider.enabled;

  return (
    <div className="container-page py-8 sm:py-12">
      <Link
        to="/cart"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted transition hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to cart
      </Link>

      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Secure checkout</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Complete your order</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Prices, offers, and availability are verified by the server before your order is created.
        </p>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.55fr_1fr] lg:items-start">
        <div className="space-y-5">
          <section className="card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-bold">
                <MapPin className="h-5 w-5 text-brand-500" /> Delivery address
              </h2>
              <button
                type="button"
                onClick={() => setAddAddressOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-black/[0.03]"
              >
                <Plus className="h-3.5 w-3.5" /> Add new
              </button>
            </div>

            {addresses.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {addresses.map((address) => {
                  const active = address._id === selectedAddressId;
                  return (
                    <button
                      key={address._id}
                      type="button"
                      onClick={() => setSelectedAddressId(address._id)}
                      className={cn(
                        'rounded-2xl border p-4 text-left transition',
                        active
                          ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/15'
                          : 'border-black/10 bg-white hover:border-black/20'
                      )}
                      aria-pressed={active}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                          {address.label}
                        </span>
                        {active ? (
                          <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-white">
                            <Check className="h-3 w-3" />
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-soft">
                        {addressLine(address)}
                      </p>
                      <p className="mt-1 text-xs text-ink-muted">{address.pincode}</p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-black/10 px-4 py-8 text-center">
                <p className="text-sm font-semibold">No saved addresses yet</p>
                <p className="mt-1 text-xs text-ink-muted">
                  Add a delivery address to continue with your order.
                </p>
                <Button className="mt-4" size="sm" onClick={() => setAddAddressOpen(true)}>
                  <Plus className="h-4 w-4" /> Add address
                </Button>
              </div>
            )}
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Smartphone className="h-5 w-5 text-brand-500" /> Contact number
            </h2>
            <p className="mt-1 text-xs text-ink-muted">
              The delivery partner will use this number to reach you.
            </p>
            <Input
              className="mt-4"
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value)}
              placeholder="+91 98765 43210"
              inputMode="tel"
              maxLength={15}
              aria-label="Contact phone number"
            />
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Wallet className="h-5 w-5 text-brand-500" /> Payment method
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {PAYMENT_METHODS.map((method) => {
                const Icon = paymentIcons[method.value];
                const disabled = method.value === 'online' && onlineDisabled;
                const active = paymentMethod === method.value;
                return (
                  <button
                    key={method.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => setPaymentMethod(method.value)}
                    className={cn(
                      'rounded-2xl border p-4 text-left transition',
                      active
                        ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/15'
                        : 'border-black/10 bg-white hover:border-black/20',
                      disabled && 'cursor-not-allowed opacity-50'
                    )}
                    aria-pressed={active}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-sm font-bold">
                        <Icon className="h-4 w-4" /> {method.title}
                      </span>
                      {active ? (
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-ink-muted">
                      {method.value === 'online' && paymentProvider?.notice
                        ? paymentProvider.notice
                        : method.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {paymentProvider ? (
              <p
                className={cn(
                  'mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium',
                  paymentProvider.mode === 'razorpay'
                    ? 'bg-green-50 text-green-700'
                    : paymentProvider.mode === 'development'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                )}
              >
                <BadgeCheck className="h-4 w-4" />
                {paymentProvider.mode === 'development'
                  ? 'TEST MODE — online payments are simulated; no real money is charged.'
                  : paymentProvider.label}
              </p>
            ) : null}
          </section>

          <div className="flex items-start gap-2.5 rounded-2xl border border-black/[0.06] bg-white/60 px-4 py-3 text-xs leading-5 text-ink-muted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            Your session is protected with HttpOnly cookies and CSRF verification. Cravio never
            stores card details.
          </div>

          {error ? <FormBanner message={error} /> : null}
        </div>

        <OrderSummary
          totals={totals}
          coupon={coupon}
          title="Your order"
          className="lg:sticky lg:top-28"
          footer={
            <Button
              fullWidth
              size="lg"
              isLoading={placing}
              disabled={!addresses.length || belowMinimum || (paymentMethod === 'online' && onlineDisabled)}
              onClick={placeOrder}
            >
              {paymentMethod === 'cod'
                ? `Place order · ${formatCurrency(totals.total)}`
                : `Pay ${formatCurrency(totals.total)}`}
            </Button>
          }
        >
          <div className="space-y-2.5 rounded-xl bg-canvas p-3">
            {items.map((item) => (
              <div key={item.menuItemId} className="flex items-center gap-2.5">
                <ImageWithFallback
                  src={item.image}
                  alt={item.name}
                  className="h-9 w-9 shrink-0 rounded-lg"
                />
                <p className="min-w-0 flex-1 truncate text-xs text-ink-soft">{item.name}</p>
                <span className="text-xs font-semibold text-ink-muted">× {item.quantity}</span>
                <span className="w-16 text-right text-xs font-bold">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </OrderSummary>
      </div>

      <Modal
        open={addAddressOpen}
        onClose={() => setAddAddressOpen(false)}
        title="Add a delivery address"
        description="We use this address only for this and future orders."
        size="lg"
      >
        <AddressForm
          onSubmit={handleAddAddress}
          onCancel={() => setAddAddressOpen(false)}
          submitLabel={addingAddress ? 'Saving…' : 'Save address'}
        />
      </Modal>

      <Modal
        open={Boolean(devPayment)}
        onClose={() => {
          setDevPayment(null);
          if (devPayment?.order?._id) navigate(`/orders/${devPayment.order._id}`);
        }}
        title="Development test payment"
        description="Razorpay is not configured, so this payment is simulated."
        size="sm"
      >
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          <p className="font-bold">TEST MODE — no real money will be charged.</p>
          <p className="mt-1 text-xs">
            This confirms the full online payment flow in development. Configure
            <code className="mx-1 rounded bg-white/70 px-1">RAZORPAY_KEY_ID</code> and
            <code className="mx-1 rounded bg-white/70 px-1">RAZORPAY_KEY_SECRET</code> for real
            payments.
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-canvas px-4 py-3 text-sm">
          <span className="text-ink-muted">Amount payable</span>
          <span className="font-bold">{formatCurrency(devPayment?.order?.total || 0)}</span>
        </div>
        {error ? <div className="mt-3"><FormBanner message={error} /></div> : null}
        <div className="mt-5 flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setDevPayment(null);
              if (devPayment?.order?._id) navigate(`/orders/${devPayment.order._id}`);
            }}
          >
            Pay later
          </Button>
          <Button onClick={confirmDevPayment} isLoading={verifying}>
            Pay {formatCurrency(devPayment?.order?.total || 0)} (test)
          </Button>
        </div>
      </Modal>
    </div>
  );
}
