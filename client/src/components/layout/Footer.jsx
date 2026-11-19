import { Link } from 'react-router-dom';
import { Instagram, Linkedin, Twitter, Youtube, MapPin, Mail, Phone } from 'lucide-react';
import { Logo } from '../common/Brand.jsx';

const columns = [
  {
    title: 'Discover',
    links: [
      { label: 'Restaurants', to: '/restaurants' },
      { label: 'Explore', to: '/explore' },
      { label: 'Search food', to: '/search' },
      { label: 'Offers', to: '/explore#offers' },
    ],
  },
  {
    title: 'Cravio',
    links: [
      { label: 'About us', to: '/info/about' },
      { label: 'Contact', to: '/info/contact' },
      { label: 'Help & support', to: '/info/help' },
      { label: 'Partner with us', to: '/info/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of service', to: '/info/terms' },
      { label: 'Privacy policy', to: '/info/privacy' },
      { label: 'Refund policy', to: '/info/refunds' },
      { label: 'Cookie policy', to: '/info/privacy' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-black/[0.06] bg-white">
      <div className="container-page py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_2fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-6 text-ink-muted">
              Thoughtful food discovery, transparent pricing, and reliable delivery. Your cravings,
              delivered.
            </p>
            <div className="mt-6 space-y-2.5 text-sm text-ink-muted">
              <p className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                Cravio Technologies, Indiranagar, Bengaluru 560038
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-brand-500" />
                hello@cravio.dev
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-brand-500" />
                +91 80 4000 2026
              </p>
            </div>
            <div className="mt-6 flex gap-2">
              {[
                { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com' },
                { icon: Twitter, label: 'X / Twitter', href: 'https://x.com' },
                { icon: Youtube, label: 'YouTube', href: 'https://www.youtube.com' },
                { icon: Linkedin, label: 'LinkedIn', href: 'https://www.linkedin.com' },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-black/[0.08] text-ink-muted transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-bold text-ink">{column.title}</h3>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="text-sm text-ink-muted transition hover:text-brand-600"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-black/[0.06] pt-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Cravio Technologies. All rights reserved.</p>
          <p>Made for hungry people in Bengaluru, Mumbai, and Hyderabad.</p>
        </div>
      </div>
    </footer>
  );
}
