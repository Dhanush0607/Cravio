import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { PageLoader } from '../components/common/Feedback.jsx';

export function AdminRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader label="Verifying administrator access…" />;
  }

  if (!user) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (user.role !== 'admin') {
    return (
      <main className="grid min-h-screen place-items-center bg-canvas px-4">
        <div className="max-w-md rounded-3xl border border-black/[0.06] bg-white p-8 text-center shadow-card">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-danger">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">Administrator access only</h1>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Your account does not have permission to open the Cravio admin workspace.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Back to Cravio
          </Link>
        </div>
      </main>
    );
  }

  return <Outlet />;
}
