import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { User } from './models/User.js';
import { Restaurant } from './models/Restaurant.js';
import { MenuItem } from './models/MenuItem.js';
import { Coupon } from './models/Coupon.js';
import { Order } from './models/Order.js';
import { Payment } from './models/Payment.js';

const restaurantSeed = [
  {
    name: 'Spice Route',
    description:
      'Slow-cooked biryanis, smoky tandoor plates, and comforting North Indian classics made with hand-ground spices.',
    image: '/images/foods/indian.jpg',
    bannerImage: '/images/restaurants/restaurant-1.jpg',
    cuisines: ['North Indian', 'Biryani', 'Mughlai'],
    tags: ['Bestseller', 'Family friendly'],
    rating: 4.7,
    ratingCount: 428,
    deliveryTime: { min: 30, max: 40 },
    deliveryFee: 29,
    minOrder: 199,
    priceForTwo: 550,
    offer: 'Flat ₹80 off with SPECIAL80',
    address: {
      line1: '100 Feet Road',
      area: 'Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
    },
    featured: true,
  },
  {
    name: 'Napoli Pizza Co.',
    description:
      'Hand-stretched sourdough bases, San Marzano tomato sauce, and generous toppings baked in a stone oven.',
    image: '/images/foods/pizza.jpg',
    bannerImage: '/images/restaurants/restaurant-2.jpg',
    cuisines: ['Pizza', 'Italian', 'Continental'],
    tags: ['Wood-fired', 'Late night'],
    rating: 4.5,
    ratingCount: 312,
    deliveryTime: { min: 25, max: 35 },
    deliveryFee: 39,
    minOrder: 249,
    priceForTwo: 700,
    offer: '20% off up to ₹120 with FEAST20',
    address: {
      line1: '5th Block',
      area: 'Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560095',
    },
    featured: true,
  },
  {
    name: 'Smash & Grill',
    description:
      'Crisp-edged smash patties, buttery brioche buns, loaded fries, and thick shakes built for serious appetites.',
    image: '/images/foods/burger.jpg',
    bannerImage: '/images/restaurants/restaurant-3.jpg',
    cuisines: ['Burgers', 'American', 'Fast Food'],
    tags: ['Bestseller', 'Quick bites'],
    rating: 4.4,
    ratingCount: 256,
    deliveryTime: { min: 20, max: 30 },
    deliveryFee: 25,
    minOrder: 149,
    priceForTwo: 450,
    offer: 'Free delivery on orders above ₹399',
    address: {
      line1: '27th Main Road',
      area: 'HSR Layout',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560102',
    },
    featured: false,
  },
  {
    name: 'Dosa District',
    description:
      'Crisp dosas, fluffy idlis, and filter coffee served the way Bengaluru has loved them for generations.',
    image: '/images/foods/dosa.jpg',
    bannerImage: '/images/restaurants/restaurant-4.jpg',
    cuisines: ['South Indian', 'Breakfast', 'Vegetarian'],
    tags: ['Pure veg', 'Breakfast all day'],
    rating: 4.8,
    ratingCount: 641,
    deliveryTime: { min: 15, max: 25 },
    deliveryFee: 19,
    minOrder: 99,
    priceForTwo: 250,
    offer: 'Flat ₹50 off with CRAVIO50',
    address: {
      line1: '4th Block',
      area: 'Jayanagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560011',
    },
    featured: true,
  },
  {
    name: 'Wok This Way',
    description:
      'High-flame wok cooking, hand-pulled noodles, and fragrant curries inspired by the streets of East Asia.',
    image: '/images/foods/chinese.jpg',
    bannerImage: '/images/restaurants/restaurant-5.jpg',
    cuisines: ['Chinese', 'Asian', 'Thai'],
    tags: ['Spicy', 'Wok tossed'],
    rating: 4.3,
    ratingCount: 198,
    deliveryTime: { min: 30, max: 45 },
    deliveryFee: 35,
    minOrder: 249,
    priceForTwo: 500,
    offer: 'Flat ₹100 off above ₹699',
    address: {
      line1: 'Pali Hill Road',
      area: 'Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
    },
    featured: false,
  },
  {
    name: 'The Biryani House',
    description:
      'Dum-sealed handis, long-grain basmati, and rich Hyderabadi gravies — a celebration of the city’s most loved dish.',
    image: '/images/foods/biryani.jpg',
    bannerImage: '/images/restaurants/restaurant-6.jpg',
    cuisines: ['Biryani', 'Mughlai', 'Hyderabadi'],
    tags: ['Dum biryani', 'Bestseller'],
    rating: 4.6,
    ratingCount: 874,
    deliveryTime: { min: 35, max: 50 },
    deliveryFee: 29,
    minOrder: 299,
    priceForTwo: 600,
    offer: 'Flat ₹80 off with SPECIAL80',
    address: {
      line1: 'Road No. 12',
      area: 'Banjara Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500034',
    },
    featured: true,
  },
  {
    name: 'Sweet Cravings',
    description:
      'Small-batch cakes, warm brownies, French pastries, and dessert jars made fresh every morning.',
    image: '/images/foods/dessert.jpg',
    bannerImage: '/images/restaurants/restaurant-7.jpg',
    cuisines: ['Desserts', 'Bakery', 'Beverages'],
    tags: ['Freshly baked', 'Gifting'],
    rating: 4.7,
    ratingCount: 365,
    deliveryTime: { min: 20, max: 30 },
    deliveryFee: 25,
    minOrder: 149,
    priceForTwo: 300,
    offer: '20% off up to ₹120 with FEAST20',
    address: {
      line1: 'Lokhandwala Complex',
      area: 'Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
    },
    featured: false,
  },
  {
    name: 'Green Bowl',
    description:
      'Bright grain bowls, protein-packed salads, and cold-pressed juices made with produce sourced each morning.',
    image: '/images/foods/salad.jpg',
    bannerImage: '/images/restaurants/restaurant-8.jpg',
    cuisines: ['Healthy', 'Salads', 'Continental'],
    tags: ['High protein', 'Fresh daily'],
    rating: 4.5,
    ratingCount: 221,
    deliveryTime: { min: 25, max: 35 },
    deliveryFee: 29,
    minOrder: 199,
    priceForTwo: 400,
    offer: 'Flat ₹50 off with CRAVIO50',
    address: {
      line1: 'ITPL Main Road',
      area: 'Whitefield',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560066',
    },
    featured: true,
  },
];

