import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RestaurantCard } from '../components/restaurant/RestaurantCard.jsx';
import { TopDishCard } from '../components/food/TopDishCard.jsx';

const restaurant = {
  _id: 'rest_1',
  name: 'Napoli Pizza Co.',
  slug: 'napoli-pizza-co',
  image: '/uploads/napoli.jpg',
  cuisines: ['Pizza', 'Italian'],
  rating: 4.6,
  ratingCount: 812,
  deliveryTime: { min: 25, max: 35 },
  priceForTwo: 600,
  isOpen: true,
  featured: true,
  offer: 'Flat 20% off',
};

describe('restaurant links', () => {
  it('links a restaurant card to the restaurant detail route', () => {
    render(
      <MemoryRouter>
        <RestaurantCard restaurant={restaurant} />
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: /napoli pizza co/i });
    expect(link).toHaveAttribute('href', '/restaurants/napoli-pizza-co');
  });

  it('links a top dish card to its restaurant detail route', () => {
    render(
      <MemoryRouter>
        <TopDishCard
          item={{
            _id: 'dish_1',
            name: 'Margherita Pizza',
            image: '/uploads/margherita.jpg',
            price: 349,
            foodType: 'veg',
            restaurant,
          }}
        />
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: /margherita pizza/i });
    expect(link).toHaveAttribute('href', '/restaurants/napoli-pizza-co');
  });
});
