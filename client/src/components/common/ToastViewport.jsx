import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const styles = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-brand-600',
};

export function ToastViewport({ toasts, onDismiss }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:items-end"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || Info;
        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-black/[0.07] bg-white p-4 shadow-lift animate-slide-in"
          >
            <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', styles[toast.type])} />
            <p className="flex-1 text-sm leading-5 text-ink-soft">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="rounded-md p-0.5 text-ink-muted transition hover:bg-black/5 hover:text-ink"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
