import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { AuthShell } from './AuthShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import { FormBanner, PageLoader } from '../../components/common/Feedback.jsx';
import { getApiError } from '../../utils/format.js';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required').max(72),
});

function safeRedirect(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [banner, setBanner] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const redirect = safeRedirect(searchParams.get('redirect'));
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  if (loading) return <PageLoader label="Checking your session…" />;
  if (user) {
    return <Navigate to={redirect || (user.role === 'admin' ? '/admin' : '/')} replace />;
  }

  async function onSubmit(values) {
    setBanner('');
    try {
      const signedIn = await login(values);
      toast.success(`Welcome back, ${signedIn.name.split(' ')[0]}.`);
      navigate(redirect || (signedIn.role === 'admin' ? '/admin' : '/'), { replace: true });
    } catch (requestError) {
      setBanner(getApiError(requestError).message);
    }
  }

  function fillDemo() {
    setValue('email', 'demo@cravio.dev', { shouldValidate: true });
    setValue('password', 'DemoCustomer123!', { shouldValidate: true });
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to apply offers, check out faster, and follow your orders in real time."
      footer={
        <>
          New to Cravio?{' '}
          <Link
            to={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="font-semibold text-brand-600 hover:text-brand-700"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {banner ? <FormBanner message={banner} /> : null}
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register('email')}
          error={errors.email?.message}
        />
        <div>
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Your password"
              {...register('password')}
              error={errors.password?.message}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-[2.55rem] rounded-md p-1 text-ink-muted hover:text-ink"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="mt-2 text-right">
            <Link to="/info/help" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Forgot your password?
            </Link>
          </div>
        </div>

        <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
          <LogIn className="h-4 w-4" /> Sign in
        </Button>

        {import.meta.env.DEV ? (
          <div className="rounded-xl border border-dashed border-black/10 bg-canvas px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Development demo account
            </p>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <p className="text-xs text-ink-muted">demo@cravio.dev · DemoCustomer123!</p>
              <button
                type="button"
                onClick={fillDemo}
                className="shrink-0 text-xs font-bold text-brand-600 hover:text-brand-700"
              >
                Fill
              </button>
            </div>
          </div>
        ) : null}
      </form>
    </AuthShell>
  );
}
