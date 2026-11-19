import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardList,
  Eye,
  PackageCheck,
  Search,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useToast } from '../../context/ToastContext.jsx';
import { adminService } from '../../services/adminService.js';
import { Select } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { ErrorState } from '../../components/common/Feedback.jsx';
import { PaymentBadge, StatusBadge } from '../../components/common/StatusBadge.jsx';
import {
  AdminCard,
  AdminPageHeader,
  AdminPagination,
  AdminTable,
  AdminTableWrap,
  AdminToolbar,
  TableEmpty,
  TableLoading,
  Td,
  Th,
} from './AdminUI.jsx';
import {
  ORDER_STATUS_META,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_META,
} from '../../utils/constants.js';
import { formatCurrency, formatDateTime, getApiError, titleCase } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

function OrderDetails({ order }) {
  const items = order.items || [];
  const history = [...(order.statusHistory || [])].reverse();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-extrabold tracking-tight text-ink">{order.orderNumber}</p>
          <p className="mt-1 text-xs text-ink-muted">
            Placed {formatDateTime(order.createdAt)} ·{' '}
            {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={order.orderStatus} />
          <PaymentBadge status={order.paymentStatus} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-black/[0.06] bg-canvas/50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Customer</p>
          <p className="mt-1 text-sm font-semibold text-ink">{order.contact?.name}</p>
          <p className="text-[11px] text-ink-muted">{order.contact?.phone}</p>
          <p className="truncate text-[11px] text-ink-muted">{order.contact?.email}</p>
        </div>
        <div className="rounded-xl border border-black/[0.06] bg-canvas/50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Restaurant</p>
          <p className="mt-1 text-sm font-semibold text-ink">{order.restaurant?.name || '—'}</p>
          <p className="text-[11px] text-ink-muted">{items.length} line items</p>
        </div>
        <div className="rounded-xl border border-black/[0.06] bg-canvas/50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Deliver to</p>
          <p className="mt-1 text-xs leading-5 text-ink-soft">
            {[order.deliveryAddress?.line1, order.deliveryAddress?.line2]
              .filter(Boolean)
              .join(', ')}
          </p>
          <p className="text-[11px] text-ink-muted">
            {[order.deliveryAddress?.landmark, order.deliveryAddress?.city]
              .filter(Boolean)
              .join(' · ')}{' '}
            {order.deliveryAddress?.pincode}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/[0.06]">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas/50">
            <tr>
              <Th>Item</Th>
              <Th className="text-center">Qty</Th>
              <Th className="text-right">Line total</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${item.menuItem}-${item.name}`} className="border-t border-black/[0.05]">
                <Td>
                  <p className="font-semibold text-ink">{item.name}</p>
                  <p className="text-[11px] capitalize text-ink-muted">
                    {item.foodType} · {formatCurrency(item.price)} each
                  </p>
                </Td>
                <Td className="text-center font-medium">×{item.quantity}</Td>
                <Td className="text-right font-semibold text-ink">
                  {formatCurrency(item.price * item.quantity)}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-black/[0.06] p-4">
          <p className="text-xs font-bold text-ink">Bill breakdown</p>
          <dl className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Item subtotal</dt>
              <dd className="font-medium">{formatCurrency(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Delivery fee</dt>
              <dd className="font-medium">{formatCurrency(order.deliveryFee)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Platform fee</dt>
              <dd className="font-medium">{formatCurrency(order.platformFee)}</dd>
            </div>
            {order.discount > 0 ? (
              <div className="flex justify-between gap-3 text-green-700">
                <dt>
                  Discount{order.coupon?.code ? ` (${order.coupon.code})` : ''}
                </dt>
                <dd className="font-medium">−{formatCurrency(order.discount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-3 border-t border-black/[0.06] pt-2 text-sm">
              <dt className="font-bold text-ink">Total</dt>
              <dd className="font-extrabold text-ink">{formatCurrency(order.total)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-black/[0.06] p-4">
          <p className="text-xs font-bold text-ink">Status history</p>
          {history.length ? (
            <ol className="mt-3 space-y-3">
              {history.map((entry, index) => (
                <li key={`${entry.status}-${entry.at}-${index}`} className="flex gap-2.5">
                  <span
                    className={cn(
                      'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                      entry.status === 'cancelled' ? 'bg-danger' : 'bg-brand-500'
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink">
                      {ORDER_STATUS_META[entry.status]?.label || titleCase(entry.status)}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      {formatDateTime(entry.at)}
                      {entry.note ? ` · ${entry.note}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-xs text-ink-muted">No status updates recorded yet.</p>
          )}
        </div>
      </div>

      {order.cancellation?.reason ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-xs text-red-700">
          <span className="font-bold">Cancellation reason:</span> {order.cancellation.reason}
        </div>
      ) : null}
    </div>
  );
}

