import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit3, Plus, Search, Store, Trash2, X } from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useToast } from '../../context/ToastContext.jsx';
import { adminService } from '../../services/adminService.js';
import { ImageField } from '../../components/admin/ImageField.jsx';
import { Input, Select, Textarea } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Modal, ConfirmDialog } from '../../components/common/Modal.jsx';
import { FormBanner, ErrorState } from '../../components/common/Feedback.jsx';
import { ImageWithFallback } from '../../components/common/ImageWithFallback.jsx';
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
import { CITIES } from '../../utils/constants.js';
import { formatCurrency, getApiError } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

const schema = z
  .object({
    name: z.string().trim().min(2, 'Name is required').max(100),
    description: z.string().trim().min(10, 'Use at least 10 characters').max(800),
    image: z.string().trim().min(1, 'Cover image is required').max(600),
    bannerImage: z.string().trim().min(1, 'Banner image is required').max(600),
    cuisines: z.string().trim().min(2, 'Add at least one cuisine').max(300),
    tags: z.string().trim().max(300).optional(),
    rating: z.coerce.number().min(0, '0 or more').max(5, '5 or less'),
    ratingCount: z.coerce.number().int().min(0),
    deliveryMin: z.coerce.number().int().min(5).max(180),
    deliveryMax: z.coerce.number().int().min(5).max(240),
    deliveryFee: z.coerce.number().min(0).max(500),
    minOrder: z.coerce.number().min(0).max(10000),
    priceForTwo: z.coerce.number().min(0).max(50000),
    offer: z.string().trim().max(120).optional(),
    line1: z.string().trim().min(3, 'Address is required').max(180),
    area: z.string().trim().min(2, 'Area is required').max(100),
    city: z.string().trim().min(2).max(80),
    state: z.string().trim().min(2).max(80),
    pincode: z.string().trim().regex(/^\d{6}$/, 'Use a 6-digit pincode'),
    featured: z.boolean(),
    isOpen: z.boolean(),
    isActive: z.boolean(),
  })
  .refine((data) => data.deliveryMax >= data.deliveryMin, {
    path: ['deliveryMax'],
    message: 'Maximum must be at least the minimum',
  });

function defaultsFor(restaurant) {
  return {
    name: restaurant?.name || '',
    description: restaurant?.description || '',
    image: restaurant?.image || '',
    bannerImage: restaurant?.bannerImage || '',
    cuisines: restaurant?.cuisines?.join(', ') || '',
    tags: restaurant?.tags?.join(', ') || '',
    rating: restaurant?.rating ?? 4.2,
    ratingCount: restaurant?.ratingCount ?? 0,
    deliveryMin: restaurant?.deliveryTime?.min ?? 25,
    deliveryMax: restaurant?.deliveryTime?.max ?? 40,
    deliveryFee: restaurant?.deliveryFee ?? 29,
    minOrder: restaurant?.minOrder ?? 149,
    priceForTwo: restaurant?.priceForTwo ?? 400,
    offer: restaurant?.offer || '',
    line1: restaurant?.address?.line1 || '',
    area: restaurant?.address?.area || '',
    city: restaurant?.address?.city || 'Bengaluru',
    state: restaurant?.address?.state || 'Karnataka',
    pincode: restaurant?.address?.pincode || '',
    featured: restaurant?.featured ?? false,
    isOpen: restaurant?.isOpen ?? true,
    isActive: restaurant?.isActive ?? true,
  };
}

