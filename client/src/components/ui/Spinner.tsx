import { twMerge } from 'tailwind-merge';

interface SpinnerProps {
  /** Extra classes to override size/colour (defaults match the app's brand spinner). */
  className?: string;
}

/** Brand loading spinner (a spinning ring). */
export function Spinner({ className }: SpinnerProps) {
  return (
    <div
      className={twMerge(
        'animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900',
        className,
      )}
    />
  );
}

/** Full-viewport centred spinner, used for route-level loading states. */
export function FullPageSpinner() {
  return (
    <div className='min-h-screen flex items-center justify-center'>
      <Spinner />
    </div>
  );
}
