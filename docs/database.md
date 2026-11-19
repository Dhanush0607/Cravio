# CRAVIO database design

MongoDB 8 via Mongoose 8. Six collections, all defined in `server/models/`. Document shapes favour
embedding (addresses, order item snapshots, status history) because every read path is by user, order, or
restaurant — no cross-collection joins that would benefit from population-heavy designs.

## Collections

### users

| Field          | Type       | Notes                                                              |
| -------------- | ---------- | ------------------------------------------------------------------ |
| `name`         | String     | required, trimmed, 2–60 chars                                      |
| `email`        | String     | required, unique, lowercase, trimmed, email regex                  |
| `phone`        | String     | required, `/^\+?[0-9]{10,15}$/`                                    |
| `password`     | String     | required, bcrypt hash (cost 12), `select: false`, stripped in JSON |
| `role`         | String     | `customer` \| `admin`, immutable, default `customer`               |
| `addresses`    | Subdocs[≤9]| `{ label, line1, line2, landmark, city, state, pincode, isDefault }` |
| `isActive`     | Boolean    | admin can disable an account; disabled accounts cannot sign in     |
| `tokenVersion` | Number     | bumped on password change to invalidate JWTs; `select: false`      |
| `lastLoginAt`  | Date       |                                                                    |

Auto timestamps (`createdAt`, `updatedAt`).

Indexes: `{ role: 1, createdAt: -1 }` (admin customer listing), plus the unique index on `email`.

### restaurants

| Field          | Type       | Notes                                                     |
| -------------- | ---------- | --------------------------------------------------------- |
| `name`         | String     | required, ≤100                                            |
| `slug`         | String     | unique, lowercase, generated from the name on validate    |
| `description`  | String     | required, ≤800                                            |
| `image`        | String     | cover image path/URL                                      |
| `bannerImage`  | String     | detail-page banner                                        |
| `cuisines`     | String[]   | required, at least one                                    |
| `tags`         | String[]   | searchable keywords                                       |
| `rating`       | Number     | 0–5, default 4.2                                          |
| `ratingCount`  | Number     | ≥0                                                        |
| `deliveryTime` | Object     | `{ min: 5–180, max: 5–240 }` minutes                      |
| `deliveryFee`  | Number     | ≥0, default 29                                            |
| `minOrder`     | Number     | ≥0, default 149                                           |
| `priceForTwo`  | Number     | cost estimate for two people                              |
| `offer`        | String     | marketing line shown on cards, ≤120                       |
| `address`      | Object     | `{ line1, area, city, state, pincode }`                   |
| `location`     | GeoJSON    | `Point` `[lng, lat]`, default central Bengaluru           |
| `isActive`     | Boolean    | soft delete / hide from listing                           |
| `isOpen`       | Boolean    | open/closed status; closed restaurants reject orders      |
| `featured`     | Boolean    | home page spotlight                                       |

Indexes: unique `slug`, `{ 'address.city': 1, isActive: 1, rating: -1 }` (city listing sorted by rating),
`cuisines: 1`, text index on `name/description/cuisines/tags`, and `2dsphere` on `location` for future
radius queries.

### menuitems

| Field              | Type   | Notes                                         |
| ------------------ | ------ | --------------------------------------------- |
| `restaurant`       | ObjectId → restaurants | required, indexed           |
| `name`             | String | required, ≤120                                |
| `description`      | String | required, ≤500                                |
| `image`            | String |                                               |
| `price`            | Number | required, ≥1                                  |
| `category`         | String | required, ≤80, e.g. "Pizza"                   |
| `foodType`         | String | `veg` \| `non-veg` \| `egg`                   |
| `isAvailable`      | Boolean| unavailable dishes are rejected at order time |
| `isRecommended`    | Boolean| powers top-dish lists                         |
| `preparationTime`  | Number | 1–120 minutes                                 |

Indexes: `{ restaurant: 1, category: 1, isAvailable: 1 }` (the exact query the menu page makes) and a text
index on `name/description/category` for search.

### orders

The most heavily indexed collection. Orders are **snapshots**: item names, images, prices, food types, and
the complete delivery address are copied in at purchase time, so later menu or address edits never rewrite
history.

| Field              | Type       | Notes                                                        |
| ------------------ | ---------- | ------------------------------------------------------------ |
| `orderNumber`      | String     | required, unique, e.g. `CRV-MWJG9DE7-4FB16B`                 |
| `customer`         | ObjectId → users | required                                               |
| `restaurant`       | ObjectId → restaurants | required                                         |
| `items`            | Subdocs[≥1]| `{ menuItem, name, image, price, quantity ≤20, foodType, category }` |
| `deliveryAddress`  | Subdoc     | address snapshot `{ label, line1, line2, landmark, city, state, pincode }` |
| `contact`          | Object     | `{ name, phone, email }` at purchase time                    |
| `subtotal`         | Number     | Σ item prices, server-calculated                             |
| `deliveryFee`      | Number     | restaurant fee snapshot                                      |
| `platformFee`      | Number     | 2% of subtotal, floor ₹5, cap ₹25                            |
| `discount`         | Number     | applied coupon amount                                        |
| `total`            | Number     | subtotal − discount + deliveryFee + platformFee              |
| `coupon`           | Object     | `{ couponId, code, discountType, discount }`                 |
| `paymentMethod`    | String     | `cod` \| `online`                                            |
| `paymentStatus`    | String     | `pending` \| `paid` \| `failed` \| `refunded`                |
| `orderStatus`      | String     | `pending` → `confirmed` → `preparing` → `out_for_delivery` → `delivered`, or `cancelled` |
| `statusHistory`    | Subdocs[]  | `{ status, note, changedBy, at }` appended on every change   |
| `cancellation`     | Object     | `{ reason, cancelledBy, at }` when cancelled                 |
| `idempotencyKey`   | String     | unique, sparse, `select: false` — duplicate-order guard      |
| `estimatedDeliveryMinutes` | Number | midpoint of the restaurant's window                       |

