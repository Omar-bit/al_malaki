import type { ReactNode } from 'react';

type TBackgroundVariant = 'honeyPattern' | 'redPattern';

const bgStyles = {
  honeyPattern: 'url(/honey_pattern.png)',
  redPattern: 'redPattern',
};
export default function Button({
  classNames,
  backgroundVariant = 'honeyPattern',
  children,
  disabled,
  onClick,
}: {
  classNames?: string;
  backgroundVariant?: TBackgroundVariant;
  children: ReactNode;
  disabled?: boolean;
  onClick?: (e?: any) => void;
}) {
  return (
    <button
      onClick={onClick ? onClick : () => {}}
      className={
        ` rounded-md text-white font-semibold hover:cursor-pointer px-5 py-2 ` +
        classNames
      }
      style={{
        backgroundImage: bgStyles[backgroundVariant],
        backgroundSize: 'cover',
      }}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
