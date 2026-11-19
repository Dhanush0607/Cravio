import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeIndianRupee,
  CheckCircle2,
  ClipboardList,
  RefreshCw,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { adminService } from '../../services/adminService.js';
import { ErrorState, Skeleton } from '../../components/common/Feedback.jsx';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  AdminTableWrap,
  StatCard,
  TableEmpty,
  TableLoading,
  Td,
  Th,
} from './AdminUI.jsx';
import { ORDER_STATUS_META, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_META } from '../../utils/constants.js';
import { formatCurrency, formatDateTime } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

const statusBarTones = {
  pending: 'bg-amber-400',
  confirmed: 'bg-blue-400',
  preparing: 'bg-brand-400',
  out_for_delivery: 'bg-violet-400',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-400',
};

export default function AdminDashboardPage() {
  const { data, loading, error, refetch } = useApi(() => adminService.dashboard(), []);

  if (loading) {
    return (
      <div>
        <AdminPageHeader eyebrow="Overview" title="Dashboard" description="Loading today’s operations snapshot…" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <AdminPageHeader eyebrow="Overview" title="Dashboard" />
        <ErrorState message={error.message} onRetry={refetch} />
      </div>
    );
  }

  const stats = data.stats;
  const sales = data.salesOverview || [];
  const maxRevenue = Math.max(...sales.map((day) => day.revenue), 1);
  const statusCounts = data.statusCounts || {};
  const totalStatusOrders = Object.values(statusCounts).reduce((sum, count) => sum + count, 0) || 1;

  const statCards = [
    {
      label: 'Total revenue',
      value: formatCurrency(stats.totalRevenue),
      hint: 'All non-cancelled orders',
      icon: BadgeIndianRupee,
      tone: 'brand',
    },
    {
      label: 'Total orders',
      value: stats.totalOrders,
      hint: `${stats.completedOrders} delivered`,
      icon: ClipboardList,
      tone: 'blue',
    },
    {
      label: 'Pending orders',
      value: stats.pendingOrders,
      hint: 'Awaiting confirmation',
      icon: TrendingUp,
      tone: 'amber',
    },
    {
      label: 'Customers',
      value: stats.totalCustomers,
      hint: 'Registered customer accounts',
      icon: Users,
      tone: 'violet',
    },
    {
      label: 'Restaurants',
      value: stats.totalRestaurants,
      hint: 'Listed in the platform',
      icon: Store,
      tone: 'green',
    },
    {
      label: 'Completed',
      value: stats.completedOrders,
      hint: 'Delivered orders',
      icon: CheckCircle2,
      tone: 'green',
    },
  ];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="A live snapshot of orders, revenue, customers, and operations across Cravio."
        actions={
          <button
            type="button"
            onClick={refetch}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-black/10 bg-white px-3.5 text-xs font-semibold transition hover:bg-black/[0.03]"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Refresh
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <AdminCard className="p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-bold">Revenue · last 7 days</h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                Non-cancelled order value, grouped by day.
              </p>
            </div>
            <p className="text-sm font-bold">{formatCurrency(sales.reduce((sum, day) => sum + day.revenue, 0))}</p>
          </div>

          <div className="mt-6 flex h-52 items-end gap-2 sm:gap-3">
            {sales.map((day) => {
              const height = day.revenue > 0 ? Math.max(8, Math.round((day.revenue / maxRevenue) * 100)) : 3;
              return (
                <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="flex h-full w-full items-end">
                    <div
                      className={cn(
                        'w-full rounded-t-lg transition-all',
                        day.revenue > 0
                          ? 'bg-gradient-to-t from-brand-500 to-brand-300'
                          : 'bg-black/[0.06]'
                      )}
                      style={{ height: `${height}%` }}
                      title={`${formatCurrency(day.revenue)} · ${day.orders} orders`}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-semibold text-ink-muted">
                      {new Date(`${day.date}T00:00:00Z`).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        timeZone: 'UTC',
                      })}
                    </p>
                    <p className="text-[10px] text-ink-muted">{day.orders} ord</p>
                  </div>
                </div>
              );
            })}
          </div>
        </AdminCard>

        <AdminCard className="p-5">
          <h2 className="text-base font-bold">Order status mix</h2>
          <p className="mt-0.5 text-xs text-ink-muted">Share of every order ever placed.</p>

          <div className="mt-5 space-y-3.5">
            {Object.keys(ORDER_STATUS_META).map((status) => {
              const count = statusCounts[status] || 0;
              const percent = Math.round((count / totalStatusOrders) * 100);
              return (
                <div key={status}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-ink-soft">{ORDER_STATUS_META[status].label}</span>
                    <span className="text-ink-muted">
                      {count} · {percent}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/[0.05]">
                    <div
                      className={cn('h-full rounded-full', statusBarTones[status])}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl bg-canvas p-3.5">
            <p className="text-xs font-semibold text-ink">Need attention</p>
            <p className="mt-1 text-[11px] leading-5 text-ink-muted">
              {stats.pendingOrders > 0
                ? `${stats.pendingOrders} order${stats.pendingOrders === 1 ? '' : 's'} waiting for confirmation.`
                : 'No pending orders. Everything is moving.'}
            </p>
            <Link
              to="/admin/orders?status=pending"
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              Open order queue <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </AdminCard>
      </div>

      <AdminCard className="mt-5 overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-base font-bold">Recent orders</h2>
            <p className="mt-0.5 text-xs text-ink-muted">The latest activity across the platform.</p>
          </div>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
          >
            All orders <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <AdminTableWrap>
          <AdminTable>
            <thead className="bg-canvas/60">
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Restaurant</Th>
                <Th>Total</Th>
                <Th>Status</Th>
                <Th>Placed</Th>
                <Th> </Th>
              </tr>
            </thead>
            {data.recentOrders?.length ? (
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr key={order._id} className="border-t border-black/[0.05] hover:bg-canvas/40">
                    <Td>
                      <Link
                        to={`/admin/orders?search=${encodeURIComponent(order.orderNumber)}`}
                        className="font-semibold text-ink hover:text-brand-600"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-ink-muted">
                        {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod} ·{' '}
                        {PAYMENT_STATUS_META[order.paymentStatus]?.label || order.paymentStatus}
                      </p>
                    </Td>
                    <Td>
                      <p className="font-medium text-ink">{order.customer?.name || 'Deleted customer'}</p>
                      <p className="text-[11px] text-ink-muted">{order.customer?.email}</p>
                    </Td>
                    <Td>{order.restaurant?.name || '—'}</Td>
                    <Td className="font-bold text-ink">{formatCurrency(order.total)}</Td>
                    <Td>
                      <StatusBadge status={order.orderStatus} />
                    </Td>
                    <Td className="text-xs text-ink-muted">{formatDateTime(order.createdAt)}</Td>
                    <Td>
                      <Link
                        to={`/admin/orders?search=${encodeURIComponent(order.orderNumber)}`}
                        className="text-xs font-bold text-brand-600 hover:text-brand-700"
                      >
                        Manage
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <TableEmpty colSpan={7} title="No orders yet" description="New orders will appear here." />
            )}
          </AdminTable>
        </AdminTableWrap>
      </AdminCard>
    </div>
  );
}
