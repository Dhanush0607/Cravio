# CRAVIO API reference

Base URL: `http://localhost:5000/api` in development. Every response is JSON. On Render/Vercel deployments
the API lives on its own origin (see README → Deployment).

## Conventions

### Response envelope

Success:

```json
{ "success": true, "message": "Optional human message.", "data": { ... } }
```

List endpoints add `meta`:

```json
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 8, "total": 42, "totalPages": 6, "hasMore": true } }
```

Failure:

```json
{ "success": false, "message": "Something went wrong.", "errors": [{ "field": "email", "message": "..." }] }
```

`errors` appears for validation failures; `errors[].field` maps onto client form fields.

### Status codes

| Code | Meaning                                                        |
| ---- | -------------------------------------------------------------- |
| 200  | Success (also returned for idempotent replays)                 |
| 201  | Resource created                                               |
| 400  | Validation failure, business rule violation                    |
| 401  | Missing/expired/invalid session                                |
| 403  | CSRF failure, forbidden resource, or CORS-blocked origin       |
| 404  | Unknown route or resource                                      |
| 409  | Duplicate email, or a replayed idempotency key owned by another user |
| 429  | Rate limit exceeded                                            |
| 500  | Unexpected server error (message is generic in production)     |
| 502  | Payment gateway failure                                        |

### Authentication

After login/register, the API sets an HttpOnly `cravio_token` cookie. Via cookie, unsafe methods also
require the CSRF header pair (see below). API clients may instead send `Authorization: Bearer <token>`,
which bypasses CSRF. Endpoints marked **auth** require either; **admin** additionally requires the admin
role.

### CSRF

```http
Set-Cookie: cravio_csrf=<token>          (set automatically on first request)
X-CSRF-Token: <same token>               (echo on POST/PUT/PATCH/DELETE)
```

`GET /api/auth/csrf` returns `{ data: { csrfToken } }`. The browser client fetches it once and retries
once after a 403.

### Rate limits

Global: 600 requests / 15 min per IP. Auth register/login: 25 requests / 15 min per IP. Assistant chat:
60 requests / 15 min per IP. Limits are skipped when `NODE_ENV=test`.

---

## Health

### `GET /api/health`

```json
{ "success": true, "data": { "status": "ok", "service": "cravio-api", "environment": "development", "timestamp": "..." } }
```

---

## Auth — `/api/auth`

| Method | Path        | Auth | Description                                     |
| ------ | ----------- | ---- | ----------------------------------------------- |
| GET    | `/csrf`     | —    | Returns `{ csrfToken }`                         |
| POST   | `/register` | —    | Create a customer account (rate limited)        |
| POST   | `/login`    | —    | Sign in (rate limited)                          |
| POST   | `/logout`   | —    | Clears the auth cookie                          |
| GET    | `/me`       | auth | Current user profile                            |

**POST /register** body: `{ name, email, phone, password, confirmPassword }`. Phone matches
`/^\+?[0-9]{10,15}$/`; password needs ≥8 chars with upper, lower, and a digit. Attempts to send `role` are
ignored — accounts are always `customer`. Sets the auth cookie on success.

**POST /login** body: `{ email, password }`. Sets the cookie. Disabled accounts are rejected with a clear
message. Wrong credentials return `401` with a generic message.

---

## Users — `/api/users` (all auth)

| Method | Path                  | Description                                    |
| ------ | --------------------- | ---------------------------------------------- |
| GET    | `/profile`            | Profile with addresses                          |
| PUT    | `/profile`            | Update `{ name, phone? }`                       |
| PUT    | `/password`           | `{ currentPassword, newPassword, confirmPassword }`; bumps `tokenVersion` |
| GET    | `/addresses`          | Saved addresses (default first)                 |
| POST   | `/addresses`          | `{ label, line1, line2?, landmark?, city, state, pincode, isDefault? }` (max 9) |
| PUT    | `/addresses/:id`      | Edit or set default                             |
| DELETE | `/addresses/:id`      | Remove a non-default address unless it is the only one |

---

## Restaurants — `/api/restaurants` (public)

| Method | Path                | Query / Params                                        |
| ------ | ------------------- | ----------------------------------------------------- |
| GET    | `/`                 | `search?, city?, cuisine?, minRating?, sort=featured\|rating\|delivery\|price_low\|newest, page, limit` |
| GET    | `/cuisines`         | Distinct active cuisines                              |
| GET    | `/:id/menu`         | ObjectId id; `search?, category?, onlyAvailable?`     |
| GET    | `/:identifier`      | ObjectId **or** slug                                  |

