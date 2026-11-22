# CRAVIO

**Your cravings. Delivered.**

<p align="center">
  <img src="client/public/favicon.svg" alt="CRAVIO logo" width="88" />
</p>

<p align="center">
  <img src="client/public/images/foods/hero-food.jpg" alt="A spread of freshly prepared food from CRAVIO" width="850" />
</p>

<p align="center">
  <img src="client/public/images/foods/biryani.jpg" alt="Biryani" width="32%" />
  <img src="client/public/images/foods/pizza.jpg" alt="Pizza" width="32%" />
  <img src="client/public/images/foods/burger.jpg" alt="Burger" width="32%" />
</p>

CRAVIO is a production-oriented full-stack food delivery platform built with the MERN stack. Customers
discover restaurants, search and filter menus, build a cart, apply coupons, place orders with delivery
addresses and payment choices, and follow each order through its lifecycle. Administrators get a
separate dashboard for restaurants, menus, orders, customers, coupons, and platform metrics.

---

## Table of contents

- [What is included](#what-is-included)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Demo accounts and seed data](#demo-accounts-and-seed-data)
- [Scripts](#scripts)
- [Testing and verification](#testing-and-verification)
- [Security model](#security-model)
- [Payments](#payments)
- [Image handling](#image-handling)
- [Deployment](#deployment)
- [Known limitations](#known-limitations)
- [Documentation](#documentation)

---

## What is included

### Customer experience

- Animated marketing homepage with hero search, categories, popular restaurants, top dishes, and offer
  banners driven by the API.
- Restaurant listing with search, cuisine and rating filters, sorting, and pagination.
- Restaurant detail page with cover image, rating, delivery estimate, opening status, category anchors, and
  per-dish availability and veg/non-veg indicators.
- Global search across restaurants, dishes, and cuisines with debounced queries and empty states.
- Explorative discovery page with cuisines, featured kitchens, and curated dish lists.
- Persistent cart with single-restaurant enforcement, quantity limits, and cart totals calculated by shared
  pricing utilities. Adding a dish from another restaurant opens an explicit replace-cart confirmation
  instead of silently discarding items.
- Coupon box with server-validated discount previews.
- Checkout with saved addresses, contact number, payment method choice, and a server-recalculated quote.
- Order success, order history with status filters, and an order detail page with a status timeline,
  cancellation for eligible orders, and payment state.
- Profile management, address book (add, edit, delete, set default), password change, and account summary.
- Floating **Cravio Assistant** chat widget that answers questions about dishes, offers, fees, payment
  modes, and the signed-in customer's own latest order using live database data. It is read-only: it never
  places, cancels, or changes an order, and it upgrades to an OpenAI-compatible LLM automatically when
  `AI_API_KEY` is configured.
- Responsive navigation with a location selector, cart badge, account menu, and mobile drawer.

### Administration

- Separate protected `/admin` workspace with its own layout and navigation.
- Dashboard with revenue, order counts, customer counts, restaurant counts, status mix, a 7-day revenue
  series, orders needing attention, and recent orders.
- Restaurant management: create, edit, deactivate, availability and featured flags, image upload.
- Menu management: create, edit, delete, availability, pricing, categories, food types, image upload.
- Order management: search, filter by status/payment state/date, inspect full order, cancel, and move orders
  through validated status transitions.
- Customer management: search, activity stats, order history, and account enable/disable.
- Coupon management: create, edit, deactivate, and reactivate coupons with percentage or fixed discounts,
  minimum order amounts, caps, expiry dates, and usage limits.
- Image uploads with type and size validation, stored locally in development or on Cloudinary when
  configured.

### Platform behaviour

- All money is recalculated on the server from database prices; client totals are display-only.
- Idempotency keys prevent duplicate orders from double submits, retries, or network replays.
- Coupon usage is reserved atomically and released if order creation fails or the order is cancelled.
- Order status transitions are validated by a single server-side state machine.
- Customers can only read and cancel their own orders; every admin route re-checks the admin role.

---

## Tech stack

| Layer      | Technology                                                                     |
| ---------- | ------------------------------------------------------------------------------ |
| Frontend   | React 18, Vite 6, React Router 7, Tailwind CSS 3, Axios, Context API, Lucide   |
| Forms      | React Hook Form + Zod 4                                                        |
| Backend    | Node.js 20+, Express 4, MongoDB, Mongoose 8                                    |
| Auth       | JWT (HttpOnly cookie), bcryptjs, CSRF double-submit tokens                     |
| Validation | Zod schemas on every route that accepts input                                  |
| Uploads    | Multer (local `/uploads`) or Cloudinary when credentials are present            |
| Payments   | Razorpay REST integration, plus an explicitly labelled development test mode    |
| Tests      | Vitest 5, Supertest, React Testing Library, jsdom                              |
| Tooling    | ESLint 9, Prettier 3, npm workspaces, Nodemon                                  |

---

## Repository layout

```text
cravio/
├── client/                     # React + Vite frontend
│   ├── public/images/          # Local food and restaurant imagery
│   ├── src/
│   │   ├── components/         # common, layout, home, restaurant, cart, assistant, admin
│   │   ├── context/            # Auth, Cart, Toast, Location providers
│   │   ├── hooks/              # useApi, useDebounce, useClickOutside
│   │   ├── pages/              # Home, Restaurants, Search, Cart, Checkout, Orders, Profile, Auth, Admin…
│   │   ├── routes/             # ProtectedRoute, AdminRoute
│   │   ├── services/           # Thin Axios service layer per domain
│   │   ├── tests/              # Vitest + React Testing Library suites
│   │   ├── utils/              # pricing helpers, formatters, constants
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vercel.json             # SPA rewrites + security headers
│   └── vite.config.js          # Dev proxy to the API, Vitest config
├── server/
│   ├── config/                 # env validation, Mongo connection
│   ├── controllers/            # auth, user, restaurant, menu, coupon, order, payment, admin
│   ├── middleware/             # auth, CSRF, validation, rate limits, sanitisation, errors
│   ├── models/                 # User, Restaurant, MenuItem, Order, Coupon, Payment
│   ├── routes/                 # /api/* routers
│   ├── services/               # pricing, coupons, order status, payments, uploads, assistant
│   ├── tests/                  # Vitest + Supertest API suites
│   ├── validators/             # Zod request schemas
│   ├── seed.js                 # Idempotent development seed
│   ├── app.js                  # Express app
│   └── server.js               # HTTP server + graceful shutdown
├── docs/
│   ├── architecture.md
│   ├── database.md
│   └── api-documentation.md
├── AGENTS.md                   # Permanent project instructions for agents
└── README.md
```

---

## Quick start

### Prerequisites

- Node.js 20 or newer (developed on Node 24)
- npm 9 or newer
- MongoDB 6+ running locally (developed against MongoDB 8.2) or a MongoDB Atlas connection string

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the server

```bash
cp server/.env.example server/.env
```

Generate a strong JWT secret and paste it into `server/.env`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Minimum required values:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/cravio
JWT_SECRET=<64+ character random string>
CLIENT_URL=http://localhost:5173
COOKIE_SECURE=false
PAYMENTS_DEV_MODE=true
```

### 3. Seed development data

```bash
npm run seed
```

The seed refuses to run when `NODE_ENV=production`. It creates or updates the demo restaurants, menu
items, coupons, an administrator, and a demo customer. Running it again refreshes catalogue data without
duplicating documents.

### 4. Start the application

```bash
npm run dev
```

- Frontend: <http://localhost:5173>
- API: <http://localhost:5000>
- Health check: <http://localhost:5000/api/health>

The Vite dev server proxies `/api` and `/uploads` to the API, so no `VITE_API_URL` is needed locally.

### 5. Build and run in production mode locally

```bash
npm run build          # builds the React client into client/dist
NODE_ENV=production npm run start -w server
```

---

## Environment variables

### Server (`server/.env`)

| Variable                  | Required | Notes                                                                 |
| ------------------------- | -------- | --------------------------------------------------------------------- |
| `NODE_ENV`                | Yes      | `development`, `test`, or `production`                                |
| `PORT`                    | No       | Defaults to `5000`                                                    |
| `MONGO_URI`               | Yes      | Local MongoDB or Atlas connection string                              |
| `JWT_SECRET`              | Yes      | Minimum 32 characters; the app refuses to start otherwise             |
| `JWT_EXPIRES_IN`          | No       | Defaults to `7d`                                                      |
| `CLIENT_URL`              | Yes      | Frontend origin used for CORS and cookie scoping                      |
| `CLIENT_URLS`             | No       | Comma-separated additional allowed origins (preview deployments)      |
| `COOKIE_SECURE`           | Prod     | Must be `true` in production; defaults to `true` when `NODE_ENV=production` |
| `PAYMENTS_DEV_MODE`       | No       | Enables the labelled payment simulator. Blocked in production         |
| `RAZORPAY_KEY_ID`         | No       | Enables live Razorpay order creation when both keys are set           |
| `RAZORPAY_KEY_SECRET`     | No       | Used for server-side signature verification                           |
| `CLOUDINARY_CLOUD_NAME`   | No       | Enables Cloudinary uploads when all three values are set              |
| `CLOUDINARY_API_KEY`      | No       |                                                                       |
| `CLOUDINARY_API_SECRET`   | No       |                                                                       |
| `AI_API_KEY`              | No       | Enables LLM answers in the assistant when set; the built-in grounded engine is used otherwise |
| `AI_BASE_URL`             | No       | OpenAI-compatible base URL; defaults to `https://api.openai.com/v1`   |
| `AI_MODEL`                | No       | Chat model name; defaults to `gpt-4o-mini`                            |
| `ADMIN_NAME`              | No       | Seed administrator display name                                       |
| `ADMIN_EMAIL`             | No       | Seed administrator email                                             |
| `ADMIN_PASSWORD`          | Seed     | Required for production seeding; never commit a real value            |
| `SEED_DEMO_PASSWORD`      | No       | Password for the seeded demo customer                                 |

Server-side environment variables are validated with Zod at startup. Production additionally refuses to
boot when `PAYMENTS_DEV_MODE=true` or `COOKIE_SECURE` is not `true`.

### Client (`client/.env`)

| Variable       | Notes                                                                 |
| -------------- | --------------------------------------------------------------------- |
| `VITE_API_URL` | Public API origin, for example `https://cravio-api.onrender.com`. Leave empty locally to use the Vite proxy. |

Only values safe to expose in a browser may use the `VITE_` prefix.

---

## Demo accounts and seed data

| Role     | Email               | Password             |
| -------- | ------------------- | -------------------- |
| Admin    | `admin@cravio.dev`  | `CravioAdmin2026!`   |
| Customer | `demo@cravio.dev`   | `DemoCustomer123!`   |

These come from the development environment and are created by `npm run seed`. Change them before using
any shared or public environment.

Seed contents: 8 restaurants across Bengaluru, Mumbai, and Hyderabad, 76 menu items with mixed veg,
non-veg, and egg options, and four coupons:

| Code         | Rule                                                    |
| ------------ | ------------------------------------------------------- |
| `SPECIAL80`  | 80% off, capped at ₹80, minimum order ₹199, once per customer |
| `CRAVIO50`   | Flat ₹50 off above ₹299, three uses per customer        |
| `FEAST20`    | 20% off capped at ₹120 above ₹499, two uses per customer |
| `WEEKEND100` | Flat ₹100 off above ₹699, once per customer             |

---

## Scripts

Run from the repository root:

| Command                | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Runs API (Nodemon) and client (Vite) together    |
| `npm run dev:server`   | API only                                         |
| `npm run dev:client`   | Client only                                      |
| `npm run build`        | Production build of the client                   |
| `npm run start`        | Starts the API with `node server.js`             |
| `npm run seed`         | Seeds development data                           |
| `npm test`             | Backend tests, then frontend tests               |
| `npm run test:server`  | Backend Vitest + Supertest suites                |
| `npm run test:client`  | Frontend Vitest + React Testing Library suites   |
| `npm run lint`         | ESLint for both workspaces                       |
| `npm run format`       | Prettier write                                   |
| `npm run format:check` | Prettier check                                   |

---

## Testing and verification

Last verified run in this repository:

| Check                             | Result                                              |
| --------------------------------- | --------------------------------------------------- |
| `npm run build -w client`         | Passed — 1,726 modules transformed, production bundle emitted |
| `npm run lint`                    | Passed — 0 errors, 0 warnings in both workspaces    |
| `npm run test -w server`          | Passed — 5 files, 28 tests (Vitest 5 + Supertest)   |
| `npm run test -w client`          | Passed — 5 files, 18 tests (Vitest 5 + RTL)         |
| `npm audit --omit=dev`            | 0 vulnerabilities in runtime dependencies           |
| Manual browser walkthrough        | Home, listing, detail, cart, coupon, checkout, order success, history, admin dashboard, admin coupons, login/logout, mobile nav, protected redirects — no console errors |

Backend suites cover: registration and role escalation, duplicate email, login failures, protected and
admin-only routes, CSRF enforcement, disabled accounts, coupon rules including `SPECIAL80`, authoritative
totals, unavailable dishes, cross-restaurant dishes, minimum order, idempotent replays, coupon reuse,
ownership scoping, status transitions, COD settlement, online payment delivery guard, admin restaurant and
menu CRUD, coupon validation, customer activity, upload rejection, and assistant grounding (live coupons,
dish search by city, per-customer order privacy, guest handling, and input validation).

Frontend suites cover: currency, date, and delivery formatting, cart pricing helpers, cart provider
behaviour (restaurant conflicts, quantity limits, persistence), authentication forms through React Hook
Form + Zod + the API boundary, and the chat widget (open/Escape, send with the active city, retry on
failure).

Reproduce everything with:

```bash
npm run lint
npm run build
npm run test
```

---

## Security model

- **Passwords** are hashed with bcrypt (cost 12) in a Mongoose pre-save hook. Password fields are
  `select: false` and removed from JSON output.
- **Sessions** use a signed JWT stored in an HttpOnly, SameSite=Lax cookie. `tokenVersion` allows
  invalidating sessions after a password change. Bearer tokens are accepted for API clients and tests.
- **CSRF** uses a double-submit token: a random `cravio_csrf` cookie plus an `X-CSRF-Token` header,
  compared with `timingSafeEqual`. Requests without an auth cookie are not blocked, and Bearer-authenticated
  requests bypass the check.
- **Authorization** is enforced in middleware (`protect`, `requireAdmin`) and re-checked per resource; order
  reads and cancellations are scoped to the authenticated owner.
- **Input validation** happens with Zod schemas for params, query strings, and bodies, before controllers run.
- **Injection defence**: request bodies and params are sanitised by stripping keys beginning with `$` or
  containing `.`; Mongoose casting plus Zod validation reject malformed identifiers. There is no use of
  user-controlled objects in `$where` or similar operators.
- **Rate limiting** applies globally (600 requests / 15 min) and to authentication endpoints
  (25 requests / 15 min). Limits are skipped in the test environment.
- **Headers and CORS**: Helmet, `x-powered-by` disabled, strict origin allow-list with credentials, request
  bodies capped at 100 kB.
- **Errors** return safe messages with field-level details. Stack traces are only attached in non-production
  responses for 5xx errors; secrets are never included.
- **Images** are limited to JPEG, PNG, WebP, GIF, and AVIF up to 5 MB, with server-side MIME and extension
  checks.
- **Price and discount manipulation** is blocked because the server ignores client prices, recalculates the
  quote from database data, and validates coupons again at order creation.

---

## Payments

- `GET /api/payments/config` reports the active mode: `razorpay` when both keys are set, `development` when
  `PAYMENTS_DEV_MODE=true`, otherwise `unavailable`.
- With Razorpay configured, the server creates the gateway order, verifies the signature with an HMAC-SHA256
  comparison, and fetches the payment to confirm captured status before marking an order paid.
- Without credentials, the development simulator creates a `development` payment record and the UI labels it
  **TEST MODE — online payments are simulated; no real money is charged.** It never claims a real payment
  succeeded.
- Card numbers and CVVs are never stored or transmitted through Cravio's own API.
- Online orders cannot be marked delivered while payment is still pending.

---

## Image handling

- Seeded and local assets live in `client/public/images/` so the app works offline without third-party URLs.
- Admin uploads are validated and written to `server/uploads/` in development, served at `/uploads`.
- When all three Cloudinary variables are set, uploads go to Cloudinary instead and only the secure URL is
  stored in MongoDB.
- Only image URLs/paths are stored in documents; binaries never live inside MongoDB.
- The client falls back to a local placeholder when an image fails to load and lazy-loads below-the-fold
  imagery.

---

## Deployment

### Database — MongoDB Atlas

1. Create a cluster and a database user with least-privilege access.
2. Allow the API host's IP range (or use private networking).
3. Copy the connection string into `MONGO_URI`, including the database name.
4. The app creates indexes on startup through Mongoose `autoIndex`; verify them in production and consider
   building indexes explicitly during a maintenance window on large datasets.

### API — Render (or any Node host)

- Root directory: `server` (or the repository root with `npm install && npm start`)
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`
- Environment: `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `CLIENT_URLS`,
  `COOKIE_SECURE=true`, plus optional Razorpay and Cloudinary values.
- Do **not** enable `PAYMENTS_DEV_MODE` in production; the server refuses to start if it is.
- Seed the administrator once, deliberately, with `ADMIN_PASSWORD` set. The seed script never runs
  automatically.
- If uploads stay on local disk, mount a persistent volume or switch to Cloudinary before scaling to
  multiple instances.

### Client — Vercel

- Import the repository, set the root directory to `client`.
- Build command: `npm run build`; output directory: `dist`.
- Set `VITE_API_URL` to the public API origin.
- `client/vercel.json` provides the SPA rewrite and baseline security headers.
- Add the Vercel domain to `CLIENT_URL`/`CLIENT_URLS` on the API, and keep `COOKIE_SECURE=true` so the auth
  cookie is sent over HTTPS.

### Post-deploy checklist

1. `GET /api/health` returns `200`.
2. Register, sign in, and refresh the page to confirm the cookie session survives.
3. Load the homepage and confirm restaurant data comes from the API.
4. Place a COD order and move it through the admin status flow.
5. Confirm `/admin` is inaccessible to a customer account.
6. Confirm `GET /api/payments/config` reports the intended payment mode.

---

## Known limitations

- **Delivery tracking is status-based, not GPS-based.** There is no courier or maps integration, so the app
  never claims live location tracking.
- **Razorpay is untested against live credentials** in this repository. The integration is implemented and
  signature-verified, but real gateway flows require your own keys and a sandbox run.
- **Email, SMS, and push notifications are not implemented.** Order updates are visible in-app only.
- **Uploads on local disk do not survive ephemeral hosts.** Use Cloudinary or a persistent volume in
  production.
- **The assistant is read-only and grounded.** Without `AI_API_KEY` it answers through a deterministic intent
  engine over live restaurant, menu, coupon, fee, and order data. With a key it uses an OpenAI-compatible
  model, but it still cannot place, cancel, or modify orders, issue refunds, or invent prices. LLM replies
  are not guaranteed to be perfect; support remains the fallback for disputes.
- **Two moderate `npm audit` advisories remain in dev-only tooling** (`nodemon` → `minimatch`). Runtime
  dependencies audit clean (`npm audit --omit=dev` → 0 vulnerabilities).
- **Automated browser E2E is not part of the suite.** Flows were verified manually in a real browser, and
  the API is covered by integration tests; adding Playwright is a sensible next step.
- **Payments are single-currency (INR)** and prices are formatted for the Indian market.

---

## Documentation

- [Architecture](docs/architecture.md)
- [Database design](docs/database.md)
- [API reference](docs/api-documentation.md)
- [Agent and contributor instructions](AGENTS.md)
