import { AlertCircle, LoaderCircle, RefreshCw, SearchX } from 'lucide-react';
import { Button } from './Button.jsx';
import { cn } from '../../utils/cn.js';

export function Spinner({ className }) {
  return <LoaderCircle className={cn('h-5 w-5 animate-spin text-brand-500', className)} />;
}

export function PageLoader({ label = 'Preparing your experience…' }) {
  return (
    <div className="grid min-h-[55vh] place-items-center px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-white shadow-card">
          <Spinner className="h-7 w-7" />
        </div>
        <p className="text-sm font-medium text-ink-muted">{label}</p>
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl border border-dashed border-black/10 bg-white/60 px-6 py-14 text-center',
        className
      )}
    >
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-500">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry, title = 'We could not load this page' }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-danger/10 bg-white px-6 py-14 text-center shadow-card">
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-danger">
        <AlertCircle className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-ink-muted">{message}</p>
      {onRetry ? (
        <Button variant="secondary" className="mt-6" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function FormBanner({ message, type = 'error' }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-5',
        type === 'error'
          ? 'border-danger/15 bg-red-50 text-red-700'
          : 'border-success/15 bg-green-50 text-green-800'
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />;
}

export function RestaurantCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-black/[0.05] bg-white">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function DishCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-2xl border border-black/[0.05] bg-white p-3">
      <Skeleton className="h-24 w-24 shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}