`GET /` returns `{ restaurants, meta }` with current offers. `GET /:identifier` returns
`{ restaurant }` including `isOpen`; inactive restaurants 404. `GET /:id/menu` returns `{ items, categories }`.

---

## Menu — `/api/menu` (public)

| Method | Path     | Query                                        |
| ------ | -------- | -------------------------------------------- |
| GET    | `/top`   | `city?, limit?, foodType?` — top dishes       |
| GET    | `/`      | `search, city?, category?, foodType?, page, limit` |
| GET    | `/:id`   | Single dish with its restaurant summary       |

---

## Coupons — `/api/coupons`

| Method | Path        | Auth | Description                                        |
| ------ | ----------- | ---- | -------------------------------------------------- |
| GET    | `/featured` | —    | Active, unexpired coupons for marketing surfaces   |
| POST   | `/validate` | auth | `{ code, subtotal }` → `{ coupon, discount }` or a 400 explaining exactly why it failed |

Validation errors distinguish invalid/inactive, expired, exhausted-global, minimum-order-shortfall
(including the ₹ gap), and per-user-limit-reached cases so the UI can show precise messages.

---

## Orders — `/api/orders` (all auth)

### `POST /`

```json
{
  "restaurantId": "ObjectId",
  "items": [{ "menuItemId": "ObjectId", "quantity": 2 }],
  "addressId": "ObjectId",
  "paymentMethod": "cod" | "online",
  "couponCode": "SPECIAL80?",
  "contactPhone": "+9198...?",
  "idempotencyKey": "client-key?"
}
```

`idempotencyKey` may also be sent as the `X-Idempotency-Key` header; the server generates one if omitted.
The server re-resolves every dish, recomputes the subtotal, re-validates the coupon, applies delivery and
platform fees, and stores snapshots. Replays return the original order with `200` and
`"This order was already placed."`.

Failed requests (all 400): restaurant unavailable/closed, dish unavailable or from another restaurant,
invalid quantity (1–20), subtotal below the restaurant minimum, address city outside the delivery city,
coupon rejection.

### `GET /my-orders`

Query: `status=all|pending|confirmed|preparing|out_for_delivery|delivered|cancelled`, `page`, `limit`.
Returns the authenticated customer's orders only, newest first.

### `GET /:id`

Owner or admin. Returns the full order with populated restaurant and customer.

### `PATCH /:id/cancel`

Body: `{ reason }` (5–300 chars). Allowed to the owner while the order is `pending` or `confirmed`.
Releases the coupon reservation and sets `paymentStatus: refunded` for online orders already paid —
otherwise it just cancels.

---

## Payments — `/api/payments`

| Method | Path      | Auth | Description                                                     |
| ------ | --------- | ---- | --------------------------------------------------------------- |
| GET    | `/config` | —    | `{ mode: 'razorpay'\|'development'\|'unavailable', enabled, label, notice? }` |
| POST   | `/create` | auth | `{ orderId }` — creates a gateway order (or a dev-mode stub)     |
| POST   | `/verify` | auth | `{ orderId, providerOrderId, providerPaymentId?, signature? }`   |

Verification recomputes the Razorpay HMAC-SHA256 signature server-side and re-fetches the payment from the
gateway API; only then does the order become `paid`. In development mode the stub payment is labelled as
such. A `502` wrapped `ApiError` reports gateway failures verbatim from Razorpay's payload.

---

## Assistant — `/api/assistant`

### `POST /chat`

Guest-accessible with optional authentication (rate limited to 60 requests / 15 min per IP).

```json
{
  "message": "Show me offers",
  "city": "Bengaluru?",
  "history": [{ "role": "user" | "assistant", "content": "…" }]
}
```

- `message` is required, trimmed, 1–500 characters.
- `city` is optional and defaults to `Bengaluru`.
- `history` is optional, limited to 8 messages, with roles restricted to `user` and `assistant`.

The reply is grounded in live data: active restaurants and menu items in the requested city, redeemable
coupons, the platform-fee rules, and — only when the caller is signed in — that customer's own latest
order. The assistant is read-only and never accepts prices, totals, or status changes from the client.

```json
{
  "success": true,
  "data": {
    "reply": "Here are the coupons you can use right now:\n• SPECIAL80: 80% off up to ₹80 on orders above ₹199 …",
    "suggestions": ["How do I apply a coupon?", "What are the delivery fees?", "Show me restaurants"],
    "actions": [{ "label": "Go to cart", "href": "/cart" }],
    "intent": "coupon",
    "city": "Bengaluru",
    "provider": "builtin"
  }
}
```

