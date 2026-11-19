import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Ban, CheckCircle2, Search, UserCheck, Users, X } from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useToast } from '../../context/ToastContext.jsx';
import { adminService } from '../../services/adminService.js';
import { Select } from '../../components/common/Input.jsx';
import { ConfirmDialog } from '../../components/common/Modal.jsx';
import { ErrorState } from '../../components/common/Feedback.jsx';
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
import { formatCurrency, formatDate, getApiError, getInitials } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

export default function AdminCustomersPage() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [searchInput, setSearchInput] = useState(query);
  const debouncedSearch = useDebounce(searchInput, 350);

  const resource = useApi(
    () =>
      adminService.customers({
        search: debouncedSearch || undefined,
        status,
        page,
        limit: 10,
      }),
    [debouncedSearch, status, page]
  );

  const [changing, setChanging] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (debouncedSearch) next.set('search', debouncedSearch);
    else next.delete('search');
    next.delete('page');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const customers = resource.data?.data?.customers || [];
  const meta = resource.data?.meta;

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next, { replace: true });
  }

  async function confirmStatusChange() {
    if (!changing) return;
    setBusy(true);
    try {
      await adminService.updateCustomerStatus(changing._id, !changing.isActive);
      toast.success(
        changing.isActive
          ? `${changing.name} can no longer sign in.`
          : `${changing.name} can sign in again.`
      );
      setChanging(null);
      resource.refetch();
    } catch (error) {
      toast.error(getApiError(error).message);
    } finally {
      setBusy(false);
    }
  }

  const activeInView = customers.filter((customer) => customer.isActive).length;
  const spendInView = customers.reduce((sum, customer) => sum + (customer.totalSpent || 0), 0);

  return (
    <div>
      <AdminPageHeader
        eyebrow="People"
        title="Customers"
        description="Review customer accounts, order activity, and access to the storefront."
      />

      <AdminCard className="overflow-hidden">
        <AdminToolbar>
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-black/[0.08] px-3">
            <Search className="h-4 w-4 shrink-0 text-ink-muted" />
            <span className="sr-only">Search customers</span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search name, email, or phone"
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
            aria-label="Filter by account status"
            className="h-10 min-w-40 py-0"
          >
            <option value="all">All accounts</option>
            <option value="active">Active</option>
            <option value="inactive">Disabled</option>
          </Select>
        </AdminToolbar>

        {resource.loading ? (
          <AdminTableWrap>
            <AdminTable>
              <thead className="bg-canvas/60">
                <tr>
                  <Th>Customer</Th>
                  <Th>Contact</Th>
                  <Th>Joined</Th>
                  <Th>Orders</Th>
                  <Th>Total spent</Th>
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
                  <Th>Customer</Th>
                  <Th>Contact</Th>
                  <Th>Joined</Th>
                  <Th>Orders</Th>
                  <Th>Total spent</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              {customers.length ? (
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer._id} className="border-t border-black/[0.05] hover:bg-canvas/40">
                      <Td>
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              'grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white',
                              customer.isActive ? 'bg-ink' : 'bg-slate-400'
                            )}
                          >
                            {getInitials(customer.name) || 'C'}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink">{customer.name}</p>
                            <p className="truncate text-[11px] text-ink-muted">{customer.email}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <p className="text-xs text-ink">{customer.phone || '—'}</p>
                        <p className="text-[11px] text-ink-muted">
                          {customer.addresses?.length
                            ? `${customer.addresses.length} saved address${customer.addresses.length === 1 ? '' : 'es'}`
                            : 'No saved addresses'}
                        </p>
                      </Td>
                      <Td className="text-xs text-ink-muted">{formatDate(customer.createdAt)}</Td>
                      <Td>
                        <span className="font-semibold text-ink">{customer.orderCount || 0}</span>
                      </Td>
                      <Td className="font-semibold text-ink">
                        {formatCurrency(customer.totalSpent || 0)}
                      </Td>
                      <Td>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                            customer.isActive
                              ? 'border-green-200 bg-green-50 text-green-700'
                              : 'border-red-200 bg-red-50 text-red-700'
                          )}
                        >
                          {customer.isActive ? (
                            <UserCheck className="h-3 w-3" />
                          ) : (
                            <Ban className="h-3 w-3" />
                          )}
                          {customer.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </Td>
                      <Td className="text-right">
                        <button
                          type="button"
                          onClick={() => setChanging(customer)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition',
                            customer.isActive
                              ? 'border-red-200 text-danger hover:bg-red-50'
                              : 'border-green-200 text-green-700 hover:bg-green-50'
                          )}
                        >
                          {customer.isActive ? (
                            <>
                              <Ban className="h-3.5 w-3.5" /> Disable
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Enable
                            </>
                          )}
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <TableEmpty
                  colSpan={7}
                  title="No customers found"
                  description="Adjust the filters or invite customers to place their first order."
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
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-600">
            <Users className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-ink-muted">Total customers</p>
            <p className="text-sm font-bold text-ink">{meta?.total ?? customers.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-4 py-3 shadow-card">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-green-50 text-green-600">
            <UserCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-ink-muted">Active in view</p>
            <p className="text-sm font-bold text-ink">{activeInView}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-4 py-3 shadow-card">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <Users className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-ink-muted">Customer spend in view</p>
            <p className="text-sm font-bold text-ink">{formatCurrency(spendInView)}</p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(changing)}
        onClose={() => setChanging(null)}
        onConfirm={confirmStatusChange}
        title={
          changing?.isActive
            ? `Disable ${changing?.name || 'customer'}?`
            : `Re-enable ${changing?.name || 'customer'}?`
        }
        description={
          changing?.isActive
            ? 'The customer will be signed out and cannot place new orders or sign in until re-enabled. Order history is preserved.'
            : 'The customer will be able to sign in and place orders again.'
        }
        confirmLabel={changing?.isActive ? 'Disable account' : 'Enable account'}
        variant={changing?.isActive ? 'danger' : 'primary'}
        isLoading={busy}
      />
    </div>
  );
}
