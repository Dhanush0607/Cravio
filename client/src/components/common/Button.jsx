import { forwardRef } from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const variants = {
  primary:
    'bg-brand-500 text-white shadow-glow hover:bg-brand-600 active:bg-brand-700 disabled:bg-brand-300',
  secondary:
    'border border-black/10 bg-white text-ink hover:border-black/20 hover:bg-black/[0.025]',
  dark: 'bg-ink text-white hover:bg-ink-soft',
  ghost: 'text-ink-soft hover:bg-black/[0.045] hover:text-ink',
  danger: 'bg-danger text-white hover:bg-red-700',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
};

const sizes = {
  sm: 'h-9 rounded-lg px-3 text-xs gap-1.5',
  md: 'h-11 rounded-xl px-5 text-sm gap-2',
  lg: 'h-[3.25rem] rounded-xl px-6 text-sm gap-2.5',
};

export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled,
    className,
    fullWidth = false,
    type = 'button',
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex select-none items-center justify-center font-semibold transition duration-200 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
});
