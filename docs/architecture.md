# CRAVIO architecture

CRAVIO is a two-workspace monorepo: a React single-page application (`client/`) and a REST API
(`server/`) backed by MongoDB. The two communicate only over HTTP with JSON. This document explains how
the pieces fit together and why.

## High-level view

```text
┌────────────────────────┐         HTTPS/JSON          ┌────────────────────────────┐
│  React SPA (client/)   │  ─────────────────────────▶ │  Express API (server/)     │
│  Vite build, deployed  │   HttpOnly cookie session   │  Helmet + CORS + limiter   │
│  on Vercel (CDN)       │   CSRF double-submit        │  Zod validation            │
│                        │ ◀─────────────────────────  │  JWT auth middleware       │
└────────────────────────┘                             └──────────┬─────────────────┘
                                                                   │ Mongoose
                                                        ┌──────────▼─────────────────┐
                                                        │  MongoDB (Atlas or local)  │
                                                        │  users · restaurants       │
                                                        │  menuitems · orders        │
                                                        │  coupons · payments        │
                                                        └────────────────────────────┘
                                                 external: Razorpay · Cloudinary (optional)
```

## Server architecture

### Layering

Each request flows through a fixed pipeline:

```text
helmet → cors → json parser → cookie parser → sanitiser
       → CSRF (ensure cookie → verify) → rate limiter
       → route: optional protect/requireAdmin → validate(Zod) → controller → services/models
       → errorHandler
```

- **`config/env.js`** parses and validates every environment variable with a Zod schema at startup and
  fails fast on anything missing or contradictory (for example, `PAYMENTS_DEV_MODE=true` in production, or
  a missing `COOKIE_SECURE` in production). All other modules read the frozen `env` object.
- **`config/db.js`** owns the single Mongoose connection and exposes `connectDB`/`disconnectDB`.
- **`routes/`** bind an HTTP path to middleware and a controller. `/api/admin/*` calls
  `router.use(protect, requireAdmin)` once so no admin route can be registered without authorisation.
- **`validators/`** contain Zod schemas for params, query strings, and bodies. The `validate()` middleware
  replaces `req.params`/`req.query`/`req.body` with the parsed (and defaulted/coerced) values, so
  controllers only ever see clean data.
- **`controllers/`** translate HTTP to service calls. They own response shapes, not business rules.
- **`services/`** hold the rules that must never be duplicated:
  - `pricingService.js` — the money model (platform fee 2%, floor ₹5, cap ₹25; clamping and rounding).
  - `couponService.js` — coupon validation, atomic reservation, and release.
  - `orderStatusService.js` — the order state machine.
  - `paymentService.js` — Razorpay REST calls, HMAC signature verification, and provider status.
  - `uploadService.js` — Multer storage and Cloudinary upload.
- **`middleware/`** — `auth.js` (JWT from cookie or bearer, user load, role check), `csrf.js`
  (double-submit token and CORS options), `security.js` (strips `$`-prefixed and `.`-containing keys),
  `rateLimiters.js`, `errorHandler.js` (safe error mapping), `validate.js`.
- **`models/`** — Mongoose schemas with validation, indexes, and JSON transforms that strip secrets.
- **`seed.js`** — idempotent development seeding; refuses to run when `NODE_ENV=production`, and in
  production requires an explicit `ADMIN_PASSWORD`.

### The money flow (server-authoritative pricing)

Order creation is the most safety-critical path:

```text
1. Idempotency check        → existing key? return the original order (or 409 for a foreign key)
2. Load restaurant          → must exist, be active, and be open
3. Load address             → must belong to req.user; city must match the restaurant's city
4. Load menu items          → $in query filtered to that restaurant; each must exist and be available
5. Build item snapshots     → { name, image, price, foodType, category } from the database, never the client
6. Subtotal                 → Σ (db price × quantity);  checked against restaurant.minOrder
7. Coupon validation        → active, unexpired, under global + per-user limits, minimum order met
8. Quote                    → pricingService.calculateQuote: subtotal − discount + deliveryFee + platformFee
9. Atomically reserve       → Coupon.findOneAndUpdate({_id, isActive, unexpired, usageCount < limit}, {$inc})
10. Create the order        → on failure, release the coupon reservation first, then rethrow / replay
11. Populate and respond    → 201 with the stored order
```

Because steps 5–8 use only database values, a tampered client request cannot change what a customer is
charged. Because steps 9–11 are atomic plus idempotent, concurrent double submits and retries converge to a
single order and a single coupon consumption.

### Order lifecycle

```text
pending → confirmed → preparing → out_for_delivery → delivered
   │          │            │
   └──────────┴────────────┴──▶ cancelled
```

`STATUS_TRANSITIONS` is the single source of truth. Admin updates must follow an edge in this graph;
customer cancellation is allowed only in `pending` or `confirmed`, and never for orders already
`preparing` or beyond. Every change appends to `statusHistory` with the actor and a note. Delivered online
orders require `paymentStatus: 'paid'` before the `delivered` transition is accepted; COD orders are
settled automatically at delivery. Cancelled orders release their coupon reservation.

### Authentication

