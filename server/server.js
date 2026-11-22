import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { Order } from './models/Order.js';
import { CouponCustomerUsage } from './models/CouponCustomerUsage.js';

let server;

async function start() {
  try {
    await connectDB();
    await CouponCustomerUsage.createIndexes();
    const unbackfilledCouponOrders = await Order.countDocuments({
      'coupon.couponId': { $exists: true, $ne: null },
      orderStatus: { $ne: 'cancelled' },
      couponReservationActive: { $ne: true },
    });
    if (unbackfilledCouponOrders) {
      throw new Error(
        `Found ${unbackfilledCouponOrders} legacy coupon orders without active reservations. Run "npm run migrate:coupon-reservations -w server" before starting this version.`
      );
    }
    server = app.listen(env.PORT, () => {
      console.log(`CRAVIO API listening on http://localhost:${env.PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start CRAVIO API:', error.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

start();
