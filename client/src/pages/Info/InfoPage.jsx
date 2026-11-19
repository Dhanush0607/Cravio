import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock3,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Utensils,
} from 'lucide-react';
import { NotFoundPage } from '../NotFound/NotFoundPage.jsx';

const pages = {
  about: {
    eyebrow: 'About Cravio',
    title: 'Food discovery that respects your time and your money',
    intro:
      'Cravio is a demonstration food delivery platform built to show how a modern ordering experience can be fast, transparent, and secure from menu browsing to delivery tracking.',
    sections: [
      {
        heading: 'What we focus on',
        body: [
          'Local restaurants are presented with clear menus, honest availability, and upfront pricing. Every fee and discount is visible before checkout.',
          'Orders are created server-side with authoritative pricing. This means the total you see is recalculated against live menu prices, coupons, and restaurant rules before an order is accepted.',
          'Accounts use secure HttpOnly cookies, CSRF protection, password hashing, and rate limiting. Administrators get a separate protected workspace for operations.',
        ],
      },
      {
        heading: 'A production-minded reference implementation',
        body: [
          'This project is intended as a working reference for a full-stack JavaScript food delivery application. It includes customer ordering, restaurant menus, coupons, order lifecycle management, payment provider integration points, and an admin dashboard.',
          'The food images are sourced locally for development. Payment and image hosting integrations are optional and clearly labelled when running in development mode.',
        ],
      },
    ],
  },
  contact: {
    eyebrow: 'Contact us',
    title: 'We are here when something matters',
    intro:
      'Whether you need help with an order, want to partner with Cravio, or have a question about the platform, these are the best ways to reach us.',
    sections: [
      {
        heading: 'Customer support',
        body: [
          'For order-specific help, include your order number, the phone number used at checkout, and a short description of what went wrong.',
          'Support hours: Monday to Sunday, 9:00 AM to 11:00 PM IST. Orders in progress are prioritized.',
        ],
      },
      {
        heading: 'Restaurant partnerships',
        body: [
          'If you operate a kitchen and would like to be listed, send us your restaurant name, city, cuisine, and a contact number.',
          'Partnership review includes menu quality, hygiene practices, packaging standards, and delivery readiness.',
        ],
      },
    ],
  },
  help: {
    eyebrow: 'Help centre',
    title: 'Answers for the moments that matter',
    intro:
      'Quick guidance for orders, payments, accounts, and cancellations. If you still need help, contact support with your order number.',
    faqs: [
      {
        question: 'How do I track my order?',
        answer:
          'Open “My orders” from your profile menu, then select the order. The order timeline shows confirmation, preparation, out-for-delivery, and delivery updates.',
      },
      {
        question: 'Can I cancel an order?',
        answer:
          'Orders can be cancelled by customers while they are pending or confirmed. Once the restaurant begins preparing the food, online cancellation is disabled and support must be contacted.',
      },
      {
        question: 'Why did my coupon not apply?',
        answer:
          'Coupons have minimum order values, expiry dates, usage limits, and per-customer limits. The server validates every rule again at checkout and explains any failed condition.',
      },
      {
        question: 'What happens if an online payment fails?',
        answer:
          'The order is saved with a pending payment status. Open the order details and use “Complete payment” to retry. No duplicate order is created.',
      },
      {
        question: 'Is my payment information stored?',
        answer:
          'No card data is stored by Cravio. Online payments are handed to the configured payment provider. When Razorpay is not configured, development test payments are clearly labelled and no real money is charged.',
      },
      {
        question: 'How do I change my password?',
        answer:
          'Open Profile & settings, choose Security, and enter your current password along with a new password. Other sessions are signed out after the change.',
      },
    ],
  },
  terms: {
    eyebrow: 'Legal',
    title: 'Terms of service',
    intro:
      'These terms describe the rules for using Cravio. This is a demonstration application; adapt these terms with qualified legal review before operating a commercial service.',
    sections: [
      {
        heading: 'Accounts',
        body: [
          'You must provide accurate account information and keep your credentials private. You are responsible for activity performed through your account.',
          'Accounts may be suspended for abuse, fraud, repeated policy violations, or attempts to compromise the platform.',
        ],
      },
      {
        heading: 'Orders and pricing',
        body: [
          'Submitting an order is an offer to purchase the selected items under the displayed terms. The order is accepted when the platform creates the order after validating items, prices, coupons, and delivery details.',
          'Menu prices, availability, fees, and offers can change. The authoritative total is calculated by the server at the time the order is placed.',
        ],
      },
      {
        heading: 'Delivery and cancellations',
        body: [
          'Estimated delivery times are guidance, not guarantees. Weather, kitchen volume, and traffic can affect arrival times.',
          'Cancellation availability depends on the order status. Orders already being prepared may not be cancellable online.',
        ],
      },
      {
        heading: 'Acceptable use',
        body: [
          'Do not attempt to manipulate prices, abuse coupons, interfere with other users, scrape private data, or disrupt platform availability.',
          'Automated access is permitted only through documented interfaces and within reasonable rate limits.',
        ],
      },
    ],
  },
  privacy: {
    eyebrow: 'Legal',
    title: 'Privacy policy',
    intro:
      'We collect only the data needed to operate accounts, process orders, and provide support. This demonstration uses local development data and does not sell personal information.',
    sections: [
      {
        heading: 'Data we store',
        body: [
          'Account data includes your name, email address, phone number, hashed password, and saved delivery addresses.',
          'Order data includes item snapshots, delivery address snapshots, contact details, payment status, and status history needed for support and records.',
        ],
      },
      {
        heading: 'Cookies and sessions',
        body: [
          'Cravio uses HttpOnly authentication cookies and a CSRF cookie for security. We do not use advertising cookies in this project.',
          'The cart and selected city are stored in your browser’s local storage so they survive page reloads.',
        ],
      },
      {
        heading: 'Third parties',
        body: [
          'When configured, Razorpay processes online payments and Cloudinary stores uploaded images. When they are not configured, development substitutes are used and clearly labelled.',
          'No secrets or payment credentials are exposed to the browser.',
        ],
      },
    ],
  },
  refunds: {
    eyebrow: 'Policies',
    title: 'Refund and cancellation policy',
    intro:
      'Refund handling depends on payment method, order status, and the reason for the request. This demonstration documents the intended policy for a production deployment.',
    sections: [
      {
        heading: 'Cancellations',
        body: [
          'Customer cancellation is available while an order is pending or confirmed. After preparation begins, contact support.',
          'When an order is cancelled before delivery, coupon usage is released and the order status history records the cancellation reason.',
        ],
      },
      {
        heading: 'Online payments',
        body: [
          'If an online payment succeeds but the order cannot be fulfilled, the amount is eligible for a full refund to the original payment method.',
          'If a payment fails, no money is captured and the order remains pending until you retry payment or cancel it.',
        ],
      },
      {
        heading: 'Cash on delivery',
        body: [
          'Cash-on-delivery orders are paid at the door. If an item is missing or incorrect, contact support so the order can be reviewed.',
          'Partial refunds for unavailable items should be processed to the original payment method where possible, or as an agreed alternative.',
        ],
      },
      {
        heading: 'Processing times',
        body: [
          'Approved refunds are typically initiated within 1-2 business days. Bank and payment provider timelines determine when the amount appears in your account.',
        ],
      },
    ],
  },
};

