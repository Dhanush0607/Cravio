export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

export const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

export const CUSTOMER_CANCELLABLE_STATUSES = ['pending', 'confirmed'];

export function canTransition(currentStatus, nextStatus) {
  return Boolean(STATUS_TRANSITIONS[currentStatus]?.includes(nextStatus));
}

export function allowedNextStatuses(currentStatus) {
  return STATUS_TRANSITIONS[currentStatus] || [];
}
