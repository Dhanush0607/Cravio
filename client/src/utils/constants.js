export const CITIES = [
  { name: 'Bengaluru', state: 'Karnataka' },
  { name: 'Mumbai', state: 'Maharashtra' },
  { name: 'Hyderabad', state: 'Telangana' },
];

export const FOOD_CATEGORIES = [
  { name: 'Pizza', query: 'Pizza', image: '/images/foods/pizza.jpg' },
  { name: 'Burgers', query: 'Burger', image: '/images/foods/burger.jpg' },
  { name: 'Biryani', query: 'Biryani', image: '/images/foods/biryani.jpg' },
  { name: 'South Indian', query: 'Dosa', image: '/images/foods/dosa.jpg' },
  { name: 'North Indian', query: 'Butter Chicken', image: '/images/foods/indian.jpg' },
  { name: 'Chinese', query: 'Noodles', image: '/images/foods/chinese.jpg' },
  { name: 'Desserts', query: 'Cake', image: '/images/foods/dessert.jpg' },
  { name: 'Beverages', query: 'Coffee', image: '/images/foods/beverage.jpg' },
];

export const POPULAR_SEARCHES = [
  'Biryani',
  'Pizza',
  'Burgers',
  'Masala Dosa',
  'Butter Chicken',
  'Noodles',
  'Cheesecake',
  'Cold Coffee',
];

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Recommended' },
  { value: 'rating', label: 'Top rated' },
  { value: 'delivery', label: 'Fastest delivery' },
  { value: 'price_low', label: 'Price: low to high' },
  { value: 'newest', label: 'Newest first' },
];

export const RATING_OPTIONS = [
  { value: '', label: 'Any rating' },
  { value: '4.5', label: '4.5 and above' },
  { value: '4', label: '4.0 and above' },
  { value: '3.5', label: '3.5 and above' },
];

export const ORDER_STATUS_META = {
  pending: {
    label: 'Pending',
    description: 'We have received your order.',
    tone: 'amber',
  },
  confirmed: {
    label: 'Confirmed',
    description: 'The restaurant has confirmed your order.',
    tone: 'blue',
  },
  preparing: {
    label: 'Preparing',
    description: 'Your food is being freshly prepared.',
    tone: 'orange',
  },
  out_for_delivery: {
    label: 'Out for delivery',
    description: 'Your delivery partner is on the way.',
    tone: 'violet',
  },
  delivered: {
    label: 'Delivered',
    description: 'Your order has been delivered. Enjoy!',
    tone: 'green',
  },
  cancelled: {
    label: 'Cancelled',
    description: 'This order was cancelled.',
    tone: 'red',
  },
};

export const ORDER_STATUS_FLOW = [
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
];

export const ORDER_STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

export const PAYMENT_STATUS_META = {
  pending: { label: 'Payment pending', tone: 'amber' },
  paid: { label: 'Paid', tone: 'green' },
  failed: { label: 'Payment failed', tone: 'red' },
  refunded: { label: 'Refunded', tone: 'gray' },
};

export const FOOD_TYPE_META = {
  veg: { label: 'Vegetarian', className: 'border-success text-success' },
  'non-veg': { label: 'Non-vegetarian', className: 'border-danger text-danger' },
  egg: { label: 'Contains egg', className: 'border-amber-500 text-amber-600' },
};

export const PAYMENT_METHODS = [
  {
    value: 'cod',
    title: 'Cash on delivery',
    description: 'Pay in cash or UPI when your order arrives.',
  },
  {
    value: 'online',
    title: 'Pay online',
    description: 'Secure online payment. Test mode is clearly labelled until configured.',
  },
];

export const PAYMENT_METHOD_LABELS = Object.fromEntries(
  PAYMENT_METHODS.map((method) => [method.value, method.title])
);
