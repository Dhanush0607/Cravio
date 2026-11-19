import { FOOD_TYPE_META } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

export function FoodTypeBadge({ type = 'veg', showLabel = false, className }) {
  const meta = FOOD_TYPE_META[type] || FOOD_TYPE_META.veg;

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 text-[11px] font-medium', className)}
      title={meta.label}
    >
      <span
        className={cn(
          'grid h-4 w-4 place-items-center rounded-[4px] border-[1.5px] bg-white',
          meta.className
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            type === 'veg' ? 'bg-success' : type === 'egg' ? 'bg-amber-500' : 'bg-danger'
          )}
        />
      </span>
      {showLabel ? <span className="text-ink-muted">{meta.label}</span> : null}
    </span>
  );
}