const contactItems = [
  { icon: Mail, label: 'hello@cravio.dev', href: 'mailto:hello@cravio.dev' },
  { icon: Phone, label: '+91 80 4000 2026', href: 'tel:+918040002026' },
  { icon: MapPin, label: 'Indiranagar, Bengaluru 560038' },
  { icon: Clock3, label: '9:00 AM – 11:00 PM IST, every day' },
];

export default function InfoPage() {
  const { page } = useParams();
  const content = pages[page];

  if (!content) return <NotFoundPage />;

  return (
    <div>
      <section className="border-b border-black/[0.05] bg-white">
        <div className="container-page py-10 sm:py-14">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted transition hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Cravio
          </Link>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-brand-600">
            {content.eyebrow}
          </p>
          <h1 className="mt-2 max-w-3xl text-balance text-3xl font-extrabold tracking-tight sm:text-5xl">
            {content.title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-muted sm:text-base">
            {content.intro}
          </p>
        </div>
      </section>

      <div className="container-page grid gap-8 py-10 sm:py-14 lg:grid-cols-[1fr_280px] lg:items-start">
        <article className="space-y-8">
          {content.sections?.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{section.heading}</h2>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-ink-muted">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}

          {content.faqs ? (
            <div className="divide-y divide-black/[0.06] overflow-hidden rounded-3xl border border-black/[0.06] bg-white">
              {content.faqs.map((faq) => (
                <details key={faq.question} className="group px-5 py-4 sm:px-6">
                  <summary className="cursor-pointer list-none text-sm font-bold text-ink marker:hidden">
                    <span className="flex items-start justify-between gap-4">
                      {faq.question}
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-canvas text-ink-muted transition group-open:rotate-45">
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">{faq.answer}</p>
                </details>
              ))}
            </div>
          ) : null}

          {page === 'about' ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: Utensils, title: 'Curated kitchens', text: 'Quality-first restaurant discovery.' },
                { icon: ShieldCheck, title: 'Secure by design', text: 'Server-verified orders and payments.' },
                { icon: Clock3, title: 'Live tracking', text: 'Every order step is recorded.' },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-black/[0.06] bg-white p-4">
                  <Icon className="h-5 w-5 text-brand-500" />
                  <p className="mt-3 text-sm font-bold">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-ink-muted">{text}</p>
                </div>
              ))}
            </div>
          ) : null}
        </article>

        <aside className="space-y-4 lg:sticky lg:top-28">
          <div className="card p-5">
            <h2 className="text-sm font-bold">Need to reach us?</h2>
            <ul className="mt-3 space-y-3">
              {contactItems.map(({ icon: Icon, label, href }) => (
                <li key={label} className="flex items-start gap-2.5 text-xs leading-5 text-ink-muted">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                  {href ? (
                    <a href={href} className="hover:text-brand-600">
                      {label}
                    </a>
                  ) : (
                    <span>{label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-ink p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-white/60">Explore Cravio</p>
            <div className="mt-3 space-y-2 text-sm">
              <Link to="/restaurants" className="block text-white/85 hover:text-white">
                Browse restaurants
              </Link>
              <Link to="/explore" className="block text-white/85 hover:text-white">
                Discover offers
              </Link>
              <Link to="/orders" className="block text-white/85 hover:text-white">
                Track an order
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
