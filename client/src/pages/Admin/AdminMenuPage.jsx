import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit3, Plus, Search, Trash2, X } from 'lucide-react';
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
import { FOOD_TYPE_META } from '../../utils/constants.js';
import { formatCurrency, getApiError } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

const schema = z.object({
  restaurant: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Choose a restaurant'),
  name: z.string().trim().min(2, 'Name is required').max(120),
  description: z.string().trim().min(5, 'Use at least 5 characters').max(500),
  image: z.string().trim().min(1, 'Dish image is required').max(600),
  price: z.coerce.number().min(1, 'Price must be greater than zero').max(100000),
  category: z.string().trim().min(2, 'Add a category').max(80),
  foodType: z.enum(['veg', 'non-veg', 'egg']),
  preparationTime: z.coerce.number().int().min(1).max(120),
  isAvailable: z.boolean(),
  isRecommended: z.boolean(),
});

function restaurantIdOf(item) {
  if (!item?.restaurant) return '';
  return typeof item.restaurant === 'string' ? item.restaurant : item.restaurant._id;
}

function defaultsFor(item, defaultRestaurant) {
  return {
    restaurant: restaurantIdOf(item) || defaultRestaurant || '',
    name: item?.name || '',
    description: item?.description || '',
    image: item?.image || '',
    price: item?.price ?? 249,
    category: item?.category || '',
    foodType: item?.foodType || 'veg',
    preparationTime: item?.preparationTime ?? 15,
    isAvailable: item?.isAvailable ?? true,
    isRecommended: item?.isRecommended ?? false,
  };
}

