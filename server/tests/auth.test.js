import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  app,
  connectDB,
  createAdmin,
  createUser,
  disconnectDB,
  loginAs,
  request,
  resetDatabase,
  User,
} from './helpers.js';

describe('authentication and authorization', () => {
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

  it('registers a customer, ignores attempted role escalation, and signs them in', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'New Customer',
      email: 'new.customer@cravio.test',
      phone: '9876500001',
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!',
      role: 'admin',
    });

    expect(response.status).toBe(201);
    expect(response.body.data.user.role).toBe('customer');
    expect(response.body.data.user.password).toBeUndefined();
    expect(response.headers['set-cookie'].join(';')).toContain('cravio_token=');

    const user = await User.findOne({ email: 'new.customer@cravio.test' });
    expect(user).not.toBeNull();
    expect(user.role).toBe('customer');
  });

  it('rejects duplicate registrations with a safe conflict response', async () => {
    await createUser({ email: 'duplicate@cravio.test' });

    const response = await request(app).post('/api/auth/register').send({
      name: 'Duplicate Customer',
      email: 'duplicate@cravio.test',
      phone: '9876500002',
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!',
    });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/already exists/i);
  });

  it('rejects an incorrect password and accepts the correct one', async () => {
    const user = await createUser({ email: 'login@cravio.test' });

    const wrong = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: 'WrongPassword123!',
    });
    expect(wrong.status).toBe(401);

    const correct = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: 'Password123!',
    });
    expect(correct.status).toBe(200);
    expect(correct.body.data.user.email).toBe(user.email);
  });

  it('protects authenticated routes and enforces the admin role', async () => {
    const customer = await createUser();
    const admin = await createAdmin();
    const customerToken = await loginAs(customer);
    const adminToken = await loginAs(admin);

    const anonymous = await request(app).get('/api/orders/my-orders');
    expect(anonymous.status).toBe(401);

    const customerAdminAccess = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', customerToken);
    expect(customerAdminAccess.status).toBe(403);

    const adminAccess = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', adminToken);
    expect(adminAccess.status).toBe(200);
  });

  it('enforces the CSRF double-submit check for cookie-authenticated writes', async () => {
    const agent = request.agent(app);

    const register = await agent.post('/api/auth/register').send({
      name: 'CSRF Customer',
      email: 'csrf@cravio.test',
      phone: '9876500003',
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!',
    });
    expect(register.status).toBe(201);

    const address = {
      label: 'Home',
      line1: '14, 12th Main Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      isDefault: true,
    };

    const blocked = await agent.post('/api/users/addresses').send(address);
    expect(blocked.status).toBe(403);
    expect(blocked.body.message).toMatch(/csrf/i);

    const csrf = await agent.get('/api/auth/csrf');
    expect(csrf.status).toBe(200);
    const token = csrf.body.data.csrfToken;
    expect(token).toMatch(/^[a-f0-9]{64}$/);

    const allowed = await agent
      .post('/api/users/addresses')
      .set('X-CSRF-Token', token)
      .send(address);
    expect(allowed.status).toBe(201);
  });

  it('blocks disabled accounts from signing in', async () => {
    const customer = await createUser({ email: 'disabled@cravio.test', isActive: false });

    const response = await request(app).post('/api/auth/login').send({
      email: customer.email,
      password: 'Password123!',
    });

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/disabled/i);
  });
});
