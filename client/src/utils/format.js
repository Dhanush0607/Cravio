export function formatCurrency(value) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

export function formatDate(value, options = {}) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatDeliveryTime(deliveryTime) {
  if (!deliveryTime) return '25–35 min';
  return `${deliveryTime.min}–${deliveryTime.max} min`;
}

export function formatCount(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value) || 0);
}

export function getInitials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function titleCase(value = '') {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return Number(count) === 1 ? singular : plural;
}

export function getApiError(error) {
  return {
    message:
      error?.response?.data?.message ||
      error?.message ||
      'Something went wrong. Please try again.',
    errors: error?.response?.data?.errors || [],
    status: error?.response?.status,
  };
}

export function fieldErrors(error) {
  const result = {};
  for (const item of getApiError(error).errors) {
    if (item?.field) {
      result[item.field] = item.message;
    }
  }
  return result;
}