`actions` always contain internal app paths. `provider` is `builtin` for the deterministic intent engine and
`llm` when an OpenAI-compatible model answered via `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL`. Any LLM
failure (timeout, non-2xx, malformed payload) falls back silently to the built-in reply, so the endpoint
never depends on an external provider being available.

---

## Admin — `/api/admin` (all admin)

Every route below requires an authenticated admin; the router applies `protect, requireAdmin` centrally.

### Dashboard

`GET /dashboard` → totals (revenue excluding cancelled, orders, pending/completed, customers,
restaurants), a 7-day revenue series, the order-status mix, orders needing attention, recent orders with
customer and restaurant summaries, plus top restaurants.

### Restaurants

| Method | Path                | Notes                                                      |
| ------ | ------------------- | ---------------------------------------------------------- |
| GET    | `/restaurants`      | `status=all\|active\|inactive`, `search`, `page`, `limit`   |
| POST   | `/restaurants`      | Create; slug auto-generated                                |
| PUT    | `/restaurants/:id`  | Update fields incl. `isActive`, `isOpen`, `featured`        |
| DELETE | `/restaurants/:id`  | Deactivate (soft delete)                                    |

### Menu

| Method | Path           | Notes                                                          |
| ------ | -------------- | -------------------------------------------------------------- |
| GET    | `/menu`        | `restaurant?` (required ObjectId), `search?`, `availability`, pagination |
| POST   | `/menu`        | Create; validates the restaurant exists                        |
| PUT    | `/menu/:id`    | Update incl. `price`, `isAvailable`, `isRecommended`            |
| DELETE | `/menu/:id`    | Delete a dish (historical orders keep their snapshots)          |

### Orders

| Method | Path                  | Notes                                                        |
| ------ | --------------------- | ------------------------------------------------------------ |
| GET    | `/orders`             | `status`, `paymentStatus`, `search` (id/customer/restaurant), `from`/`to` dates, pagination |
| PUT    | `/orders/:id/status`  | `{ status, note? }` — transition-validated                    |

Transitions follow `pending→confirmed→preparing→out_for_delivery→delivered`, with `cancelled` reachable
from the first three. Invalid moves return `400` with the allowed transitions. `delivered` settles COD
orders to `paid`; online orders must already be `paid`.

### Customers

| Method | Path                      | Notes                                              |
| ------ | ------------------------- | -------------------------------------------------- |
| GET    | `/customers`              | `search`, `status`, pagination; includes activity counts |
| GET    | `/customers/:id/orders`   | Sample of that customer's recent orders            |
| PUT    | `/customers/:id/status`   | `{ isActive }` — disable/enable sign-in            |

### Coupons

| Method | Path             | Notes                                                               |
| ------ | ---------------- | ------------------------------------------------------------------- |
| GET    | `/coupons`       | `status`, `search`, pagination; includes computed usage stats        |
| POST   | `/coupons`       | `{ code, description?, discountType, discountValue, minimumOrderAmount?, maximumDiscount?, expiryDate, usageLimit?, perUserLimit?, isActive? }` |
| PUT    | `/coupons/:id`   | Edit rules or description; usage counters are not editable           |
| DELETE | `/coupons/:id`   | Deactivate (`isActive: false`)                                       |

### Uploads

`POST /api/admin/uploads` — `multipart/form-data` with field `image`. Accepts JPEG/PNG/WebP/GIF/AVIF up to
5 MB. Returns `{ url }`: a Cloudinary secure URL when configured, otherwise an `/uploads/...` path.
Non-images and oversized files are rejected with `400`.

---

## Example session

```bash
# CSRF token + login
curl -c jar.txt http://localhost:5000/api/auth/csrf
curl -c jar.txt -b jar.txt -H "Content-Type: application/json" \
  -d '{"email":"demo@cravio.dev","password":"DemoCustomer123!"}' \
  http://localhost:5000/api/auth/login

# Validate a coupon
curl -b jar.txt -H "Content-Type: application/json" \
  -d '{"code":"SPECIAL80","subtotal":358}' \
  http://localhost:5000/api/coupons/validate

# Place an order (idempotent)
curl -b jar.txt -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $(awk '/cravio_csrf/ {print $7}' jar.txt)" \
  -d '{"restaurantId":"...","items":[{"menuItemId":"...","quantity":2}],"addressId":"...","paymentMethod":"cod","couponCode":"SPECIAL80"}' \
  http://localhost:5000/api/orders
```

Or, with Bearer auth (no CSRF needed):

```bash
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/orders/my-orders
```