const menus = {
  'Spice Route': [
    ['Tandoori Chicken', 'Char-grilled chicken marinated overnight in yogurt, ginger, and Kashmiri chilli.', 329, 'Starters', 'non-veg', true, '/images/foods/indian.jpg'],
    ['Paneer Tikka', 'Smoky cottage cheese skewers with peppers, onions, and mint chutney.', 279, 'Starters', 'veg', true, '/images/foods/indian.jpg'],
    ['Seekh Kebab', 'Hand-minced lamb kebab with green chilli, coriander, and garam masala.', 349, 'Starters', 'non-veg', false, '/images/foods/indian.jpg'],
    ['Hyderabadi Chicken Biryani', 'Long-grain basmati layered with spiced chicken and sealed on dum.', 349, 'Biryani', 'non-veg', true, '/images/foods/biryani.jpg'],
    ['Awadhi Mutton Biryani', 'Slow-cooked mutton, saffron rice, and delicate Awadhi spices.', 429, 'Biryani', 'non-veg', false, '/images/foods/biryani.jpg'],
    ['Veg Dum Biryani', 'Seasonal vegetables and basmati rice finished with fried onions and herbs.', 269, 'Biryani', 'veg', false, '/images/foods/biryani.jpg'],
    ['Butter Chicken', 'Tandoori chicken simmered in a velvety tomato, cream, and fenugreek gravy.', 369, 'Main Course', 'non-veg', true, '/images/foods/indian.jpg'],
    ['Paneer Butter Masala', 'Paneer cubes in a rich tomato-cashew gravy with a hint of kasuri methi.', 299, 'Main Course', 'veg', false, '/images/foods/indian.jpg'],
    ['Dal Makhani', 'Black lentils slow-cooked overnight with butter and cream.', 249, 'Main Course', 'veg', false, '/images/foods/indian.jpg'],
    ['Garlic Naan', 'Tandoor-baked naan brushed with garlic butter and coriander.', 69, 'Breads', 'veg', false, '/images/foods/indian.jpg'],
    ['Laccha Paratha', 'Flaky whole-wheat paratha with crisp layers.', 59, 'Breads', 'veg', false, '/images/foods/indian.jpg'],
    ['Gulab Jamun', 'Two warm milk dumplings soaked in cardamom rose syrup.', 99, 'Desserts', 'veg', false, '/images/foods/dessert.jpg'],
    ['Masala Chaas', 'Chilled spiced buttermilk with cumin and curry leaves.', 79, 'Beverages', 'veg', false, '/images/foods/beverage.jpg'],
  ],
  'Napoli Pizza Co.': [
    ['Margherita Classica', 'San Marzano tomato, fior di latte, basil, and extra virgin olive oil.', 329, 'Pizza', 'veg', true, '/images/foods/pizza.jpg'],
    ['Pepperoni Inferno', 'Crisp pepperoni, mozzarella, chilli honey, and oregano.', 429, 'Pizza', 'non-veg', true, '/images/foods/pizza.jpg'],
    ['Truffle Mushroom Pizza', 'Roasted mushrooms, mozzarella, truffle cream, and parmesan.', 469, 'Pizza', 'veg', false, '/images/foods/pizza.jpg'],
    ['Paneer Tikka Pizza', 'Tandoori paneer, peppers, mozzarella, and mint drizzle.', 399, 'Pizza', 'veg', false, '/images/foods/pizza.jpg'],
    ['Garlic Cheesy Bread', 'Stone-baked bread with garlic butter, herbs, and molten mozzarella.', 179, 'Sides', 'veg', true, '/images/foods/pizza.jpg'],
    ['Peri Peri Fries', 'Golden fries tossed in house peri peri seasoning.', 149, 'Sides', 'veg', false, '/images/foods/burger.jpg'],
    ['Pesto Alfredo Pasta', 'Penne in basil pesto cream with parmesan and toasted walnuts.', 319, 'Pasta', 'veg', false, '/images/foods/chinese.jpg'],
    ['Chicken Arrabbiata', 'Spicy tomato penne with grilled chicken and chilli flakes.', 359, 'Pasta', 'non-veg', false, '/images/foods/chinese.jpg'],
    ['Classic Tiramisu', 'Espresso-soaked sponge, mascarpone cream, and cocoa dust.', 229, 'Desserts', 'egg', false, '/images/foods/dessert.jpg'],
    ['Cold Coffee', 'Double espresso blended with milk, vanilla, and ice.', 149, 'Beverages', 'veg', false, '/images/foods/coffee.jpg'],
  ],
  'Smash & Grill': [
    ['Classic Smash Burger', 'Two crisp beef-style patties, American cheese, pickles, and house sauce.', 279, 'Burgers', 'non-veg', true, '/images/foods/burger.jpg'],
    ['Crispy Chicken Burger', 'Buttermilk-fried chicken, slaw, pickles, and hot honey mayo.', 299, 'Burgers', 'non-veg', true, '/images/foods/burger.jpg'],
    ['Paneer Crunch Burger', 'Crisp paneer patty, cheddar, lettuce, and chipotle sauce.', 249, 'Burgers', 'veg', false, '/images/foods/burger.jpg'],
    ['Mushroom Swiss Burger', 'Smashed patty, sautéed mushrooms, Swiss cheese, and truffle mayo.', 319, 'Burgers', 'non-veg', false, '/images/foods/burger.jpg'],
    ['Loaded Cheese Fries', 'Fries buried under cheddar sauce, jalapeños, and spring onions.', 199, 'Sides', 'veg', true, '/images/foods/burger.jpg'],
    ['Crispy Onion Rings', 'Beer-battered onion rings with smoky ranch dip.', 169, 'Sides', 'veg', false, '/images/foods/burger.jpg'],
    ['Chicken Wings', 'Six wings glazed in smoky bourbon barbecue sauce.', 289, 'Sides', 'non-veg', false, '/images/foods/burger.jpg'],
    ['Salted Caramel Shake', 'Thick vanilla shake swirled with salted caramel.', 189, 'Shakes', 'veg', false, '/images/foods/beverage.jpg'],
    ['Chocolate Brownie Shake', 'Chocolate shake blended with a fudge brownie.', 219, 'Shakes', 'veg', false, '/images/foods/dessert.jpg'],
  ],
  'Dosa District': [
    ['Ghee Podi Masala Dosa', 'Crisp dosa with ghee, podi, and spiced potato filling.', 149, 'Dosas', 'veg', true, '/images/foods/dosa.jpg'],
    ['Mysore Masala Dosa', 'Red chutney-lined dosa with potato masala and coconut chutney.', 159, 'Dosas', 'veg', true, '/images/foods/dosa.jpg'],
    ['Butter Cheese Dosa', 'Golden dosa loaded with butter and melted cheese.', 169, 'Dosas', 'veg', false, '/images/foods/dosa.jpg'],
    ['Set Dosa', 'Three soft, fluffy dosas served with saagu and chutney.', 129, 'Dosas', 'veg', false, '/images/foods/dosa.jpg'],
    ['Idli Vada Combo', 'Two steamed idlis and one crisp medu vada with sambar.', 109, 'Breakfast', 'veg', true, '/images/foods/dosa.jpg'],
    ['Bisi Bele Bath', 'Karnataka-style rice and lentils with vegetables and ghee.', 139, 'Breakfast', 'veg', false, '/images/foods/indian.jpg'],
    ['Rava Upma', 'Semolina upma with cashews, curry leaves, and coconut chutney.', 99, 'Breakfast', 'veg', false, '/images/foods/dosa.jpg'],
    ['Filter Coffee', 'Strong decoction coffee with hot, frothy milk.', 59, 'Beverages', 'veg', true, '/images/foods/coffee.jpg'],
    ['Badam Milk', 'Warm almond milk with saffron and cardamom.', 79, 'Beverages', 'veg', false, '/images/foods/beverage.jpg'],
    ['Rava Kesari', 'Warm semolina dessert with ghee, cashews, and raisins.', 89, 'Desserts', 'veg', false, '/images/foods/dessert.jpg'],
  ],
  'Wok This Way': [
    ['Chilli Garlic Noodles', 'Hand-pulled noodles tossed with chilli, garlic, and spring onion.', 249, 'Noodles', 'veg', true, '/images/foods/noodles.jpg'],
    ['Chicken Hakka Noodles', 'Wok-tossed noodles with shredded chicken and crunchy vegetables.', 289, 'Noodles', 'non-veg', true, '/images/foods/noodles.jpg'],
    ['Burnt Garlic Fried Rice', 'Smoky fried rice with burnt garlic and scallions.', 239, 'Rice', 'veg', false, '/images/foods/chinese.jpg'],
    ['Kung Pao Chicken', 'Diced chicken, roasted peanuts, dried chillies, and Sichuan pepper.', 319, 'Main Course', 'non-veg', true, '/images/foods/chinese.jpg'],
    ['Paneer in Black Bean Sauce', 'Crisp paneer wok-tossed in fermented black bean sauce.', 289, 'Main Course', 'veg', false, '/images/foods/chinese.jpg'],
    ['Veg Spring Rolls', 'Four crisp rolls packed with vegetables and glass noodles.', 179, 'Starters', 'veg', false, '/images/foods/chinese.jpg'],
    ['Chicken Momos', 'Six steamed dumplings with spicy red chutney.', 229, 'Starters', 'non-veg', false, '/images/foods/chinese.jpg'],
    ['Thai Green Curry', 'Fragrant coconut curry with vegetables and jasmine rice.', 329, 'Curries', 'veg', false, '/images/foods/chinese.jpg'],
    ['Iced Lemon Tea', 'Brewed black tea with fresh lemon and a touch of honey.', 99, 'Beverages', 'veg', false, '/images/foods/beverage.jpg'],
  ],
  'The Biryani House': [
    ['Hyderabadi Mutton Biryani', 'Dum-sealed mutton biryani with saffron, mint, and mirchi ka salan.', 449, 'Biryani', 'non-veg', true, '/images/foods/biryani.jpg'],
    ['Chicken Dum Biryani', 'Fragrant basmati and tender chicken cooked in a sealed handi.', 329, 'Biryani', 'non-veg', true, '/images/foods/biryani.jpg'],
    ['Egg Biryani', 'Spiced basmati with boiled eggs and caramelised onions.', 269, 'Biryani', 'egg', false, '/images/foods/biryani.jpg'],
    ['Veg Dum Biryani', 'Basmati layered with vegetables, saffron, and fried onions.', 249, 'Biryani', 'veg', false, '/images/foods/biryani.jpg'],
    ['Chicken 65', 'Crisp fried chicken with curry leaves and yoghurt chilli marinade.', 279, 'Starters', 'non-veg', true, '/images/foods/indian.jpg'],
    ['Mirchi Ka Salan', 'Tangy peanut and sesame curry with green chillies.', 129, 'Sides', 'veg', false, '/images/foods/indian.jpg'],
    ['Raita', 'Cooling yogurt with cucumber, onion, and roasted cumin.', 69, 'Sides', 'veg', false, '/images/foods/salad.jpg'],
    ['Double Ka Meetha', 'Hyderabadi bread pudding with saffron milk and nuts.', 119, 'Desserts', 'veg', false, '/images/foods/dessert.jpg'],
    ['Sulaimani Chai', 'Black tea with lemon, mint, and warming spices.', 69, 'Beverages', 'veg', false, '/images/foods/beverage.jpg'],
  ],
  'Sweet Cravings': [
    ['Belgian Chocolate Cake', 'Moist dark chocolate sponge with silky Belgian chocolate ganache.', 249, 'Cakes', 'egg', true, '/images/foods/dessert.jpg'],
    ['Red Velvet Jar', 'Red velvet layers with cream cheese frosting in a portable jar.', 199, 'Jars', 'egg', true, '/images/foods/dessert.jpg'],
    ['Fudge Brownie', 'Dense chocolate brownie with a crackly top and gooey centre.', 129, 'Bakes', 'egg', false, '/images/foods/dessert.jpg'],
    ['Biscoff Cheesecake', 'Baked cheesecake with a Biscoff crumb and caramel drizzle.', 259, 'Cakes', 'egg', false, '/images/foods/dessert.jpg'],
    ['Fresh Fruit Tart', 'Crisp tart shell, vanilla pastry cream, and seasonal fruit.', 189, 'Pastries', 'egg', false, '/images/foods/dessert.jpg'],
    ['Chocolate Chip Cookies', 'Four chewy cookies with dark chocolate chunks and sea salt.', 149, 'Bakes', 'egg', false, '/images/foods/dessert.jpg'],
    ['Hazelnut Cold Coffee', 'Cold brew blended with hazelnut, milk, and ice cream.', 179, 'Beverages', 'veg', false, '/images/foods/coffee.jpg'],
    ['Strawberry Milkshake', 'Fresh strawberries blended with vanilla ice cream.', 169, 'Beverages', 'veg', false, '/images/foods/beverage.jpg'],
  ],
  'Green Bowl': [
    ['Grilled Chicken Power Bowl', 'Herb chicken, quinoa, roasted vegetables, greens, and lemon tahini.', 349, 'Bowls', 'non-veg', true, '/images/foods/salad.jpg'],
    ['Paneer Tikka Bowl', 'Tandoori paneer, brown rice, slaw, mint yogurt, and seeds.', 319, 'Bowls', 'veg', true, '/images/foods/salad.jpg'],
    ['Mediterranean Falafel Bowl', 'Crisp falafel, hummus, couscous, pickled onion, and tahini.', 299, 'Bowls', 'veg', false, '/images/foods/salad.jpg'],
    ['Asian Sesame Chicken Salad', 'Grilled chicken, cabbage, edamame, sesame, and ginger dressing.', 329, 'Salads', 'non-veg', false, '/images/foods/salad.jpg'],
    ['Avocado Garden Salad', 'Avocado, cherry tomato, cucumber, greens, and lime vinaigrette.', 279, 'Salads', 'veg', false, '/images/foods/salad.jpg'],
    ['Thai Peanut Chicken Wrap', 'Whole-wheat wrap with chicken, crunchy vegetables, and peanut sauce.', 269, 'Wraps', 'non-veg', false, '/images/foods/chinese.jpg'],
    ['Cold Pressed Green Juice', 'Spinach, cucumber, apple, celery, lemon, and ginger.', 189, 'Juices', 'veg', true, '/images/foods/beverage.jpg'],
    ['Berry Protein Smoothie', 'Berries, banana, Greek yogurt, and plant protein.', 219, 'Juices', 'veg', false, '/images/foods/beverage.jpg'],
  ],
};

