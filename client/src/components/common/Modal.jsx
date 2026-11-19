import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose?.();
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          'flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl animate-fade-up sm:rounded-3xl',
          sizes[size],
          className
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-black/[0.06] px-5 py-4 sm:px-6">
          <div>
            {title ? (
              <h2 id={titleId} className="text-lg font-bold text-ink">
                {title}
              </h2>
            ) : null}
            {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-2 text-ink-muted transition hover:bg-black/[0.05] hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer ? (
          <footer className="flex items-center justify-end gap-3 border-t border-black/[0.06] px-5 py-4 sm:px-6">
            {footer}
          </footer>
        ) : null}
      </section>
    </div>,
    document.body
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) {
  const confirmClass =
    variant === 'danger'
      ? 'bg-danger hover:bg-red-700'
      : variant === 'primary'
        ? 'bg-brand-500 hover:bg-brand-600'
        : 'bg-ink hover:bg-ink-soft';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-black/[0.03]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60',
              confirmClass
            )}
          >
            {isLoading ? 'Please wait…' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-6 text-ink-muted">{description}</p>
    </Modal>
  );
}
