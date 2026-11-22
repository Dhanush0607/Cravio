import mongoose from 'mongoose';
import { Coupon } from '../models/Coupon.js';
import { CouponCustomerUsage } from '../models/CouponCustomerUsage.js';
import { Order } from '../models/Order.js';
import { withTransaction } from './couponService.js';

/**
 * Rebuild reservation state from retained order records. Run with order writes
 * paused; all data changes are transactional and safe to rerun.
 */
export async function migrateCouponReservations({ logger = console } = {}) {
  const duplicateGroups = await CouponCustomerUsage.aggregate([
    { $group: { _id: { coupon: '$coupon', customer: '$customer' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]);
  if (duplicateGroups.length) {
    logger.warn(
      `Rebuilding ${duplicateGroups.length} duplicate coupon/customer usage groups from order history.`
    );
  }

  const malformedCouponOrders = await Order.countDocuments({
    'coupon.code': { $nin: ['', null] },
    $or: [{ 'coupon.couponId': { $exists: false } }, { 'coupon.couponId': null }],
  });
  if (malformedCouponOrders) {
    throw new Error(
      `Coupon reservation migration found ${malformedCouponOrders} coupon orders without couponId; repair those orders before retrying.`
    );
  }

  const summary = await withTransaction(async (session) => {
    const couponOrders = await Order.find({
      'coupon.couponId': { $exists: true, $ne: null },
    })
      .select('_id coupon.couponId customer orderStatus')
      .session(session)
      .lean();

    const couponIds = [...new Set(couponOrders.map((order) => order.coupon.couponId.toString()))];
    const existingCoupons = await Coupon.find({ _id: { $in: couponIds } })
      .select('_id')
      .session(session)
      .lean();
    const existingCouponIds = new Set(existingCoupons.map(({ _id }) => _id.toString()));
    const missingCoupons = couponIds.filter((id) => !existingCouponIds.has(id));
    if (missingCoupons.length) {
      throw new Error(
        `Coupon reservation migration found orders referencing missing coupons: ${missingCoupons.join(', ')}`
      );
    }

    const usageGroups = new Map();
    const globalCounts = new Map();
    for (const order of couponOrders) {
      if (order.orderStatus === 'cancelled') continue;
      const couponId = order.coupon.couponId.toString();
      const customerId = order.customer.toString();
      const key = `${couponId}:${customerId}`;
      usageGroups.set(key, {
        coupon: order.coupon.couponId,
        customer: order.customer,
        usageCount: (usageGroups.get(key)?.usageCount || 0) + 1,
      });
      globalCounts.set(couponId, (globalCounts.get(couponId) || 0) + 1);
    }

    await CouponCustomerUsage.deleteMany({}).session(session);
    if (usageGroups.size) {
      await CouponCustomerUsage.insertMany([...usageGroups.values()], { session });
    }

    await Coupon.updateMany({}, { $set: { usageCount: 0 } }, { session });
    if (globalCounts.size) {
      await Coupon.bulkWrite(
        [...globalCounts].map(([id, usageCount]) => ({
          updateOne: { filter: { _id: new mongoose.Types.ObjectId(id) }, update: { $set: { usageCount } } },
        })),
        { session }
      );
    }

    await Order.updateMany(
      { 'coupon.couponId': { $exists: true, $ne: null }, orderStatus: { $ne: 'cancelled' } },
      { $set: { couponReservationActive: true } },
      { session }
    );
    await Order.updateMany(
      { 'coupon.couponId': { $exists: true, $ne: null }, orderStatus: 'cancelled' },
      { $set: { couponReservationActive: false } },
      { session }
    );

    return {
      couponOrders: couponOrders.length,
      activeReservations: [...globalCounts.values()].reduce((sum, count) => sum + count, 0),
      customers: usageGroups.size,
      duplicateUsageGroupsRebuilt: duplicateGroups.length,
    };
  });

  // createIndexes rejects duplicate-key conflicts and is awaited before this
  // migration reports success, so deployment cannot silently proceed without it.
  await CouponCustomerUsage.createIndexes();
  logger.info('Coupon reservation migration complete.', summary);
  return summary;
}
