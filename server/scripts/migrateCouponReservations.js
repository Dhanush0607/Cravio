import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { migrateCouponReservations } from '../services/couponReservationMigration.js';

// This command repairs records before creating the unique index. Disable
// automatic background index creation so duplicate legacy rows cannot make the
// migration fail before it has reconciled them from order history.
mongoose.set('autoIndex', false);

try {
  await connectDB();
  await migrateCouponReservations();
} catch (error) {
  console.error('Coupon reservation migration failed:', error.message);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}
