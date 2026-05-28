import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Lazy-loaded image with skeleton placeholder and error fallback.
 */
export default function OptimizedImage({
  src,
  alt = '',
  className,
  imgClassName,
  fallback = '🛒',
  priority = false,
  ...props
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={cn('flex items-center justify-center bg-emerald-50/80 text-4xl', className)}>
        {fallback}
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-gray-100" aria-hidden />}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-200',
          loaded ? 'opacity-100' : 'opacity-0',
          imgClassName
        )}
        {...props}
      />
    </div>
  );
}