Indexes: unique `orderNumber`, `customer`, `restaurant`, `paymentStatus`, `{ customer: 1, createdAt: -1 }`
(my-orders), `{ restaurant: 1, createdAt: -1 }` (admin per-restaurant views), `{ orderStatus: 1,
createdAt: -1 }` (status filters and dashboards), `{ createdAt: -1 }` (recent orders).

### coupons

| Field                 | Type   | Notes                                            |
| --------------------- | ------ | ------------------------------------------------ |
| `code`                | String | required, unique, uppercase, `/^[A-Z0-9_-]{3,30}$/` |
| `description`         | String | ≤240, shown to customers                         |
| `discountType`        | String | `percentage` \| `fixed`                          |
| `discountValue`       | Number | ≥1 (percent or ₹ amount)                         |
| `minimumOrderAmount`  | Number | subtotal threshold, default 0                    |
| `maximumDiscount`     | Number | cap for percentage coupons; null = uncapped      |
| `expiryDate`          | Date   | required, indexed; past expiry rejects validation|
| `usageLimit`          | Number | global cap; null = unlimited                     |
| `usageCount`          | Number | incremented atomically on reservation            |
| `perUserLimit`        | Number | per-customer cap, default 1                      |
| `isActive`            | Boolean| soft toggle for campaigns                        |
| `createdBy`           | ObjectId → users | admin who created it                   |

Indexes: unique `code`, `{ isActive: 1, expiryDate: 1 }` (featured-coupon query).

**Seeded fixtures** — `SPECIAL80` (80% off, cap ₹80, min ₹199, 1 per customer), `CRAVIO50` (₹50 off, min
₹299, 3 per customer), `FEAST20` (20% off cap ₹120, min ₹499, 2 per customer), `WEEKEND100` (₹100 off, min
₹699, 1 per customer). Tests assert these rules; change the seed and the tests together.

Redemption accounting: per-user usage is derived by counting non-cancelled orders whose `coupon.couponId`
matches, which keeps the coupon document a simple global counter and survives order deletion.

### payments

One row per gateway interaction attempt.

| Field                | Type   | Notes                                        |
| -------------------- | ------ | -------------------------------------------- |
| `order`              | ObjectId → orders | required, indexed                 |
| `customer`           | ObjectId → users | required, indexed                 |
| `provider`           | String | `razorpay` \| `development`                  |
| `providerOrderId`    | String | gateway order id, indexed                    |
| `providerPaymentId`  | String | gateway payment id when captured             |
| `amount`             | Number | ≥1, matches the order total                  |
| `currency`           | String | default `INR`                                |
| `status`             | String | `created` \| `paid` \| `failed` \| `refunded` |
| `signatureVerified`  | Boolean| set only after HMAC verification succeeds    |
| `failureReason`      | String |                                              |

Online orders block the `delivered` transition until a payment row is `paid` with a verified signature, so a
payment document is part of the order's delivery preconditions.

## Modelling decisions

- **Order snapshots over references.** Menu items change; orders must not. Every order embeds the exact
  names, images, and prices the customer agreed to.
- **Atomic counters over transactions.** Coupon reservation uses a conditional `findOneAndUpdate` with
  `$inc`, which is race-safe on a single-document basis without needing replica-set transactions. The same
  primitive, run in reverse, releases the reservation if the order insert fails or the order is cancelled.
- **Sparse unique idempotency index.** `idempotencyKey` is a unique sparse index, so duplicate order
  creation collapses to a replay of the first order while documents without a key (none in practice) would
  still be allowed.
- **Soft deletes everywhere.** Restaurants, menu items, coupons, and users use `isActive`/`isAvailable`
  flags. Nothing that financial or operational history references is ever physically removed.
- **Deriving per-user coupon usage by query.** Storing a `usedBy` array would grow unbounded; counting
  orders is bounded by `perUserLimit` checks and uses the existing `customer` index.

## Conventions

- All schemas disable `versionKey` and enable `timestamps`.
- `User.toJSON` strips `password` and `tokenVersion`; `Restaurant.toJSON` exposes virtuals.
- ObjectId fields are validated as ObjectIds by Zod before they ever reach a query.
- Seeding (`server/seed.js`) is idempotent and refuses to run when `NODE_ENV=production`; production
  administrators must be seeded deliberately with `ADMIN_PASSWORD` set.

## Migration notes

Mongoose `autoIndex` builds indexes in development automatically. In production with a large dataset, set
`autoIndex: false` and build indexes with a deployment script during a maintenance window. No schema
migrations have been required so far; additive fields should be introduced with defaults so existing
documents remain valid.
