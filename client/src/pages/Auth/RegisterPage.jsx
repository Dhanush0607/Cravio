import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Eye, EyeOff, UserPlus } from 'lucide-react';
import { AuthShell } from './AuthShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import { FormBanner, PageLoader } from '../../components/common/Feedback.jsx';
import { getApiError, fieldErrors } from '../../utils/format.js';

const schema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
    email: z.string().trim().email('Enter a valid email address'),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9]{10,15}$/, 'Enter a valid phone number with 10-15 digits'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .max(72, 'Password cannot exceed 72 characters')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      error: 'Accept the terms to create an account',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

function safeRedirect(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

export default function RegisterPage() {
  const { user, loading, register: registerUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [banner, setBanner] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const redirect = safeRedirect(searchParams.get('redirect'));
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const password = watch('password') || '';
  const checks = [
    { label: '8+ characters', valid: password.length >= 8 },
    { label: 'Uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'Number', valid: /[0-9]/.test(password) },
  ];

  if (loading) return <PageLoader label="Checking your session…" />;
  if (user) return <Navigate to={redirect || '/'} replace />;

  async function onSubmit(values) {
    setBanner('');
    try {
      const created = await registerUser({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      toast.success(`Welcome to Cravio, ${created.name.split(' ')[0]}.`);
      navigate(redirect || '/', { replace: true });
    } catch (requestError) {
      setBanner(getApiError(requestError).message);
      const details = fieldErrors(requestError);
      Object.entries(details).forEach(([field, message]) => {
        if (['name', 'email', 'phone', 'password', 'confirmPassword'].includes(field)) {
          setError(field, { message });
        }
      });
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Save addresses, apply offers, and keep every order in one place."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="font-semibold text-brand-600 hover:text-brand-700"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {banner ? <FormBanner message={banner} /> : null}
        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Your name"
          {...register('name')}
          error={errors.name?.message}
        />
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register('email')}
          error={errors.email?.message}
        />
        <Input
          label="Phone number"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+91 98765 43210"
          {...register('phone')}
          error={errors.phone?.message}
        />
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Create a strong password"
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

        <div className="grid grid-cols-2 gap-1.5">
          {checks.map((check) => (
            <span
              key={check.label}
              className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                check.valid ? 'text-success' : 'text-ink-muted'
              }`}
            >
              <Check className={`h-3 w-3 ${check.valid ? 'opacity-100' : 'opacity-30'}`} />
              {check.label}
            </span>
          ))}
        </div>

        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Repeat your password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />

        <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-5 text-ink-muted">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-black/20 text-brand-500 focus:ring-brand-500"
            {...register('acceptTerms')}
          />
          <span>
            I agree to Cravio&apos;s{' '}
            <Link to="/info/terms" className="font-semibold text-brand-600 hover:underline">
              terms of service
            </Link>{' '}
            and{' '}
            <Link to="/info/privacy" className="font-semibold text-brand-600 hover:underline">
              privacy policy
            </Link>
            .
          </span>
        </label>
        {errors.acceptTerms?.message ? (
          <p className="text-xs font-medium text-danger">{errors.acceptTerms.message}</p>
        ) : null}

        <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
          <UserPlus className="h-4 w-4" /> Create account
        </Button>
      </form>
    </AuthShell>
  );
}
