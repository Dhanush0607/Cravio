import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Restaurant } from '../models/Restaurant.js';
import { MenuItem } from '../models/MenuItem.js';
import { Coupon } from '../models/Coupon.js';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';

export { app, request, connectDB, disconnectDB, User, Restaurant, MenuItem, Coupon, Order, Payment };

export const DEFAULT_PASSWORD = 'Password123!';

export const defaultAddress = {
  label: 'Home',
  line1: '14, 12th Main Road',
  line2: 'Indiranagar',
  landmark: 'Near Metro Station',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560038',
  isDefault: true,
};

let sequence = 0;

export async function resetDatabase() {
  await Promise.all([
    Payment.deleteMany({}),
    Order.deleteMany({}),
    MenuItem.deleteMany({}),
    Coupon.deleteMany({}),
    Restaurant.deleteMany({}),
    User.deleteMany({}),
  ]);
}

export async function createUser(overrides = {}) {
  sequence += 1;
  return User.create({
    name: `Test User ${sequence}`,
    email: `user${sequence}@cravio.test`,
    phone: `90000000${String(sequence).padStart(2, '0')}`,
    password: DEFAULT_PASSWORD,
    role: 'customer',
    addresses: [defaultAddress],
    ...overrides,
  });
}

export async function createAdmin(overrides = {}) {
  return createUser({
    name: 'Test Administrator',
    email: `admin${sequence}@cravio.test`,
    role: 'admin',
    ...overrides,
  });
}

export async function loginAs(user, password = DEFAULT_PASSWORD) {
  const response = await request(app).post('/api/auth/login').send({
    email: user.email,
    password,
  });

  assert.equal(
    response.status,
    200,
    `login failed for ${user.email}: ${JSON.stringify(response.body)}`
  );

  const cookies = response.headers['set-cookie'] || [];
  const authCookie = cookies.find((cookie) => cookie.startsWith('cravio_token='));
  assert.ok(authCookie, `auth cookie missing for ${user.email}`);
  const token = authCookie.split(';')[0].slice('cravio_token='.length);
  return `Bearer ${token}`;
}

export async function createRestaurant(overrides = {}) {
  sequence += 1;
  return Restaurant.create({
    name: `Test Kitchen ${sequence}`,
    description: 'A test restaurant used by the automated Cravio test suite.',
    image: '/images/foods/pizza.jpg',
    bannerImage: '/images/restaurants/restaurant1.jpg',
    cuisines: ['North Indian'],
    tags: ['Test'],
    rating: 4.4,
    ratingCount: 120,
    deliveryTime: { min: 20, max: 35 },
    deliveryFee: 29,
    minOrder: 149,
    priceForTwo: 450,
    isActive: true,
    isOpen: true,
    ...overrides,
    address: {
      line1: '1 Test Street',
      area: 'Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      ...(overrides.address || {}),
    },
  });
}

export async function createMenuItem(restaurant, overrides = {}) {
  sequence += 1;
  return MenuItem.create({
    restaurant: restaurant._id || restaurant,
    name: `Test Dish ${sequence}`,
    description: 'A delicious test dish prepared for the automated test suite.',
    image: '/images/foods/pizza.jpg',
    price: 249,
    category: 'Mains',
    foodType: 'veg',
    isAvailable: true,
    isRecommended: false,
    preparationTime: 15,
    ...overrides,
  });
}

export async function createCoupon(overrides = {}) {
  sequence += 1;
  return Coupon.create({
    code: `TEST${sequence}`,
    description: 'Automated test coupon',
    discountType: 'percentage',
    discountValue: 20,
    minimumOrderAmount: 0,
    maximumDiscount: null,
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    usageLimit: 100,
    perUserLimit: 1,
    isActive: true,
    ...overrides,
  });
}

export function auth(token) {
  return { Authorization: token };
}
