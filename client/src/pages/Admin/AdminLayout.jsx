import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BadgePercent,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Store,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { Logo } from '../../components/common/Brand.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { getInitials } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

const navigation = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/restaurants', label: 'Restaurants', icon: Store },
  { to: '/admin/menu', label: 'Menu items', icon: UtensilsCrossed },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/coupons', label: 'Coupons', icon: BadgePercent },
];

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      toast.success('Signed out of the admin workspace.');
      navigate('/login');
    } catch {
      toast.error('Could not sign out. Please try again.');
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[4.5rem] shrink-0 items-center border-b border-white/[0.08] px-5">
        <Link to="/admin" onClick={onNavigate} aria-label="Cravio admin home">
          <Logo light />
        </Link>
        <span className="ml-2 rounded-md border border-white/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/60">
          Admin
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Admin navigation">
        {navigation.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-brand-500 text-white shadow-glow'
                  : 'text-white/65 hover:bg-white/[0.06] hover:text-white'
              )
            }
          >
            <Icon className="h-4.5 w-4.5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/[0.08] p-3">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/65 transition hover:bg-white/[0.06] hover:text-white"
        >
          <ExternalLink className="h-4 w-4" /> View storefront
        </Link>
        <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-white/[0.05] p-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-500 text-xs font-bold text-white">
            {getInitials(user?.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{user?.name}</p>
            <p className="truncate text-[10px] text-white/50">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f6f5f2]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-ink lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            role="presentation"
          />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-ink shadow-2xl animate-slide-in">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-[4.5rem] items-center gap-3 border-b border-black/[0.06] bg-[#f6f5f2]/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl text-ink-soft transition hover:bg-black/[0.05] lg:hidden"
            aria-label="Open admin menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
              Operations workspace
            </p>
            <p className="truncate text-sm font-semibold text-ink">Cravio administration</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/"
              className="hidden items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold transition hover:bg-black/[0.03] sm:inline-flex"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Storefront
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg bg-ink text-xs font-bold text-white lg:hidden"
              aria-label="Account options"
            >
              {getInitials(user?.name) || 'A'}
            </button>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      {mobileOpen ? (
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="fixed bottom-5 right-5 z-[90] grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-xl lg:hidden"
          aria-label="Close admin menu"
        >
          <X className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  );
}
