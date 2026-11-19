import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  Coupon,
  MenuItem,
  Restaurant,
  app,
  connectDB,
  createAdmin,
  createRestaurant,
  createUser,
  disconnectDB,
  loginAs,
  request,
  resetDatabase,
} from './helpers.js';

const restaurantPayload = {
  name: 'Admin Created Kitchen',
  description: 'A restaurant created from the administrator dashboard.',
  image: '/images/foods/pizza.jpg',
  bannerImage: '/images/restaurants/restaurant1.jpg',
  cuisines: ['Italian', 'Pizza'],
  tags: ['New'],
  rating: 4.5,
  ratingCount: 10,
  deliveryTime: { min: 20, max: 35 },
  deliveryFee: 29,
  minOrder: 149,
  priceForTwo: 500,
  address: {
    line1: '2 Admin Street',
    area: 'Koramangala',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560034',
  },
  isActive: true,
  isOpen: true,
  featured: false,
};

describe('administrator APIs', () => {
  beforeAll(async () => {
    await connectDB();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await disconnectDB();
  });

  it('creates, updates, and deactivates restaurants', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin);

    const created = await request(app)
      .post('/api/admin/restaurants')
      .set('Authorization', token)
      .send(restaurantPayload);
    expect(created.status).toBe(201);
    const restaurant = created.body.data.restaurant;
    expect(restaurant.slug).toBe('admin-created-kitchen');

    const updated = await request(app)
      .put(`/api/admin/restaurants/${restaurant._id}`)
      .set('Authorization', token)
      .send({ deliveryFee: 39, offer: 'Free dessert this week' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.restaurant.deliveryFee).toBe(39);
    expect(updated.body.data.restaurant.offer).toMatch(/free dessert/i);

    const deactivated = await request(app)
      .delete(`/api/admin/restaurants/${restaurant._id}`)
      .set('Authorization', token);
    expect(deactivated.status).toBe(200);
    expect(deactivated.body.data.restaurant.isActive).toBe(false);
    expect(deactivated.body.data.restaurant.isOpen).toBe(false);

    const listed = await request(app)
      .get('/api/admin/restaurants?status=inactive')
      .set('Authorization', token);
    expect(listed.status).toBe(200);
    expect(listed.body.data.restaurants).toHaveLength(1);
    expect(listed.body.meta.total).toBe(1);
  });

  it('manages menu items and validates their restaurant', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin);
    const restaurant = await createRestaurant();

    const created = await request(app)
      .post('/api/admin/menu')
      .set('Authorization', token)
      .send({
        restaurant: restaurant._id.toString(),
        name: 'Admin Special Pizza',
        description: 'A pizza added by an administrator test.',
        image: '/images/foods/pizza.jpg',
        price: 399,
        category: 'Pizza',
        foodType: 'veg',
        isAvailable: true,
        isRecommended: true,
        preparationTime: 18,
      });
    expect(created.status).toBe(201);
    expect(created.body.data.item.restaurant.name).toBe(restaurant.name);

    const updated = await request(app)
      .put(`/api/admin/menu/${created.body.data.item._id}`)
      .set('Authorization', token)
      .send({ price: 449, isAvailable: false });
    expect(updated.status).toBe(200);
    expect(updated.body.data.item.price).toBe(449);

    const unavailable = await request(app)
      .get('/api/admin/menu?availability=unavailable')
      .set('Authorization', token);
    expect(unavailable.status).toBe(200);
    expect(unavailable.body.data.items).toHaveLength(1);

    const missingRestaurant = await request(app)
      .post('/api/admin/menu')
      .set('Authorization', token)
      .send({
        restaurant: '64b000000000000000000000',
        name: 'Orphan Dish',
        description: 'This dish points at a missing restaurant.',
        image: '/images/foods/pizza.jpg',
        price: 199,
        category: 'Mains',
      });
    expect(missingRestaurant.status).toBe(404);

    const deleted = await request(app)
      .delete(`/api/admin/menu/${created.body.data.item._id}`)
      .set('Authorization', token);
    expect(deleted.status).toBe(200);
    expect(await MenuItem.countDocuments()).toBe(0);
  });

  it('validates coupon rules and allows deactivation', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin);

    const invalidPercentage = await request(app)
      .post('/api/admin/coupons')
      .set('Authorization', token)
      .send({
        code: 'TOOMUCH',
        discountType: 'percentage',
        discountValue: 120,
        expiryDate: new Date(Date.now() + 86400000).toISOString(),
      });
    expect(invalidPercentage.status).toBe(400);

    const created = await request(app)
      .post('/api/admin/coupons')
      .set('Authorization', token)
      .send({
        code: 'admin25',
        description: '25% off for administrator tests',
        discountType: 'percentage',
        discountValue: 25,
        minimumOrderAmount: 299,
        maximumDiscount: 100,
        expiryDate: new Date(Date.now() + 86400000).toISOString(),
        usageLimit: 50,
        perUserLimit: 2,
        isActive: true,
      });
    expect(created.status).toBe(201);
    expect(created.body.data.coupon.code).toBe('ADMIN25');

    const updated = await request(app)
      .put(`/api/admin/coupons/${created.body.data.coupon._id}`)
      .set('Authorization', token)
      .send({ discountValue: 30, usageLimit: null });
    expect(updated.status).toBe(200);
    expect(updated.body.data.coupon.discountValue).toBe(30);
    expect(updated.body.data.coupon.usageLimit).toBeNull();

    const deactivated = await request(app)
      .delete(`/api/admin/coupons/${created.body.data.coupon._id}`)
      .set('Authorization', token);
    expect(deactivated.status).toBe(200);
    expect(deactivated.body.data.coupon.isActive).toBe(false);

    expect(await Coupon.countDocuments()).toBe(1);
  });

  it('reports customer activity and can disable or re-enable accounts', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin);
    const customer = await createUser({ email: 'managed.customer@cravio.test' });

    const disabled = await request(app)
      .put(`/api/admin/customers/${customer._id}/status`)
      .set('Authorization', token)
      .send({ isActive: false });
    expect(disabled.status).toBe(200);
    expect(disabled.body.data.customer.isActive).toBe(false);

    const login = await request(app).post('/api/auth/login').send({
      email: customer.email,
      password: 'Password123!',
    });
    expect(login.status).toBe(403);

    const enabled = await request(app)
      .put(`/api/admin/customers/${customer._id}/status`)
      .set('Authorization', token)
      .send({ isActive: true });
    expect(enabled.status).toBe(200);

    const listed = await request(app)
      .get('/api/admin/customers?search=managed.customer')
      .set('Authorization', token);
    expect(listed.status).toBe(200);
    expect(listed.body.data.customers).toHaveLength(1);
    expect(listed.body.data.customers[0].orderCount).toBe(0);
  });

  it('rejects invalid admin filters and non-image uploads', async () => {
    const admin = await createAdmin();
    const token = await loginAs(admin);

    const badFilter = await request(app)
      .get('/api/admin/restaurants?status=archived')
      .set('Authorization', token);
    expect(badFilter.status).toBe(400);

    const badUpload = await request(app)
      .post('/api/admin/uploads')
      .set('Authorization', token)
      .attach('image', Buffer.from('not really an image'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });
    expect(badUpload.status).toBe(400);
    expect(badUpload.body.message).toMatch(/jpeg, png, or webp/i);

    const dashboard = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', token);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.data.stats).toMatchObject({
      totalCustomers: 0,
      totalRestaurants: 0,
      totalOrders: 0,
      totalRevenue: 0,
    });
    expect(dashboard.body.data.salesOverview).toHaveLength(7);

    expect(await Restaurant.countDocuments()).toBe(0);
  });
});
