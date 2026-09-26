import { useEffect, useState, type ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import type { ContentMedia } from '../types/content';
import { contentMediaStyle } from '../utils/contentMedia';

const AUTO_ADVANCE_MS = 6000;

interface ContentMediaSliderProps {
  media: ContentMedia[];
  /**
   * Sizing/positioning for the frame — the media fills it with `object-cover`.
   * Conflicting utilities override the defaults (e.g. pass `absolute` to place
   * the frame behind a hero rather than in flow).
   */
  className?: string;
  /** Rendered when the admin has not uploaded anything for this slot. */
  fallback?: ReactNode;
  /** Dots are hidden for single-item slots regardless of this flag. */
  showDots?: boolean;
  alt?: string;
}

/**
 * Renders one admin-managed slot. A single item renders as a plain still frame;
 * two or more cross-fade as a slider.
 */
export function ContentMediaSlider({
  media,
  className = '',
  fallback = null,
  showDots = true,
  alt = '',
}: ContentMediaSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (media.length < 2) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % media.length);
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(timer);
  }, [media.length]);

  if (media.length === 0) return <>{fallback}</>;

  // Clamp during render so a shrinking slot cannot point past the end.
  const safeIndex = activeIndex < media.length ? activeIndex : 0;
  const hasSlider = media.length > 1;

  return (
    <div className={twMerge('relative overflow-hidden', className)}>
      {media.map((item, index) => (
        <div
          key={item.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === safeIndex ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden={index === safeIndex ? undefined : true}
        >
          {item.type === 'video' ? (
            <video
              src={item.url}
              className='h-full w-full object-cover'
              style={contentMediaStyle(item)}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={item.url}
              alt={alt}
              className='h-full w-full object-cover'
              style={contentMediaStyle(item)}
            />
          )}
        </div>
      ))}

      {hasSlider && showDots && (
        <div className='absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2'>
          {media.map((item, index) => (
            <button
              key={item.id}
              type='button'
              onClick={() => setActiveIndex(index)}
              aria-label={`Show media ${index + 1}`}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === safeIndex ? 'bg-[#efe0c9]' : 'bg-[#efe0c9]/45'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