function MenuItemForm({ item, restaurants, defaultRestaurant, onSubmit, onCancel, busy, banner }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultsFor(item, defaultRestaurant),
  });

  const image = watch('image');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {banner ? <FormBanner message={banner} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Restaurant" {...register('restaurant')} error={errors.restaurant?.message}>
          <option value="">Select a restaurant</option>
          {restaurants.map((restaurant) => (
            <option key={restaurant._id} value={restaurant._id}>
              {restaurant.name}
              {restaurant.isActive ? '' : ' (inactive)'}
            </option>
          ))}
        </Select>
        <Input
          label="Dish name"
          {...register('name')}
          error={errors.name?.message}
          placeholder="Paneer butter masala"
        />
      </div>

      <Textarea
        label="Description"
        rows={3}
        {...register('description')}
        error={errors.description?.message}
        placeholder="What makes this dish special?"
      />

      <ImageField
        label="Dish image"
        value={image}
        onChange={(value) => setValue('image', value, { shouldValidate: true })}
        hint="Upload a square image for the best result."
        required
      />
      {errors.image?.message ? <p className="-mt-3 text-xs text-danger">{errors.image.message}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Price (₹)"
          type="number"
          step="1"
          min="1"
          {...register('price')}
          error={errors.price?.message}
        />
        <Input
          label="Category"
          {...register('category')}
          error={errors.category?.message}
          placeholder="Starters, Biryani, Desserts"
          hint="Menu sections are grouped by this label."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Food type" {...register('foodType')} error={errors.foodType?.message}>
          <option value="veg">Vegetarian</option>
          <option value="egg">Contains egg</option>
          <option value="non-veg">Non-vegetarian</option>
        </Select>
        <Input
          label="Preparation time (minutes)"
          type="number"
          min="1"
          max="120"
          {...register('preparationTime')}
          error={errors.preparationTime?.message}
        />
      </div>

      <div className="flex flex-wrap gap-5">
        {[
          { key: 'isAvailable', label: 'Available to order' },
          { key: 'isRecommended', label: 'Recommended dish' },
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
          {item ? 'Save changes' : 'Create menu item'}
        </Button>
      </div>
    </form>
  );
}

export default function AdminMenuPage() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('search') || '';
  const availability = searchParams.get('availability') || 'all';
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
      adminService.menu({
        search: debouncedSearch || undefined,
        availability,
        restaurant: restaurant || undefined,
        page,
        limit: 10,
      }),
    [debouncedSearch, availability, restaurant, page]
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (debouncedSearch) next.set('search', debouncedSearch);
    else next.delete('search');
    next.delete('page');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const items = resource.data?.data?.items || [];
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

  function openEdit(item) {
    setEditing(item);
    setBanner('');
    setModalOpen(true);
  }

  async function save(values) {
    setBusy(true);
    setBanner('');
    try {
      if (editing) await adminService.updateMenuItem(editing._id, values);
      else await adminService.createMenuItem(values);
      toast.success(editing ? 'Menu item updated.' : 'Menu item created.');
      setModalOpen(false);
      setEditing(null);
      resource.refetch();
    } catch (error) {
      setBanner(getApiError(error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleAvailability(item) {
    try {
      await adminService.updateMenuItem(item._id, { isAvailable: !item.isAvailable });
      toast.success(item.isAvailable ? 'Dish marked unavailable.' : 'Dish is available again.');
      resource.refetch();
    } catch (error) {
      toast.error(getApiError(error).message);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await adminService.deleteMenuItem(deleting._id);
      toast.success('Menu item deleted.');
      setDeleting(null);
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
        title="Menu items"
        description="Keep every restaurant menu accurate, priced, and available for ordering."
        actions={
          <Button size="sm" onClick={openCreate} disabled={!restaurants.length}>
            <Plus className="h-4 w-4" /> Add dish
          </Button>
        }
      />

      <AdminCard className="overflow-hidden">
        <AdminToolbar>
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-black/[0.08] px-3">
            <Search className="h-4 w-4 shrink-0 text-ink-muted" />
            <span className="sr-only">Search menu items</span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search dishes or categories"
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
            value={restaurant}
            onChange={(event) => updateParam('restaurant', event.target.value)}
            aria-label="Filter by restaurant"
            className="h-10 min-w-44 py-0"
          >
            <option value="">All restaurants</option>
            {restaurants.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select
            value={availability}
            onChange={(event) => updateParam('availability', event.target.value)}
            aria-label="Filter by availability"
            className="h-10 min-w-40 py-0"
          >
            <option value="all">All availability</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </Select>
        </AdminToolbar>

        {resource.loading ? (
          <AdminTableWrap>
            <AdminTable>
              <thead className="bg-canvas/60">
                <tr>
                  <Th>Dish</Th>
                  <Th>Restaurant</Th>
                  <Th>Type</Th>
                  <Th>Price</Th>
                  <Th>Availability</Th>
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
                  <Th>Dish</Th>
                  <Th>Restaurant</Th>
                  <Th>Type</Th>
                  <Th>Price</Th>
                  <Th>Availability</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              {items.length ? (
                <tbody>
                  {items.map((item) => {
                    const typeMeta = FOOD_TYPE_META[item.foodType] || FOOD_TYPE_META.veg;
                    return (
                      <tr key={item._id} className="border-t border-black/[0.05] hover:bg-canvas/40">
                        <Td>
                          <div className="flex items-center gap-3">
                            <ImageWithFallback
                              src={item.image}
                              alt={item.name}
                              className="h-11 w-11 shrink-0 rounded-xl"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-ink">{item.name}</p>
                              <p className="truncate text-[11px] text-ink-muted">
                                {item.category}
                                {item.isRecommended ? ' · Recommended' : ''}
                              </p>
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <p className="text-xs font-medium text-ink">
                            {item.restaurant?.name || 'Unassigned'}
                          </p>
                          <p className="text-[11px] text-ink-muted">
                            {item.restaurant?.isActive === false ? 'Restaurant inactive' : item.category}
                          </p>
                        </Td>
                        <Td>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                              typeMeta.className
                            )}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {typeMeta.label}
                          </span>
                        </Td>
                        <Td>
                          <p className="font-bold text-ink">{formatCurrency(item.price)}</p>
                          <p className="text-[11px] text-ink-muted">{item.preparationTime} min prep</p>
                        </Td>
                        <Td>
                          <button
                            type="button"
                            onClick={() => toggleAvailability(item)}
                            className={cn(
                              'inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold transition',
                              item.isAvailable
                                ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                                : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                            )}
                          >
                            {item.isAvailable ? 'Available' : 'Unavailable'}
                          </button>
                        </Td>
                        <Td className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className="rounded-lg p-2 text-ink-muted transition hover:bg-black/[0.05] hover:text-ink"
                              aria-label={`Edit ${item.name}`}
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleting(item)}
                              className="rounded-lg p-2 text-ink-muted transition hover:bg-red-50 hover:text-danger"
                              aria-label={`Delete ${item.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              ) : (
                <TableEmpty
                  colSpan={6}
                  title="No menu items found"
                  description="Adjust the filters or add a dish to a restaurant menu."
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
        title={editing ? `Edit ${editing.name}` : 'Add a menu item'}
        description="Dish details, pricing, and availability."
        size="lg"
      >
        <MenuItemForm
          key={editing?._id || 'new'}
          item={editing}
          restaurants={restaurants}
          defaultRestaurant={restaurant}
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
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={`Delete ${deleting?.name || 'menu item'}?`}
        description="The dish will be removed from the menu. Historical orders keep their item snapshots."
        confirmLabel="Delete menu item"
        isLoading={busy}
      />
    </div>
  );
}