function StatusUpdater({ order, onUpdated }) {
  const { toast } = useToast();
  const transitions = ORDER_STATUS_TRANSITIONS[order.orderStatus] || [];
  const [nextStatus, setNextStatus] = useState(transitions[0] || '');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function updateStatus() {
    if (!nextStatus) return;
    setBusy(true);
    try {
      const result = await adminService.updateOrderStatus(order._id, {
        status: nextStatus,
        note: note.trim(),
      });
      toast.success(
        nextStatus === 'cancelled'
          ? 'Order cancelled.'
          : `Order moved to ${ORDER_STATUS_META[nextStatus]?.label.toLowerCase() || nextStatus}.`
      );
      setNote('');
      onUpdated(result.data.order);
    } catch (error) {
      toast.error(getApiError(error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!transitions.length) {
    return (
      <div className="rounded-xl border border-black/[0.06] bg-canvas/50 px-4 py-3 text-xs text-ink-muted">
        This order is closed. No further status changes are available.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-black/[0.06] p-4">
      <p className="text-xs font-bold text-ink">Update order status</p>
      <p className="mt-1 text-[11px] text-ink-muted">
        Only valid transitions are shown. Customers see these updates in their order timeline.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Select
          value={nextStatus}
          onChange={(event) => setNextStatus(event.target.value)}
          aria-label="Next order status"
          className="h-10 py-0"
        >
          {transitions.map((status) => (
            <option key={status} value={status}>
              {ORDER_STATUS_META[status]?.label || titleCase(status)}
            </option>
          ))}
        </Select>
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={300}
          placeholder={nextStatus === 'cancelled' ? 'Cancellation reason (optional)' : 'Internal note (optional)'}
          className="input-base h-10 flex-1 py-2 text-sm"
        />
        <Button
          size="sm"
          variant={nextStatus === 'cancelled' ? 'danger' : 'primary'}
          onClick={updateStatus}
          isLoading={busy}
          disabled={!nextStatus}
          className="h-10 shrink-0"
        >
          {nextStatus === 'cancelled' ? 'Cancel order' : 'Apply status'}
        </Button>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const paymentStatus = searchParams.get('paymentStatus') || 'all';
  const restaurant = searchParams.get('restaurant') || '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [searchInput, setSearchInput] = useState(query);
  const debouncedSearch = useDebounce(searchInput, 350);

  const restaurantResource = useApi(
    () => adminService.restaurants({ page: 1, limit: 48, status: 'all' }),
    []
  );
  const restaurants = restaurantResource.data?.data?.restaurants || [];

  const resource = useApi(
    () =>
      adminService.orders({
        search: debouncedSearch || undefined,
        status,
        paymentStatus,
        restaurant: restaurant || undefined,
        page,
        limit: 10,
      }),
    [debouncedSearch, status, paymentStatus, restaurant, page]
  );

  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (debouncedSearch) next.set('search', debouncedSearch);
    else next.delete('search');
    next.delete('page');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const orders = resource.data?.data?.orders || [];
  const meta = resource.data?.meta;

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next, { replace: true });
  }

  function handleUpdated(order) {
    setSelected(order);
    resource.refetch();
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Operations"
        title="Orders"
        description="Track incoming orders, inspect details, and move fulfilment through valid status steps."
      />

      <AdminCard className="overflow-hidden">
        <AdminToolbar>
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-black/[0.08] px-3">
            <Search className="h-4 w-4 shrink-0 text-ink-muted" />
            <span className="sr-only">Search orders</span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Order number, customer, or phone"
              className="w-full bg-transparent text-sm outline-none placeholder:text-black/35"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                aria-label="Clear search"
                className="rounded p-0.5 text-ink-muted hover:bg-black/5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </label>
          <Select
            value={status}
            onChange={(event) => updateParam('status', event.target.value)}
            aria-label="Filter by order status"
            className="h-10 min-w-40 py-0"
          >
            <option value="all">All order statuses</option>
            {Object.entries(ORDER_STATUS_META).map(([value, metaInfo]) => (
              <option key={value} value={value}>
                {metaInfo.label}
              </option>
            ))}
          </Select>
          <Select
            value={paymentStatus}
            onChange={(event) => updateParam('paymentStatus', event.target.value)}
            aria-label="Filter by payment status"
            className="h-10 min-w-40 py-0"
          >
            <option value="all">All payment statuses</option>
            {Object.entries(PAYMENT_STATUS_META).map(([value, metaInfo]) => (
              <option key={value} value={value}>
                {metaInfo.label}
              </option>
            ))}
          </Select>
          <Select
            value={restaurant}
            onChange={(event) => updateParam('restaurant', event.target.value)}
            aria-label="Filter by restaurant"
            className="h-10 min-w-40 py-0"
          >
            <option value="">All restaurants</option>
            {restaurants.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </Select>
        </AdminToolbar>

        {resource.loading ? (
          <AdminTableWrap>
            <AdminTable>
              <thead className="bg-canvas/60">
                <tr>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Restaurant</Th>
                  <Th>Total</Th>
                  <Th>Payment</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <TableLoading rows={5} columns={7} />
            </AdminTable>
          </AdminTableWrap>
        ) : resource.error ? (
          <div className="p-5">
            <ErrorState message={resource.error.message} onRetry={resource.refetch} />
          </div>
        ) : (
          <AdminTableWrap>
            <AdminTable>
              <thead className="bg-canvas/60">
                <tr>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Restaurant</Th>
                  <Th>Total</Th>
                  <Th>Payment</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              {orders.length ? (
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="border-t border-black/[0.05] hover:bg-canvas/40">
                      <Td>
                        <button
                          type="button"
                          onClick={() => setSelected(order)}
                          className="text-left font-semibold text-ink hover:text-brand-600"
                        >
                          {order.orderNumber}
                        </button>
                        <p className="mt-0.5 text-[11px] text-ink-muted">
                          {formatDateTime(order.createdAt)} · {order.items?.length || 0} items
                        </p>
                      </Td>
                      <Td>
                        <p className="text-xs font-medium text-ink">
                          {order.customer?.name || order.contact?.name || 'Customer'}
                        </p>
                        <p className="text-[11px] text-ink-muted">
                          {order.customer?.email || order.contact?.email}
                        </p>
                        <p className="text-[11px] text-ink-muted">{order.contact?.phone}</p>
                      </Td>
                      <Td>
                        <p className="text-xs font-medium text-ink">{order.restaurant?.name || '—'}</p>
                      </Td>
                      <Td>
                        <p className="font-bold text-ink">{formatCurrency(order.total)}</p>
                        {order.discount > 0 ? (
                          <p className="text-[11px] text-green-700">
                            {formatCurrency(order.discount)} off
                          </p>
                        ) : null}
                      </Td>
                      <Td>
                        <PaymentBadge status={order.paymentStatus} />
                        <p className="mt-1 text-[11px] text-ink-muted">
                          {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
                        </p>
                      </Td>
                      <Td>
                        <StatusBadge status={order.orderStatus} />
                      </Td>
                      <Td className="text-right">
                        <button
                          type="button"
                          onClick={() => setSelected(order)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-2.5 py-1.5 text-[11px] font-bold text-ink transition hover:bg-black/[0.03]"
                        >
                          <Eye className="h-3.5 w-3.5" /> Manage
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <TableEmpty
                  colSpan={7}
                  title="No orders found"
                  description="Adjust the filters or wait for the next order to arrive."
                />
              )}
            </AdminTable>
          </AdminTableWrap>
        )}
      </AdminCard>

      {meta ? (
        <AdminPagination
          page={page}
          totalPages={meta.totalPages}
          onChange={(nextPage) => updateParam('page', String(nextPage))}
        />
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-4 py-3 shadow-card">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <ClipboardList className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-ink-muted">Orders in view</p>
            <p className="text-sm font-bold text-ink">{orders.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-4 py-3 shadow-card">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <ShoppingBag className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-ink-muted">Pending payments</p>
            <p className="text-sm font-bold text-ink">
              {orders.filter((order) => order.paymentStatus === 'pending').length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-4 py-3 shadow-card">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-green-50 text-green-600">
            <PackageCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-ink-muted">Value in view</p>
            <p className="text-sm font-bold text-ink">
              {formatCurrency(orders.reduce((sum, order) => sum + order.total, 0))}
            </p>
          </div>
        </div>
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Order details"
        description="Full order record with customer, delivery, billing, and fulfilment controls."
        size="xl"
      >
        {selected ? (
          <div className="space-y-5">
            <OrderDetails order={selected} />
            <StatusUpdater
              key={`${selected._id}-${selected.orderStatus}`}
              order={selected}
              onUpdated={handleUpdated}
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
