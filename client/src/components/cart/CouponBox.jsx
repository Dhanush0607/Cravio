import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgePercent, Check, LoaderCircle, X } from 'lucide-react';
import { couponService } from '../../services/couponService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { getApiError, formatCurrency } from '../../utils/format.js';

export function CouponBox({ subtotal, appliedCoupon, onApply, onRemove }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function apply(event) {
    event.preventDefault();
    if (!code.trim()) {
      setError('Enter a coupon code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await couponService.validate({ code: code.trim(), subtotal });
      onApply(response.data.coupon, response.data.discount);
      setCode('');
      toast.success(response.message);
    } catch (requestError) {
      const message = getApiError(requestError).message;
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 bg-white/60 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <BadgePercent className="h-4 w-4 text-brand-500" />
          Have a coupon?
        </div>
        <p className="mt-1.5 text-xs leading-5 text-ink-muted">
          <Link
            to="/login?redirect=/cart"
            className="font-semibold text-brand-600 underline-offset-2 hover:underline"
          >
            Sign in
          </Link>{' '}
          to apply an offer to your cart.
        </p>
      </div>
    );
  }

  if (appliedCoupon) {
    return (
      <div className="rounded-2xl border border-success/20 bg-green-50/70 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-success text-white">
              <Check className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-sm font-bold text-green-900">{appliedCoupon.code} applied</p>
              <p className="mt-0.5 text-xs leading-5 text-green-800">
                {appliedCoupon.description ||
                  `You save ${formatCurrency(
                    Math.min(
                      appliedCoupon.discountType === 'percentage'
                        ? (subtotal * appliedCoupon.discountValue) / 100
                        : appliedCoupon.discountValue,
                      appliedCoupon.maximumDiscount || Infinity
                    )
                  )} on this order.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-md p-1 text-green-700 transition hover:bg-green-100"
            aria-label="Remove coupon"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={apply} className="rounded-2xl border border-black/[0.08] bg-white p-4">
      <label htmlFor="coupon-code" className="flex items-center gap-2 text-sm font-semibold">
        <BadgePercent className="h-4 w-4 text-brand-500" />
        Apply a coupon
      </label>
      <div className="mt-2.5 flex gap-2">
        <input
          id="coupon-code"
          value={code}
          onChange={(event) => {
            setCode(event.target.value.toUpperCase());
            setError('');
          }}
          placeholder="e.g. SPECIAL80"
          className="input-base h-10 flex-1 py-2 uppercase"
          autoComplete="off"
          maxLength={30}
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-ink px-4 text-xs font-bold text-white transition hover:bg-ink-soft disabled:opacity-60"
        >
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Apply'}
        </button>
      </div>
      {error ? <p className="mt-2 text-xs font-medium text-danger">{error}</p> : null}
    </form>
  );
}
