import { useEffect, useState } from 'react';
import { imageUrl } from '../../services/api.js';
import { cn } from '../../utils/cn.js';

export function ImageWithFallback({
  src,
  fallback = '/images/foods/hero-food.jpg',
  alt,
  className,
  loading = 'lazy',
  ...props
}) {
  const resolved = imageUrl(src, fallback);
  const [currentSrc, setCurrentSrc] = useState(resolved);

  useEffect(() => {
    setCurrentSrc(resolved);
  }, [resolved]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => {
        if (currentSrc !== fallback) setCurrentSrc(fallback);
      }}
      className={cn('object-cover', className)}
      {...props}
    />
  );
}