- Registration hashes the password with bcrypt (cost 12) via a pre-save hook; the role field is
  `immutable`, and the registration validator accepts only the fields a customer may set, so a client
  cannot self-assign `role: 'admin'`.
- Sign-in issues a JWT (7-day default, `tokenVersion`-bound, password field excluded) in an HttpOnly,
  SameSite=Lax cookie. `COOKIE_SECURE=true` is forced in production.
- `protect` accepts the cookie or a Bearer token (for API clients and tests). `requireAdmin` rejects
  non-admins.
- CSRF is the double-submit pattern: the `cravio_csrf` cookie is readable by the client and must be echoed
  in the `X-CSRF-Token` header on unsafe methods, compared with `crypto.timingSafeEqual`. Requests without
  an auth cookie skip the check (there is nothing to forge), and Bearer requests skip it because they carry
  explicit credentials. The client caches the token, refreshes it on a 403, and retries once.
- Password change bumps `tokenVersion`, invalidating all existing sessions.

## Client architecture

### Layers

```text
pages (route-level, lazy-loaded)
  └── components (domain: home / restaurant / food / cart / admin · shared: common / layout)
        └── services (one file per API domain; the only place that touches Axios)
              └── services/api.js (base instance, CSRF interceptors, URL helper)
```

- **Contexts** (`AuthContext`, `CartContext`, `LocationContext`, `ToastContext`) hold all shared state.
  There is no Redux or query library by design.
- **`useApi`** is the standard data hook: it takes an async loader and dependencies, and exposes
  `data`, `loading`, `error`, `refetch`. Pages render `PageLoader`/skeletons, `ErrorState`, and
  `EmptyState` from the same primitives.
- **Cart** is persisted per merchant selection in `localStorage`, enforces the single-restaurant rule, and
  computes display totals with `utils/cart.js`, which mirrors the server's fee and rounding rules. On
  sign-in the server-backed checkout is authoritative, so a stale local cart can never change what an order
  costs.
- **Forms** use React Hook Form with Zod 4 schemas and `zodResolver`. Server field errors are mapped back
  onto inputs with `setError`.
- **Images** render through `ImageWithFallback` (lazy loading and a local placeholder) and `imageUrl()`
  resolves `/uploads/*` against the configured API origin.

### Routing and guards

`App.jsx` lazy-loads every page under a `Suspense` boundary. `CustomerLayout` wraps public and customer
routes; `ProtectedRoute` redirects guests to `/login?redirect=…`; `AdminRoute` additionally verifies
`role === 'admin'` and renders its own admin shell instead of the customer chrome. Auth pages bounce
already-authenticated users (admins to `/admin`, customers to their previous destination) and the redirect
parameter is sanitised to local paths only.

## Data ownership and isolation

| Concern                | Mechanism                                                                       |
| ---------------------- | ------------------------------------------------------------------------------- |
| Order isolation        | Customer queries always filter `customer: req.user._id`; single-order reads and cancellations verify ownership server-side |
| Address isolation      | Addresses are subdocuments of the authenticated user; lookups use `user.addresses.id()` |
| Payment isolation      | Payment create/verify resolve only via the caller's order                        |
| Admin surfaces         | Separate `/api/admin/*` router behind `protect, requireAdmin`                    |
| Secret hygiene         | `select: false` on password/tokenVersion and `toJSON` transforms strip them      |
| Injection              | Zod validation, ObjectId casting, and the `$`/`.` key sanitiser                  |

## Performance decisions

- Route-level code splitting; the main bundle is ~294 kB (~97 kB gzip) and admin pages never load for
  customers.
- MongoDB indexes back every filter used by the listing, order, and admin endpoints (see
  [database.md](database.md)).
- Listing endpoints return paginated slices (`page`/`limit` with total metadata) instead of whole
  collections.
- Images are lazy-loaded and served with cache headers in production (`/uploads` → 7 days immutable;
  Vercel hashes asset names the same way).
- Skeleton loaders avoid layout shift and perceived jank during API waits.

## Error handling

Controllers throw `ApiError` (status + safe message + optional field details). The global error handler
maps Mongoose `CastError`/`ValidationError`, Zod errors, MongoDB duplicate keys, JWT errors, Multer errors,
and JSON parse failures to stable responses. Unexpected 5xx errors are logged server-side; production
responses replace the message with a generic string and never include stack traces. The client surfaces
`getApiError()` messages in toasts and inline banners.

## Extension points

- **Real-time tracking**: `orderSchema.statusHistory` and the status machine are ready for a WebSocket or
  SSE channel; nothing else needs to change to push updates.
- **Payments**: `paymentService.js` is the only module that speaks to Razorpay; adding Stripe means adding
  a sibling provider and updating `paymentProviderStatus()`.
- **Restaurants as accounts**: the `Restaurant` model has no owner user yet. Multi-tenant restaurant logins
  would add a `restaurantAdmin` role and scope menu/orders by `restaurant._id`.
- **Search**: text indexes cover restaurant names, cuisines, tags, and dish names. Replacing them with
  Atlas Search or a dedicated engine is isolated to `restaurantController` and `menuController`.
