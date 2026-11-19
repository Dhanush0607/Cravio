import { Link } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Bike, ShieldCheck, Sparkles } from 'lucide-react';
import { Logo } from '../../components/common/Brand.jsx';
import { ImageWithFallback } from '../../components/common/ImageWithFallback.jsx';

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-canvas">
      <div className="container-page grid gap-8 py-8 lg:min-h-[calc(100vh-4.5rem)] lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch lg:py-10">
        <aside className="relative hidden overflow-hidden rounded-[2rem] bg-ink p-10 text-white lg:flex lg:flex-col">
          <div
            className="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[48px] border-white/[0.05]"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex items-center justify-between">
            <Logo light />
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Cravio
            </Link>
          </div>

          <div className="relative mt-12 max-w-md">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/75">
              <Sparkles className="h-3.5 w-3.5 text-brand-400" /> Food worth coming back for
            </span>
            <h2 className="mt-5 text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.04em]">
              Good food, without the guesswork.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/65">
              Curated local kitchens, secure checkout, and clear order tracking from the moment you
              pay to the moment your doorbell rings.
            </p>
          </div>

          <div className="relative mt-auto space-y-3 pt-10">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <ImageWithFallback
                src="/images/foods/hero-food.jpg"
                alt="A spread of freshly prepared dishes"
                className="h-36 w-full opacity-90"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] font-medium text-white/70">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-2">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-400" /> Secure
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-2">
                <Bike className="h-3.5 w-3.5 text-brand-400" /> Tracked
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-2">
                <BadgeCheck className="h-3.5 w-3.5 text-brand-400" /> Reliable
              </span>
            </div>
          </div>
        </aside>

        <main className="flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <Logo />
              <Link to="/" className="text-xs font-semibold text-ink-muted">
                Back home
              </Link>
            </div>
            <div className="card p-6 sm:p-8">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-ink-muted">{subtitle}</p>
              <div className="mt-6">{children}</div>
            </div>
            {footer ? <div className="mt-5 text-center text-sm text-ink-muted">{footer}</div> : null}
          </div>
        </main>
      </div>
    </div>
  );
}
