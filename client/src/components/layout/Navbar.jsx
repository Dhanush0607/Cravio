import { useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  Search,
  Sun,
  ShoppingBag,
  User,
  X,
  Moon,
} from 'lucide-react';
import { Logo } from '../common/Brand.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useLocation } from '../../context/LocationContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useClickOutside } from '../../hooks/useClickOutside.js';
import { getInitials } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/restaurants', label: 'Restaurants' },
  { to: '/explore', label: 'Explore' },
];

function navClass({ isActive }) {
  return cn(
    'relative py-2 text-sm font-medium transition',
    isActive ? 'text-brand-600' : 'text-ink-soft hover:text-ink'
  );
}

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const { totals } = useCart();
  const { city, setCity, cities } = useLocation();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const locationRef = useRef(null);
  const profileRef = useRef(null);

  useClickOutside(locationRef, () => setLocationOpen(false), locationOpen);
  useClickOutside(profileRef, () => setProfileOpen(false), profileOpen);

  async function handleLogout() {
    setProfileOpen(false);
    setMobileOpen(false);
    try {
      await logout();
      toast.success('You have been signed out.');
      navigate('/');
    } catch {
      toast.error('Could not sign out. Please try again.');
    }
  }

  function chooseCity(name) {
    setCity(name);
    setLocationOpen(false);
    toast.info(`Showing restaurants in ${name}.`, 2500);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-canvas/95 backdrop-blur-xl">
      <div className="container-page flex h-[4.5rem] items-center gap-5">
        <Link to="/" aria-label="Cravio home" className="shrink-0">
          <Logo />
        </Link>

        <nav className="ml-2 hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={navClass}>
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive ? (
                    <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-brand-500" />
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="grid h-10 w-10 place-items-center rounded-xl text-ink-soft transition hover:bg-black/[0.04]"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-amber-400" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
          <div className="relative hidden md:block" ref={locationRef}>
            <button
              type="button"
              onClick={() => setLocationOpen((current) => !current)}
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium text-ink-soft transition hover:bg-black/[0.04]"
              aria-expanded={locationOpen}
              aria-haspopup="listbox"
            >
              <MapPin className="h-4 w-4 text-brand-500" />
              <span className="max-w-28 truncate">{city.name}</span>
              <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
            </button>
            {locationOpen ? (
              <div
                className="absolute right-0 top-full z-20 mt-2 w-56 rounded-2xl border border-black/[0.07] bg-white p-2 shadow-lift animate-fade-in"
                role="listbox"
                aria-label="Choose delivery city"
              >
                <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  Delivery city
                </p>
                {cities.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => chooseCity(item.name)}
                    role="option"
                    aria-selected={city.name === item.name}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-black/[0.04]',
                      city.name === item.name && 'bg-brand-50 font-semibold text-brand-700'
                    )}
                  >
                    <span>{item.name}</span>
                    <span className="text-xs text-ink-muted">{item.state}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <Link
            to="/search"
            className="grid h-10 w-10 place-items-center rounded-xl text-ink-soft transition hover:bg-black/[0.04] hover:text-ink"
            aria-label="Search Cravio"
          >
            <Search className="h-5 w-5" />
          </Link>

          <Link
            to="/cart"
            className="relative grid h-10 w-10 place-items-center rounded-xl text-ink-soft transition hover:bg-black/[0.04] hover:text-ink"
            aria-label={`Cart with ${totals.itemCount} items`}
          >
            <ShoppingBag className="h-5 w-5" />
            {totals.itemCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                {totals.itemCount > 99 ? '99+' : totals.itemCount}
              </span>
            ) : null}
          </Link>

          {loading ? (
            <div className="hidden h-9 w-24 rounded-xl skeleton sm:block" aria-hidden="true" />
          ) : user ? (
            <div className="relative hidden sm:block" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((current) => !current)}
                className="flex items-center gap-2 rounded-xl p-1 pr-2 transition hover:bg-black/[0.04]"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-xs font-bold text-white">
                  {getInitials(user.name)}
                </span>
                <span className="max-w-24 truncate text-sm font-medium">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
              </button>
              {profileOpen ? (
                <div className="absolute right-0 top-full z-20 mt-2 w-60 rounded-2xl border border-black/[0.07] bg-white p-2 shadow-lift animate-fade-in">
                  <div className="border-b border-black/[0.06] px-3 pb-3 pt-2">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="mt-0.5 truncate text-xs text-ink-muted">{user.email}</p>
                  </div>
                  <div className="py-1.5">
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-soft transition hover:bg-black/[0.04]"
                    >
                      <User className="h-4 w-4" /> Profile & addresses
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-soft transition hover:bg-black/[0.04]"
                    >
                      <Package className="h-4 w-4" /> My orders
                    </Link>
                    {user.role === 'admin' ? (
                      <Link
                        to="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-soft transition hover:bg-black/[0.04]"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Admin dashboard
                      </Link>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg border-t border-black/[0.06] px-3 py-2.5 pt-3 text-sm text-danger transition hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                to="/login"
                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-ink-soft transition hover:bg-black/[0.04]"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-600"
              >
                Get started
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl text-ink-soft transition hover:bg-black/[0.04] lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            role="presentation"
          />
          <div className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-white shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-xl hover:bg-black/[0.04]"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">
              <button
                type="button"
                onClick={toggleTheme}
                className="mb-6 flex w-full items-center justify-between rounded-xl border border-black/10 px-3 py-3 text-sm font-semibold text-ink-soft"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-amber-400" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
              <div className="mb-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Delivering to
                </p>
                <div className="flex flex-wrap gap-2">
                  {cities.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => chooseCity(item.name)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                        city.name === item.name
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-black/10 text-ink-soft'
                      )}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              <nav className="space-y-1" aria-label="Mobile navigation">
                {[
                  ...navLinks,
                  { to: '/search', label: 'Search' },
                  { to: '/cart', label: 'Cart' },
                ].map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'block rounded-xl px-3 py-3 text-base font-semibold transition',
                        isActive
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-ink-soft hover:bg-black/[0.04]'
                      )
                    }
                  >
                    {link.label}
                    {link.to === '/cart' && totals.itemCount > 0 ? (
                      <span className="ml-2 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] text-white">
                        {totals.itemCount}
                      </span>
                    ) : null}
                  </NavLink>
                ))}
              </nav>

              <div className="mt-7 space-y-2 border-t border-black/[0.06] pt-6">
                {user ? (
                  <>
                    <div className="mb-3 flex items-center gap-3 rounded-2xl bg-canvas p-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-sm font-bold text-white">
                        {getInitials(user.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{user.name}</p>
                        <p className="truncate text-xs text-ink-muted">{user.email}</p>
                      </div>
                    </div>
                    <Link
                      to="/orders"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft"
                    >
                      My orders
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft"
                    >
                      Profile & addresses
                    </Link>
                    {user.role === 'admin' ? (
                      <Link
                        to="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft"
                      >
                        Admin dashboard
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-2 w-full rounded-xl border border-danger/15 px-3 py-2.5 text-sm font-semibold text-danger"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-xl border border-black/10 px-3 py-2.5 text-center text-sm font-semibold"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-xl bg-brand-500 px-3 py-2.5 text-center text-sm font-semibold text-white"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
