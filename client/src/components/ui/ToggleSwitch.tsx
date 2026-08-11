import { Loader2 } from 'lucide-react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  loading?: boolean;
  activeColor?: string;
  disabled?: boolean;
  title?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  loading = false,
  activeColor = 'bg-green-500',
  disabled = false,
  title,
}: ToggleSwitchProps) {
  return (
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled || loading}
      title={title}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-dark-red focus:ring-offset-2 disabled:opacity-50 ${
        checked ? activeColor : 'bg-gray-300'
      }`}
    >
      {loading ? (
        <Loader2
          className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-white ${checked ? 'left-[20px]' : 'left-0.5'}`}
        />
      ) : (
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      )}
    </button>
  );
}