const couponSeed = [
  {
    code: 'SPECIAL80',
    description: '80% off up to ₹80 on your first Cravio order above ₹199.',
    discountType: 'percentage',
    discountValue: 80,
    minimumOrderAmount: 199,
    maximumDiscount: 80,
    usageLimit: 5000,
    perUserLimit: 1,
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  },
  {
    code: 'CRAVIO50',
    description: 'Flat ₹50 off orders above ₹299.',
    discountType: 'fixed',
    discountValue: 50,
    minimumOrderAmount: 299,
    maximumDiscount: 50,
    usageLimit: 10000,
    perUserLimit: 3,
    expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  },
  {
    code: 'FEAST20',
    description: '20% off up to ₹120 on orders above ₹499.',
    discountType: 'percentage',
    discountValue: 20,
    minimumOrderAmount: 499,
    maximumDiscount: 120,
    usageLimit: 5000,
    perUserLimit: 2,
    expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
  },
  {
    code: 'WEEKEND100',
    description: 'Flat ₹100 off weekend feasts above ₹699.',
    discountType: 'fixed',
    discountValue: 100,
    minimumOrderAmount: 699,
    maximumDiscount: 100,
    usageLimit: 2000,
    perUserLimit: 1,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
];

async function seed() {
  if (env.isProduction) {
    throw new Error('Refusing to seed a production database.');
  }

  const adminPassword = env.ADMIN_PASSWORD || 'CravioAdmin2026!';
  const demoPassword = env.SEED_DEMO_PASSWORD || 'DemoCustomer123!';

  await connectDB();

  console.log('Clearing Cravio development collections...');
  await Promise.all([
    Payment.deleteMany({}),
    Order.deleteMany({}),
    MenuItem.deleteMany({}),
    Coupon.deleteMany({}),
    Restaurant.deleteMany({}),
    User.deleteMany({}),
  ]);

  const admin = await User.create({
    name: env.ADMIN_NAME || 'Cravio Administrator',
    email: env.ADMIN_EMAIL || 'admin@cravio.dev',
    phone: '9876543210',
    password: adminPassword,
    role: 'admin',
  });

  const customer = await User.create({
    name: 'Aarav Mehta',
    email: 'demo@cravio.dev',
    phone: '9123456780',
    password: demoPassword,
    role: 'customer',
    addresses: [
      {
        label: 'Home',
        line1: '14, 12th Main Road',
        line2: 'Indiranagar',
        landmark: 'Near Metro Station',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        isDefault: true,
      },
      {
        label: 'Work',
        line1: '80 Feet Road',
        line2: 'Koramangala 4th Block',
        landmark: 'WeWork Galaxy',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560034',
        isDefault: false,
      },
    ],
  });

  const restaurants = await Restaurant.create(restaurantSeed);
  const byName = new Map(restaurants.map((restaurant) => [restaurant.name, restaurant]));

  const menuDocs = [];
  for (const [restaurantName, entries] of Object.entries(menus)) {
    const restaurant = byName.get(restaurantName);
    for (const [name, description, price, category, foodType, isRecommended, image] of entries) {
      menuDocs.push({
        restaurant: restaurant._id,
        name,
        description,
        price,
        category,
        foodType,
        isRecommended,
        image,
        isAvailable: true,
        preparationTime: 10 + Math.floor(Math.random() * 20),
      });
    }
  }

  await MenuItem.insertMany(menuDocs);
  const coupons = await Coupon.create(
    couponSeed.map((coupon) => ({ ...coupon, createdBy: admin._id }))
  );

  console.log('\nCRAVIO development data seeded successfully.');
  console.log(`  Administrator: ${admin.email}`);
  console.log(`  Administrator password: ${adminPassword}`);
  console.log(`  Demo customer: ${customer.email}`);
  console.log(`  Demo customer password: ${demoPassword}`);
  console.log(`  Restaurants: ${restaurants.length}`);
  console.log(`  Menu items: ${menuDocs.length}`);
  console.log(`  Coupons: ${coupons.length}`);
  console.log('\nChange these development credentials before deploying.\n');
}

seed()
  .then(async () => {
    await disconnectDB();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('\nSeed failed:', error.message);
    await disconnectDB().catch(() => {});
    process.exit(1);
  });
