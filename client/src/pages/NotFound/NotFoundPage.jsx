import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, SearchX } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="container-page grid min-h-[65vh] place-items-center py-12">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-brand-50 text-brand-500">
          <SearchX className="h-9 w-9" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
          404 — page not found
        </p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
          This page slipped off the menu.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-ink-muted">
          The link may be outdated, or the page may have moved. Head back to something delicious.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
          <Link
            to="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 text-sm font-bold text-white shadow-glow transition hover:bg-brand-600"
          >
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>
          <Link
            to="/explore"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-6 text-sm font-semibold transition hover:bg-black/[0.03]"
          >
            <Compass className="h-4 w-4" /> Explore food
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
