import { Minus, Plus } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export function QuantityControl({ quantity, onIncrement, onDecrement, size = 'md', disabled }) {
  const buttonClass =
    size === 'sm'
      ? 'h-7 w-7'
      : 'h-8 w-8';

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-brand-500 bg-brand-500 text-white',
        disabled && 'opacity-50'
      )}
    >
      <button
        type="button"
        onClick={onDecrement}
        disabled={disabled}
        className={cn(
          'grid place-items-center rounded-l-lg transition hover:bg-brand-600 disabled:cursor-not-allowed',
          buttonClass
        )}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-7 text-center text-xs font-bold" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={disabled || quantity >= 20}
        className={cn(
          'grid place-items-center rounded-r-lg transition hover:bg-brand-600 disabled:cursor-not-allowed',
          buttonClass
        )}
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