function RestaurantForm({ restaurant, onSubmit, onCancel, busy, banner }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: defaultsFor(restaurant) });

  const image = watch('image');
  const bannerImage = watch('bannerImage');
  const city = watch('city');

  function changeCity(nextCity) {
    const match = CITIES.find((item) => item.name === nextCity);
    setValue('city', nextCity, { shouldValidate: true });
    if (match) setValue('state', match.state, { shouldValidate: true });
  }

  function submit(values) {
    onSubmit({
      name: values.name,
      description: values.description,
      image: values.image,
      bannerImage: values.bannerImage,
      cuisines: values.cuisines
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      tags: (values.tags || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      rating: values.rating,
      ratingCount: values.ratingCount,
      deliveryTime: { min: values.deliveryMin, max: values.deliveryMax },
      deliveryFee: values.deliveryFee,
      minOrder: values.minOrder,
      priceForTwo: values.priceForTwo,
      offer: values.offer || '',
      address: {
        line1: values.line1,
        area: values.area,
        city: values.city,
        state: values.state,
        pincode: values.pincode,
      },
      featured: values.featured,
      isOpen: values.isOpen,
      isActive: values.isActive,
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      {banner ? <FormBanner message={banner} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Restaurant name" {...register('name')} error={errors.name?.message} />
        <Input label="Offer line (optional)" {...register('offer')} error={errors.offer?.message} />
      </div>
      <Textarea
        label="Description"
        rows={3}
        {...register('description')}
        error={errors.description?.message}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <ImageField
          label="Cover image"
          value={image}
          onChange={(value) => setValue('image', value, { shouldValidate: true })}
          hint="Used on menu and listing cards."
          required
        />
        <ImageField
          label="Banner image"
          value={bannerImage}
          onChange={(value) => setValue('bannerImage', value, { shouldValidate: true })}
          hint="Used on the restaurant header."
          required
        />
      </div>
      {errors.image?.message ? <p className="-mt-3 text-xs text-danger">{errors.image.message}</p> : null}
      {errors.bannerImage?.message ? (
        <p className="-mt-3 text-xs text-danger">{errors.bannerImage.message}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Cuisines"
          placeholder="North Indian, Biryani"
          hint="Comma separated"
          {...register('cuisines')}
          error={errors.cuisines?.message}
        />
        <Input
          label="Tags"
          placeholder="Bestseller, Family friendly"
          hint="Comma separated"
          {...register('tags')}
          error={errors.tags?.message}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Input label="Rating" type="number" step="0.1" {...register('rating')} error={errors.rating?.message} />
        <Input label="Rating count" type="number" {...register('ratingCount')} error={errors.ratingCount?.message} />
        <Input label="Delivery min" type="number" {...register('deliveryMin')} error={errors.deliveryMin?.message} />
        <Input label="Delivery max" type="number" {...register('deliveryMax')} error={errors.deliveryMax?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Delivery fee (₹)" type="number" {...register('deliveryFee')} error={errors.deliveryFee?.message} />
        <Input label="Minimum order (₹)" type="number" {...register('minOrder')} error={errors.minOrder?.message} />
        <Input label="Price for two (₹)" type="number" {...register('priceForTwo')} error={errors.priceForTwo?.message} />
      </div>

      <div className="rounded-2xl border border-black/[0.07] p-4">
        <p className="mb-3 text-sm font-bold">Location</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Address line" {...register('line1')} error={errors.line1?.message} />
          <Input label="Area" {...register('area')} error={errors.area?.message} />
          <Select label="City" value={city} onChange={(event) => changeCity(event.target.value)}>
            {CITIES.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </Select>
          <Input label="State" {...register('state')} error={errors.state?.message} />
          <Input label="Pincode" maxLength={6} {...register('pincode')} error={errors.pincode?.message} />
        </div>
      </div>

      <div className="flex flex-wrap gap-5">
        {[
          { key: 'isActive', label: 'Listed on Cravio' },
          { key: 'isOpen', label: 'Accepting orders now' },
          { key: 'featured', label: 'Featured restaurant' },
        ].map(({ key, label }) => (
          <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-black/20 text-brand-500 focus:ring-brand-500"
              {...register(key)}
            />
            {label}
          </label>
        ))}
      </div>

      <div className="flex justify-end gap-3 border-t border-black/[0.06] pt-4">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={busy}>
          {restaurant ? 'Save changes' : 'Create restaurant'}
        </Button>
      </div>
    </form>
  );
}

export default function AdminRestaurantsPage() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [searchInput, setSearchInput] = useState(query);
  const debouncedSearch = useDebounce(searchInput, 350);

  const resource = useApi(
    () => adminService.restaurants({ search: debouncedSearch || undefined, status, page, limit: 10 }),
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

  const restaurants = resource.data?.data?.restaurants || [];
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

  function openEdit(restaurant) {
    setEditing(restaurant);
    setBanner('');
    setModalOpen(true);
  }

  async function save(values) {
    setBusy(true);
    setBanner('');
    try {
      if (editing) await adminService.updateRestaurant(editing._id, values);
      else await adminService.createRestaurant(values);
      toast.success(editing ? 'Restaurant updated.' : 'Restaurant created.');
      setModalOpen(false);
      setEditing(null);
      resource.refetch();
    } catch (error) {
      setBanner(getApiError(error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleOpen(restaurant) {
    try {
      await adminService.updateRestaurant(restaurant._id, { isOpen: !restaurant.isOpen });
      toast.success(restaurant.isOpen ? 'Restaurant closed for orders.' : 'Restaurant opened for orders.');
      resource.refetch();
    } catch (error) {
      toast.error(getApiError(error).message);
    }
  }

  async function deactivate() {
    if (!deactivating) return;
    setBusy(true);
    try {
      await adminService.deactivateRestaurant(deactivating._id);
      toast.success('Restaurant deactivated.');
      setDeactivating(null);
      resource.refetch();
    } catch (error) {
      toast.error(getApiError(error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Restaurants"
        description="Create listings, manage availability, and keep delivery details accurate."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add restaurant
          </Button>
        }
      />

      <AdminCard className="overflow-hidden">
        <AdminToolbar>
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-black/[0.08] px-3">
            <Search className="h-4 w-4 shrink-0 text-ink-muted" />
            <span className="sr-only">Search restaurants</span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by name, cuisine, or city"
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
            aria-label="Filter by status"
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
                  <Th>Restaurant</Th>
                  <Th>Location</Th>
                  <Th>Delivery</Th>
                  <Th>Rating</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <TableLoading rows={5} columns={6} />
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
                  <Th>Restaurant</Th>
                  <Th>Location</Th>
                  <Th>Delivery</Th>
                  <Th>Rating</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              {restaurants.length ? (
                <tbody>
                  {restaurants.map((restaurant) => (
                    <tr key={restaurant._id} className="border-t border-black/[0.05] hover:bg-canvas/40">
                      <Td>
                        <div className="flex items-center gap-3">
                          <ImageWithFallback
                            src={restaurant.image}
                            alt={restaurant.name}
                            className="h-11 w-11 shrink-0 rounded-xl"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink">{restaurant.name}</p>
                            <p className="truncate text-[11px] text-ink-muted">
                              {restaurant.cuisines?.join(' · ')}
                            </p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <p className="text-xs font-medium text-ink">{restaurant.address?.area}</p>
                        <p className="text-[11px] text-ink-muted">{restaurant.address?.city}</p>
                      </Td>
                      <Td>
                        <p className="text-xs">
                          {restaurant.deliveryTime?.min}–{restaurant.deliveryTime?.max} min
                        </p>
                        <p className="text-[11px] text-ink-muted">
                          {formatCurrency(restaurant.deliveryFee)} fee · min{' '}
                          {formatCurrency(restaurant.minOrder)}
                        </p>
                      </Td>
                      <Td>
                        <span className="inline-flex items-center gap-1 rounded-md bg-green-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                          {Number(restaurant.rating || 0).toFixed(1)}
                        </span>
                        <p className="mt-0.5 text-[11px] text-ink-muted">{restaurant.ratingCount} ratings</p>
                      </Td>
                      <Td>
                        <div className="flex flex-col gap-1">
                          <span
                            className={cn(
                              'inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                              restaurant.isActive
                                ? 'border-green-200 bg-green-50 text-green-700'
                                : 'border-red-200 bg-red-50 text-red-700'
                            )}
                          >
                            {restaurant.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleOpen(restaurant)}
                            className={cn(
                              'inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                              restaurant.isOpen
                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                : 'border-amber-200 bg-amber-50 text-amber-700'
                            )}
                          >
                            {restaurant.isOpen ? 'Open now' : 'Closed'}
                          </button>
                        </div>
                      </Td>
                      <Td className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(restaurant)}
                            className="rounded-lg p-2 text-ink-muted transition hover:bg-black/[0.05] hover:text-ink"
                            aria-label={`Edit ${restaurant.name}`}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={!restaurant.isActive}
                            onClick={() => setDeactivating(restaurant)}
                            className="rounded-lg p-2 text-ink-muted transition hover:bg-red-50 hover:text-danger disabled:opacity-30"
                            aria-label={`Deactivate ${restaurant.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <TableEmpty
                  colSpan={6}
                  title="No restaurants found"
                  description="Adjust the filters or add a new restaurant."
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

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? `Edit ${editing.name}` : 'Add a restaurant'}
        description="Listing information, delivery rules, and availability."
        size="xl"
      >
        <RestaurantForm
          key={editing?._id || 'new'}
          restaurant={editing}
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
        onConfirm={deactivate}
        title={`Deactivate ${deactivating?.name || 'restaurant'}?`}
        description="The restaurant will be hidden from customers and closed for new orders. Historical orders remain available."
        confirmLabel="Deactivate restaurant"
        isLoading={busy}
      />
    </div>
  );
}
