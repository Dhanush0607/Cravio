import { cn } from '../../utils/cn.js';

export function BrandMark({ className }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn('h-9 w-9', className)}
      role="img"
      aria-label="Cravio logo"
    >
      <rect width="64" height="64" rx="18" fill="currentColor" />
      <path
        d="M21 15v14a5 5 0 0 0 5 5h2v15a3 3 0 0 0 6 0V34h2a5 5 0 0 0 5-5V15h-3v12h-3V15h-3v12h-3V15h-3v12h-3V15h-5Z"
        fill="white"
      />
      <path
        d="M44 16c-5 4-7 10-5 16 1 3 3 5 6 5v12a3 3 0 0 0 6 0V16h-7Z"
        fill="white"
        opacity=".9"
      />
    </svg>
  );
}

export function Logo({ light = false, compact = false, className }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)} aria-label="CRAVIO">
      <BrandMark className={light ? 'text-brand-500' : 'text-brand-500'} />
      {!compact ? (
        <span
          className={cn(
            'text-[1.35rem] font-extrabold tracking-[-0.04em]',
            light ? 'text-white' : 'text-ink'
          )}
        >
          CRAVIO
        </span>
      ) : null}
    </span>
  );
}
