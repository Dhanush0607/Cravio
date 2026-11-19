import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from './Button.jsx';
import { Input, Select } from './Input.jsx';

const schema = z.object({
  label: z.enum(['Home', 'Work', 'Other']),
  line1: z.string().trim().min(5, 'Address must be at least 5 characters').max(180),
  line2: z.string().trim().max(180).optional(),
  landmark: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2, 'City is required').max(80),
  state: z.string().trim().min(2, 'State is required').max(80),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  isDefault: z.boolean(),
});

export function AddressForm({ defaultValues, onSubmit, onCancel, submitLabel = 'Save address' }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      label: 'Home',
      line1: '',
      line2: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: false,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Address label" {...register('label')} error={errors.label?.message}>
          <option value="Home">Home</option>
          <option value="Work">Work</option>
          <option value="Other">Other</option>
        </Select>
        <Input
          label="Pincode"
          inputMode="numeric"
          maxLength={6}
          {...register('pincode')}
          error={errors.pincode?.message}
        />
      </div>
      <Input
        label="Address line 1"
        placeholder="Flat / house number, building, street"
        {...register('line1')}
        error={errors.line1?.message}
      />
      <Input
        label="Address line 2"
        placeholder="Area / locality"
        {...register('line2')}
        error={errors.line2?.message}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="City" {...register('city')} error={errors.city?.message} />
        <Input label="State" {...register('state')} error={errors.state?.message} />
      </div>
      <Input
        label="Landmark (optional)"
        placeholder="Near metro, mall, or building"
        {...register('landmark')}
        error={errors.landmark?.message}
      />
      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-black/20 text-brand-500 focus:ring-brand-500"
          {...register('isDefault')}
        />
        Use as my default delivery address
      </label>
      <div className="flex justify-end gap-3 border-t border-black/[0.06] pt-4">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
