import { Link } from 'react-router-dom';
import { ImageWithFallback } from '../common/ImageWithFallback.jsx';
import { FOOD_CATEGORIES } from '../../utils/constants.js';

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-4 md:grid-cols-8">
      {FOOD_CATEGORIES.map((category, index) => (
        <Link
          key={category.name}
          to={`/search?q=${encodeURIComponent(category.query)}`}
          className="group flex flex-col items-center gap-2.5 animate-fade-up"
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <span className="relative grid aspect-square w-full max-w-[6.5rem] place-items-center overflow-hidden rounded-2xl border border-black/[0.05] bg-white p-1 shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:border-brand-200 group-hover:shadow-card">
            <ImageWithFallback
              src={category.image}
              alt={category.name}
              className="h-full w-full rounded-xl transition duration-500 group-hover:scale-105"
            />
          </span>
          <span className="text-center text-xs font-semibold text-ink-soft transition group-hover:text-brand-600 sm:text-sm">
            {category.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
