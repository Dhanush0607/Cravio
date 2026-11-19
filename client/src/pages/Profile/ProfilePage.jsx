import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'react-router-dom';
import {
  Check,
  KeyRound,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  User,
  UserRound,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { userService } from '../../services/userService.js';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Modal, ConfirmDialog } from '../../components/common/Modal.jsx';
import { AddressForm } from '../../components/common/AddressForm.jsx';
import { FormBanner, PageLoader, ErrorState, EmptyState } from '../../components/common/Feedback.jsx';
import { getInitials, getApiError, fieldErrors } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, 'Enter a valid phone number with 10-15 digits'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Use at least 8 characters')
      .max(72, 'Password cannot exceed 72 characters')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

const tabs = [
  { value: 'profile', label: 'Profile', icon: UserRound },
  { value: 'addresses', label: 'Addresses', icon: MapPin },
  { value: 'security', label: 'Security', icon: KeyRound },
];

function ProfileForm() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [banner, setBanner] = useState('');
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', phone: user?.phone || '' },
  });

  async function onSubmit(values) {
    setBanner('');
    setSaved(false);
    try {
      await userService.updateProfile(values);
      await refreshUser();
      setSaved(true);
      toast.success('Profile updated.');
    } catch (requestError) {
      const apiError = getApiError(requestError);
      setBanner(apiError.message);
      const details = fieldErrors(requestError);
      Object.entries(details).forEach(([field, message]) => {
        if (field === 'name' || field === 'phone') setError(field, { message });
      });
    }
  }

  return (
    <div>
      <h2 className="text-lg font-bold">Personal details</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Keep your contact details up to date so delivery updates reach you.
      </p>

      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-canvas p-3.5">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-sm font-bold text-white">
          {getInitials(user?.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{user?.name}</p>
          <p className="truncate text-xs text-ink-muted">{user?.email}</p>
        </div>
        <span className="ml-auto rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold capitalize text-green-700">
          {user?.role}
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
        {banner ? <FormBanner message={banner} /> : null}
        <Input label="Full name" {...register('name')} error={errors.name?.message} />
        <Input
          label="Phone number"
          inputMode="tel"
          {...register('phone')}
          error={errors.phone?.message}
        />
        <div>
          <label className="label">Email address</label>
          <input value={user?.email || ''} disabled className="input-base bg-black/[0.03]" />
          <p className="mt-1.5 text-xs text-ink-muted">
            Email changes require support verification and are disabled here.
          </p>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" isLoading={isSubmitting}>
            Save changes
          </Button>
          {saved ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function PasswordForm() {
  const { toast } = useToast();
  const [banner, setBanner] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  async function onSubmit(values) {
    setBanner('');
    setSuccess('');
    try {
      const response = await userService.changePassword(values);
      setSuccess(response.message);
      toast.success('Password changed.');
      reset();
    } catch (requestError) {
      const apiError = getApiError(requestError);
      setBanner(apiError.message);
      const details = fieldErrors(requestError);
      Object.entries(details).forEach(([field, message]) => {
        if (['currentPassword', 'newPassword', 'confirmPassword'].includes(field)) {
          setError(field, { message });
        }
      });
    }
  }

  return (
    <div>
      <h2 className="text-lg font-bold">Password & security</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Changing your password signs out other sessions that use older credentials.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 max-w-md space-y-4">
        {banner ? <FormBanner message={banner} /> : null}
        {success ? (
          <div className="rounded-xl border border-success/15 bg-green-50 px-4 py-3 text-sm text-green-800">
            {success}
          </div>
        ) : null}
        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          {...register('currentPassword')}
          error={errors.currentPassword?.message}
        />
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters with uppercase, lowercase, and a number."
          {...register('newPassword')}
          error={errors.newPassword?.message}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />
        <Button type="submit" isLoading={isSubmitting}>
          Update password
        </Button>
      </form>

      <div className="mt-7 flex items-start gap-3 rounded-2xl border border-black/[0.06] bg-canvas p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
        <div>
          <p className="text-sm font-semibold">Session protection</p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            Cravio uses HttpOnly cookies, CSRF verification, hashed passwords, and rate limiting to
            protect your account.
          </p>
        </div>
      </div>
    </div>
  );
}

function Addresses() {
  const { toast } = useToast();
  const resource = useApi(() => userService.addresses(), []);
  const [addresses, setAddresses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState('');

  useEffect(() => {
    if (resource.data) setAddresses(resource.data.addresses || []);
  }, [resource.data]);

  function openAdd() {
    setEditing(null);
    setBanner('');
    setModalOpen(true);
  }

  function openEdit(address) {
    setEditing(address);
    setBanner('');
    setModalOpen(true);
  }

  async function saveAddress(values) {
    setBusy(true);
    setBanner('');
    try {
      const response = editing
        ? await userService.updateAddress(editing._id, values)
        : await userService.addAddress(values);
      setAddresses(response.data.addresses || []);
      setModalOpen(false);
      setEditing(null);
      toast.success(editing ? 'Address updated.' : 'Address added.');
    } catch (requestError) {
      setBanner(getApiError(requestError).message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteAddress() {
    if (!deleting) return;
    setBusy(true);
    try {
      const response = await userService.deleteAddress(deleting._id);
      setAddresses(response.data.addresses || []);
      setDeleting(null);
      toast.success('Address removed.');
    } catch (requestError) {
      toast.error(getApiError(requestError).message);
    } finally {
      setBusy(false);
    }
  }

  if (resource.loading) return <PageLoader label="Loading your addresses…" />;
  if (resource.error) return <ErrorState message={resource.error.message} onRetry={resource.refetch} />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Saved addresses</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Save up to nine addresses for faster checkout.
          </p>
        </div>
        <Button size="sm" onClick={openAdd} disabled={addresses.length >= 9}>
          <Plus className="h-4 w-4" /> Add address
        </Button>
      </div>

      {addresses.length ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <div
              key={address._id}
              className={cn(
                'rounded-2xl border p-4',
                address.isDefault ? 'border-brand-300 bg-brand-50/40' : 'border-black/[0.08] bg-white'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                  {address.label}
                </span>
                {address.isDefault ? (
                  <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Default
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                {[address.line1, address.line2, address.landmark].filter(Boolean).join(', ')}
                <br />
                {address.city}, {address.state} {address.pincode}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(address)}
                  className="inline-flex items-center gap-1 rounded-lg border border-black/10 px-2.5 py-1.5 text-xs font-semibold transition hover:bg-black/[0.03]"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(address)}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-danger transition hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState
            icon={MapPin}
            title="No addresses saved"
            description="Add your home or office address to make checkout quick and consistent."
            action={
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" /> Add your first address
              </Button>
            }
          />
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Edit address' : 'Add a new address'}
        size="lg"
      >
        {banner ? <div className="mb-4"><FormBanner message={banner} /></div> : null}
        <AddressForm
          defaultValues={
            editing
              ? {
                  label: editing.label,
                  line1: editing.line1,
                  line2: editing.line2 || '',
                  landmark: editing.landmark || '',
                  city: editing.city,
                  state: editing.state,
                  pincode: editing.pincode,
                  isDefault: editing.isDefault,
                }
              : undefined
          }
          onSubmit={saveAddress}
          onCancel={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          submitLabel={busy ? 'Saving…' : editing ? 'Update address' : 'Save address'}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={deleteAddress}
        title="Remove this address?"
        description="You can add it again later. Orders already placed keep their delivery address snapshot."
        confirmLabel="Remove address"
        isLoading={busy}
      />
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = tabs.some((item) => item.value === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'profile';

  function selectTab(value) {
    const next = new URLSearchParams(searchParams);
    if (value === 'profile') next.delete('tab');
    else next.set('tab', value);
    setSearchParams(next, { replace: true });
  }

  const current = useMemo(() => tabs.find((item) => item.value === tab), [tab]);

  return (
    <div className="container-page py-8 sm:py-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Your account</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Profile & settings</h1>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
        <aside className="card p-3 lg:sticky lg:top-28">
          <div className="flex items-center gap-3 rounded-2xl bg-canvas p-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-sm font-bold text-white">
              {getInitials(user?.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-ink-muted">{user?.email}</p>
            </div>
          </div>
          <nav className="mt-3 space-y-1" aria-label="Profile sections">
            {tabs.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => selectTab(value)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition',
                  tab === value
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-soft hover:bg-black/[0.04]'
                )}
                aria-current={tab === value ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </nav>
          <div className="mt-3 border-t border-black/[0.06] px-3 pb-2 pt-4 text-xs text-ink-muted">
            <p className="flex items-center gap-1.5 font-semibold text-ink-soft">
              <User className="h-3.5 w-3.5" /> {user?.role === 'admin' ? 'Administrator' : 'Customer'}
            </p>
            <p className="mt-1">Member since {new Date(user?.createdAt || Date.now()).getFullYear()}</p>
          </div>
        </aside>

        <section className="card p-5 sm:p-7">
          <div className="mb-5 flex items-center gap-2 border-b border-black/[0.06] pb-4">
            {current ? <current.icon className="h-5 w-5 text-brand-500" /> : null}
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">
              {current?.label}
            </span>
          </div>
          {tab === 'profile' ? <ProfileForm /> : null}
          {tab === 'addresses' ? <Addresses /> : null}
          {tab === 'security' ? <PasswordForm /> : null}
        </section>
      </div>
    </div>
  );
}
