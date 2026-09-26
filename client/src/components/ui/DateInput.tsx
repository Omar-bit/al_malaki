import { useEffect, useRef, useState } from 'react';

interface DateInputProps {
  id?: string;
  value: string;
  onChange: (isoDate: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

const DISPLAY_PLACEHOLDER = 'jj/mm/aaaa';

function isoToDisplay(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return '';
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

function displayToIso(displayDate: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(displayDate);
  if (!match) return null;

  const [, day, month, year] = match;
  const parsed = new Date(`${year}-${month}-${day}T00:00:00`);
  const isRealDate =
    parsed.getFullYear() === Number(year) &&
    parsed.getMonth() + 1 === Number(month) &&
    parsed.getDate() === Number(day);

  return isRealDate ? `${year}-${month}-${day}` : null;
}

function applyDateMask(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '').slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)];
  return parts.filter((part) => part.length > 0).join('/');
}

function CalendarIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      className='h-5 w-5'
      aria-hidden='true'
    >
      <rect x='3' y='5' width='18' height='16' rx='2' />
      <path strokeLinecap='round' d='M3 10h18M8 3v4M16 3v4' />
    </svg>
  );
}

export function DateInput({
  id,
  value,
  onChange,
  min,
  max,
  required,
  disabled,
  className = '',
  ariaLabel,
}: DateInputProps) {
  const [displayValue, setDisplayValue] = useState(() => isoToDisplay(value));
  const pickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayValue(isoToDisplay(value));
  }, [value]);

  const handleTextChange = (rawValue: string) => {
    const masked = applyDateMask(rawValue);
    setDisplayValue(masked);

    if (masked === '') {
      onChange('');
      return;
    }

    const isoDate = displayToIso(masked);
    if (isoDate) onChange(isoDate);
  };

  const handleBlur = () => {
    setDisplayValue(isoToDisplay(value));
  };

  const openNativePicker = () => {
    pickerRef.current?.showPicker?.();
  };

  return (
    <div className='relative'>
      <input
        id={id}
        type='text'
        inputMode='numeric'
        autoComplete='off'
        placeholder={DISPLAY_PLACEHOLDER}
        aria-label={ariaLabel}
        value={displayValue}
        onChange={(event) => handleTextChange(event.target.value)}
        onBlur={handleBlur}
        required={required}
        disabled={disabled}
        className={className}
      />
      <button
        type='button'
        onClick={openNativePicker}
        disabled={disabled}
        aria-label='Open date picker'
        className='absolute right-3 top-1/2 -translate-y-1/2 text-current opacity-70 transition hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40'
      >
        <CalendarIcon />
      </button>
      <input
        ref={pickerRef}
        type='date'
        tabIndex={-1}
        aria-hidden='true'
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className='pointer-events-none absolute right-3 bottom-0 h-0 w-0 opacity-0'
      />
    </div>
  );
}
