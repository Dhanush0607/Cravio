# AGENTS.md — CRAVIO project instructions

This file tells coding agents and new contributors how to work inside this repository without breaking
working functionality. Read it before writing code.

## Project identity

- **CRAVIO** — full-stack food delivery platform. Tagline: "Your cravings. Delivered."
- npm workspaces monorepo: `client/` (React + Vite) and `server/` (Express + MongoDB).
- The product language is English and prices are in INR (₹).

## Non-negotiable rules

1. **The server is the only authority on money.** Never trust a price, discount, fee, or total sent by the
   client. Recalculate every order from database documents via `server/services/pricingService.js` and
   `server/services/couponService.js`. Client-side totals in `client/src/utils/cart.js` are for display and
   must stay logically identical to the server's rules.
2. **Never trust a coupon or status change from the client.** Validate coupons with
   `validateCoupon()` and change status only through the transitions in
   `server/services/orderStatusService.js`.
3. **`SPECIAL80` is a seeded fixture.** Rules: 80% off, capped at ₹80, minimum order ₹199, one use per
   customer, active only inside its validity window. Tests assert these exact rules — if you must change
   them, change the tests and the seed together.
4. **Never run the seed against production.** `server/seed.js` guards on `NODE_ENV` and refuses in
   production, but do not weaken that guard.
5. **Never commit secrets.** `.env` files are git-ignored; `.env.example` files contain placeholders only.
   Do not invent real keys, card numbers, or gateway credentials in code, tests, or docs.
6. **Do not fake payment success.** Without Razorpay credentials, the app runs the labelled development
   simulator. Never present a simulated payment as a real one and never bypass signature verification.
7. **Do not claim live GPS delivery tracking.** Tracking is status-based only unless a real courier
   integration is added.
8. **Preserve idempotency.** Order creation must keep accepting an idempotency key (body or
   `X-Idempotency-Key` header) and must keep returning the original order on replay. Duplicate orders are a
   critical bug.
9. **Preserve coupon atomicity.** Coupon use is reserved with a conditional `$inc` and released when order
   creation fails or the order is cancelled. Do not replace this with read-then-write logic.
10. **Admin APIs authorize themselves.** Every `/api/admin` route passes through `protect` and
    `requireAdmin`. Hiding admin screens is not security.

## Architecture conventions

- **Server layering**: routes → `validate()` (Zod) → controller → service/model. Controllers never contain
  pricing or transition rules; they orchestrate services.
- **Client layering**: pages compose components; all HTTP goes through `client/src/services/*`, which call
  the shared Axios instance in `services/api.js`. Components never call `fetch` directly.
- **State**: Context API (`AuthContext`, `CartContext`, `ToastContext`, `LocationContext`). No global state
  library — do not add one.
- **Forms**: React Hook Form with a Zod schema and `zodResolver`. Zod 4 syntax only (`z.literal(true, {
  error: '…' })`, `superRefine`). Do not use removed Zod 3 APIs (`errorMap` on literals,
  `z.ZodIssueCode` paths are fine only inside `superRefine`).
- **Styling**: Tailwind with the design tokens in `client/tailwind.config.js` (brand orange `#FF6B35`,
  ink `#222222`, canvas `#FAFAF8`). Use the shared `Button`, `Input`, `Modal`, `StatusBadge`,
  `QuantityControl`, `Feedback` components instead of restyling primitives inline.
- **Icons**: Lucide only.
- **Routing**: lazy-loaded routes in `client/src/App.jsx`. New admin pages go under the `AdminRoute`
  element and the `AdminLayout` outlet; new customer pages under `CustomerLayout`.

## Adding features

**New API endpoint**

1. Add a Zod schema in `server/validators/`.
2. Add the controller with `asyncHandler` and throw `ApiError` for expected failures.
3. Register the route, applying `protect`/`requireAdmin` as appropriate.
4. Extend or add a test in `server/tests/` — include a negative case (unauthorised or invalid input).
5. Document the endpoint in `docs/api-documentation.md`.

**New page**

1. Add the lazy import and route in `client/src/App.jsx`.
2. Use `useApi` for data fetching and `useToast` for notifications.
3. Cover loading (`PageLoader`/skeletons), error (`ErrorState`), and empty (`EmptyState`) states.
4. Check the page at mobile width before finishing.

**New model field**

1. Update the Mongoose schema with validation and add any needed index.
2. Update the matching Zod validators (create and update variants).
3. Check whether order item snapshots, pricing, or admin forms consume the field.
4. `docs/database.md` documents every collection and index — update it.

## Testing expectations

- Run from the repo root: `npm run lint`, `npm run test`, and `npm run build` before declaring work done.
- Backend tests run against the `cravio_test` database (`server/vitest.config.js` sets `MONGO_URI` and
  `NODE_ENV=test`; rate limits are skipped when `NODE_ENV=test`).
- Frontend tests use jsdom + React Testing Library with `cleanup` between tests.
- Never report a test, build, or lint result you did not run. If something fails, report the failure
  honestly with the error text.
- `npm audit --omit=dev` must stay clean for runtime dependencies. Dev-only advisories are acceptable but
  must be listed in the README's known limitations.

## Current state (checkpoint)

- Backend: 4 suites / 23 tests passing. Frontend: 4 suites / 15 tests passing. Build passes. Lint is clean
  in both workspaces.
- A live browser walkthrough of the customer flow (home → listing → restaurant → cart → coupon
  `SPECIAL80` → checkout → COD order → order success → history) and the admin dashboard/coupon flows has
  been completed without console errors.
- Documentation: `README.md`, `AGENTS.md`, `docs/architecture.md`, `docs/database.md`,
  `docs/api-documentation.md`. Keep them in sync with reality.

## Known limitations (do not "fix" silently)

- No live delivery tracking, email/SMS notifications, or real courier integration.
- Razorpay is implemented and signature-verified but not exercised against live gateway credentials.
- Local uploads live on disk and do not survive ephemeral hosts; Cloudinary is the production path.
- Dev-only audit advisories: `nodemon` → `minimatch` (moderate).
