import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BadgePercent,
  CalendarClock,
  Edit3,
  Plus,
  Power,
  Search,
  Ticket,
  X,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useToast } from '../../context/ToastContext.jsx';
import { adminService } from '../../services/adminService.js';
import { Input, Select, Textarea } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Modal, ConfirmDialog } from '../../components/common/Modal.jsx';
import { FormBanner, ErrorState } from '../../components/common/Feedback.jsx';
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
import { formatCurrency, formatDate, getApiError } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

const optionalNumber = (inner) =>
  z.union([z.literal(''), inner]).transform((value) => (value === '' ? null : value));

const schema = z
  .object({
    code: z
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9_-]{3,30}$/, 'Use 3-30 letters, numbers, dashes, or underscores')
      .transform((value) => value.toUpperCase()),
    description: z.string().trim().max(240).optional(),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.coerce.number().min(1, 'Discount must be positive').max(100000),
    minimumOrderAmount: z.coerce.number().min(0).max(1000000),
    maximumDiscount: optionalNumber(
      z.coerce.number().min(0, 'Cannot be negative').max(100000)
    ),
    expiryDate: z
      .string()
      .min(1, 'Expiry date is required')
      .refine((value) => !Number.isNaN(new Date(`${value}T23:59:59`).getTime()), 'Enter a valid date'),
    usageLimit: optionalNumber(z.coerce.number().int().min(1).max(1000000)),
    perUserLimit: z.coerce.number().int().min(1).max(100),
    isActive: z.boolean(),
  })
  .superRefine((data, context) => {
    if (data.discountType === 'percentage' && data.discountValue > 100) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountValue'],
        message: 'Percentage discounts cannot exceed 100',
      });
    }
  });

function dateInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function defaultsFor(coupon) {
  return {
    code: coupon?.code || '',
    description: coupon?.description || '',
    discountType: coupon?.discountType || 'percentage',
    discountValue: coupon?.discountValue ?? 20,
    minimumOrderAmount: coupon?.minimumOrderAmount ?? 0,
    maximumDiscount: coupon?.maximumDiscount ?? '',
    expiryDate: dateInputValue(coupon?.expiryDate),
    usageLimit: coupon?.usageLimit ?? '',
    perUserLimit: coupon?.perUserLimit ?? 1,
    isActive: coupon?.isActive ?? true,
  };
}

