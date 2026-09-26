/**
 * Renders a single-colour SVG asset as a CSS mask so it inherits `currentColor`
 * and can respond to hover/active states, which a plain `<img>` cannot.
 *
 * The mask is stretched to the element box (`100% 100%`), matching how the
 * browser sizes the equivalent `<img>`, so the rendered shape is unchanged.
 */
export function MaskIcon({
  src,
  className = '',
}: {
  src: string;
  className?: string;
}) {
  // The URL must be quoted: Vite inlines small SVGs as data URIs that contain
  // a nested `url(%23clip...)`, whose closing paren would otherwise terminate
  // the outer `url()` and invalidate the mask.
  const maskUrl = `url("${src}")`;

  return (
    <span
      aria-hidden='true'
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        WebkitMaskImage: maskUrl,
        maskImage: maskUrl,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
      }}
    />
  );
}
