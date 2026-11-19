import { Star } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export function Rating({ value = 0, count, size = 'md', showCount = true, className }) {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs';

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-md bg-success font-semibold text-white',
          sizeClasses
        )}
      >
        <Star className="h-3 w-3 fill-current" />
        {Number(value).toFixed(1)}
      </span>
      {showCount && count != null ? (
        <span className="text-xs text-ink-muted">({count})</span>
      ) : null}
    </span>
  );
}