function CouponForm({ coupon, onSubmit, onCancel, busy, banner }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: defaultsFor(coupon) });

  const discountType = watch('discountType');

  function submit(values) {
    onSubmit({
      code: values.code,
      description: values.description || '',
      discountType: values.discountType,
      discountValue: values.discountValue,
      minimumOrderAmount: values.minimumOrderAmount,
      maximumDiscount: values.maximumDiscount,
      expiryDate: new Date(`${values.expiryDate}T23:59:59`).toISOString(),
      usageLimit: values.usageLimit,
      perUserLimit: values.perUserLimit,
      isActive: values.isActive,
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      {banner ? <FormBanner message={banner} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Coupon code"
          {...register('code')}
          error={errors.code?.message}
          placeholder="CRAVIO20"
          className="uppercase"
          hint="Customers enter this at cart and checkout."
        />
        <Input
          label="Description"
          {...register('description')}
          error={errors.description?.message}
          placeholder="20% off your order"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Discount type" {...register('discountType')} error={errors.discountType?.message}>
          <option value="percentage">Percentage off</option>
          <option value="fixed">Fixed amount off</option>
        </Select>
        <Input
          label={discountType === 'percentage' ? 'Discount (%)' : 'Discount (₹)'}
          type="number"
          step="1"
          min="1"
          max={discountType === 'percentage' ? 100 : 100000}
          {...register('discountValue')}
          error={errors.discountValue?.message}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Minimum order (₹)"
          type="number"
          min="0"
          {...register('minimumOrderAmount')}
          error={errors.minimumOrderAmount?.message}
          hint="Cart subtotal required before the coupon applies."
        />
        <Input
          label="Maximum discount (₹)"
          type="number"
          min="0"
          {...register('maximumDiscount')}
          error={errors.maximumDiscount?.message}
          hint={
            discountType === 'percentage'
              ? 'Caps a percentage discount. Leave blank for no cap.'
              : 'Optional for fixed discounts.'
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Expires on"
          type="date"
          {...register('expiryDate')}
          error={errors.expiryDate?.message}
          hint="Usable through the end of this date."
        />
        <Input
          label="Total uses"
          type="number"
          min="1"
          placeholder="Unlimited"
          {...register('usageLimit')}
          error={errors.usageLimit?.message}
          hint="Leave blank for unlimited."
        />
        <Input
          label="Uses per customer"
          type="number"
          min="1"
          max="100"
          {...register('perUserLimit')}
          error={errors.perUserLimit?.message}
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-black/20 text-brand-500 focus:ring-brand-500"
          {...register('isActive')}
        />
        Coupon is active
      </label>

      <div className="flex justify-end gap-3 border-t border-black/[0.06] pt-4">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={busy}>
          {coupon ? 'Save changes' : 'Create coupon'}
        </Button>
      </div>
    </form>
  );
}

export default function AdminCouponsPage() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [searchInput, setSearchInput] = useState(query);
  const debouncedSearch = useDebounce(searchInput, 350);

  const resource = useApi(
    () =>
      adminService.coupons({
        search: debouncedSearch || undefined,
        status,
        page,
        limit: 10,
      }),
    [debouncedSearch, status, page]
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState('');
  const [deactivating, setDeactivating] = useState(null);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (debouncedSearch) next.set('search', debouncedSearch);
    else next.delete('search');
    next.delete('page');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const coupons = resource.data?.data?.coupons || [];
  const meta = resource.data?.meta;

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next, { replace: true });
  }

  function openCreate() {
    setEditing(null);
    setBanner('');
    setModalOpen(true);
  }

  function openEdit(coupon) {
    setEditing(coupon);
    setBanner('');
    setModalOpen(true);
  }

  async function save(values) {
    setBusy(true);
    setBanner('');
    try {
      if (editing) await adminService.updateCoupon(editing._id, values);
      else await adminService.createCoupon(values);
      toast.success(editing ? 'Coupon updated.' : 'Coupon created.');
      setModalOpen(false);
      setEditing(null);
      resource.refetch();
    } catch (error) {
      setBanner(getApiError(error).message);
    } finally {
      setBusy(false);
    }
  }

  async function reactivate(coupon) {
    try {
      await adminService.updateCoupon(coupon._id, { isActive: true });
      toast.success(`${coupon.code} is active again.`);
      resource.refetch();
    } catch (error) {
      toast.error(getApiError(error).message);
    }
  }

  async function confirmDeactivate() {
    if (!deactivating) return;
    setBusy(true);
    try {
      await adminService.deactivateCoupon(deactivating._id);
      toast.success(`${deactivating.code} deactivated.`);
      setDeactivating(null);
      resource.refetch();
    } catch (error) {
      toast.error(getApiError(error).message);
    } finally {
      setBusy(false);
    }
  }

  const now = Date.now();
  const activeInView = coupons.filter(
    (coupon) => coupon.isActive && new Date(coupon.expiryDate).getTime() > now
  ).length;
  const redemptionsInView = coupons.reduce((sum, coupon) => sum + (coupon.usageCount || 0), 0);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Growth"
        title="Coupons"
        description="Create offers, control redemption limits, and retire campaigns when they end."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create coupon
          </Button>
        }
      />

      <AdminCard className="overflow-hidden">
        <AdminToolbar>
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-black/[0.08] px-3">
            <Search className="h-4 w-4 shrink-0 text-ink-muted" />
            <span className="sr-only">Search coupons</span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search code or description"
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
            aria-label="Filter by coupon status"
            className="h-10 min-w-40 py-0"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </AdminToolbar>

        {resource.loading ? (
          <AdminTableWrap>
            <AdminTable>
              <thead className="bg-canvas/60">
                <tr>
                  <Th>Coupon</Th>
                  <Th>Discount</Th>
                  <Th>Conditions</Th>
                  <Th>Expiry</Th>
                  <Th>Usage</Th>
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
                  <Th>Coupon</Th>
                  <Th>Discount</Th>
                  <Th>Conditions</Th>
                  <Th>Expiry</Th>
                  <Th>Usage</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              {coupons.length ? (
                <tbody>
                  {coupons.map((coupon) => {
                    const expired = new Date(coupon.expiryDate).getTime() <= now;
                    const depleted =
                      coupon.usageLimit !== null &&
                      coupon.usageLimit !== undefined &&
                      coupon.usageCount >= coupon.usageLimit;
                    return (
                      <tr key={coupon._id} className="border-t border-black/[0.05] hover:bg-canvas/40">
                        <Td>
                          <p className="font-mono text-xs font-bold tracking-wide text-ink">
                            {coupon.code}
                          </p>
                          <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-ink-muted">
                            {coupon.description || 'No description'}
                          </p>
                        </Td>
                        <Td>
                          <p className="font-semibold text-ink">
                            {coupon.discountType === 'percentage'
                              ? `${coupon.discountValue}% off`
                              : `${formatCurrency(coupon.discountValue)} off`}
                          </p>
                          {coupon.discountType === 'percentage' && coupon.maximumDiscount ? (
                            <p className="text-[11px] text-ink-muted">
                              up to {formatCurrency(coupon.maximumDiscount)}
                            </p>
                          ) : null}
                        </Td>
                        <Td>
                          <p className="text-xs text-ink-soft">
                            Min order {formatCurrency(coupon.minimumOrderAmount || 0)}
                          </p>
                          <p className="text-[11px] text-ink-muted">
                            {coupon.perUserLimit} use{coupon.perUserLimit === 1 ? '' : 's'} per customer
                          </p>
                        </Td>
                        <Td>
                          <p className={cn('text-xs', expired ? 'font-semibold text-danger' : 'text-ink-soft')}>
                            {formatDate(coupon.expiryDate)}
                          </p>
                          <p className="text-[11px] text-ink-muted">
                            {expired ? 'Expired' : 'Active through this date'}
                          </p>
                        </Td>
                        <Td>
                          <p className="text-xs font-semibold text-ink">
                            {coupon.usageCount || 0}
                            {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ' / ∞'}
                          </p>
                          <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-black/[0.06]">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                depleted ? 'bg-danger' : 'bg-brand-500'
                              )}
                              style={{
                                width: `${coupon.usageLimit ? Math.min(100, ((coupon.usageCount || 0) / coupon.usageLimit) * 100) : 8}%`,
                              }}
                            />
                          </div>
                        </Td>
                        <Td>
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                              !coupon.isActive
                                ? 'border-slate-200 bg-slate-100 text-slate-600'
                                : expired || depleted
                                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                                  : 'border-green-200 bg-green-50 text-green-700'
                            )}
                          >
                            {!coupon.isActive
                              ? 'Inactive'
                              : expired
                                ? 'Expired'
                                : depleted
                                  ? 'Limit reached'
                                  : 'Active'}
                          </span>
                        </Td>
                        <Td className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(coupon)}
                              className="rounded-lg p-2 text-ink-muted transition hover:bg-black/[0.05] hover:text-ink"
                              aria-label={`Edit ${coupon.code}`}
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            {coupon.isActive ? (
                              <button
                                type="button"
                                onClick={() => setDeactivating(coupon)}
                                className="rounded-lg p-2 text-ink-muted transition hover:bg-red-50 hover:text-danger"
                                aria-label={`Deactivate ${coupon.code}`}
                              >
                                <Power className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => reactivate(coupon)}
                                className="rounded-lg p-2 text-ink-muted transition hover:bg-green-50 hover:text-green-700"
                                aria-label={`Activate ${coupon.code}`}
                              >
                                <Power className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              ) : (
                <TableEmpty
                  colSpan={7}
                  title="No coupons found"
                  description="Create a coupon or adjust the filters to find an existing offer."
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
            <Ticket className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-ink-muted">Coupons in view</p>
            <p className="text-sm font-bold text-ink">{meta?.total ?? coupons.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-4 py-3 shadow-card">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-green-50 text-green-600">
            <BadgePercent className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-ink-muted">Ready to redeem in view</p>
            <p className="text-sm font-bold text-ink">{activeInView}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-4 py-3 shadow-card">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <CalendarClock className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-ink-muted">Redemptions in view</p>
            <p className="text-sm font-bold text-ink">{redemptionsInView}</p>
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? `Edit ${editing.code}` : 'Create a coupon'}
        description="Discount rules, limits, and expiry."
        size="lg"
      >
        <CouponForm
          key={editing?._id || 'new'}
          coupon={editing}
          onSubmit={save}
          onCancel={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          busy={busy}
          banner={banner}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deactivating)}
        onClose={() => setDeactivating(null)}
        onConfirm={confirmDeactivate}
        title={`Deactivate ${deactivating?.code || 'coupon'}?`}
        description="Customers will no longer be able to apply this coupon. Existing orders keep their discount. You can reactivate it later."
        confirmLabel="Deactivate coupon"
        isLoading={busy}
      />
    </div>
  );
}
