import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PasswordInputProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
  labelClassName?: string;
  hasError?: boolean;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}

function EyeOpen() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' className='h-5 w-5' aria-hidden='true'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M2 12s3.3-8 10-8 10 8 10 8-3.3 8-10 8S2 12 2 12z' />
      <circle cx='12' cy='12' r='3' />
    </svg>
  );
}

function EyeClosed() {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' className='h-5 w-5' aria-hidden='true'>
      <path strokeLinecap='round' strokeLinejoin='round' d='M3 3l18 18m-2.4-2.4A10.5 10.5 0 0 1 12 20C6.5 20 3.2 15.9 2 12c.6-1.9 1.6-3.6 2.9-5m3.1-2.4A10.8 10.8 0 0 1 12 4c5.5 0 8.8 4.1 10 8-0.6 1.9-1.6 3.6-2.9 5M15 12a3 3 0 0 1-4.5 2.6' />
    </svg>
  );
}

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete = 'current-password',
  className = '',
  labelClassName = 'mb-2 block text-[1.85rem] !font-bold text-dark-red font-(--font-abhaya) md:text-xl',
  hasError = false,
  minLength = 8,
  maxLength = 64,
  required = true,
}: PasswordInputProps) {
  const { i18n, t } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [visible, setVisible] = useState(false);

  return (
    <div className={className}>
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      <div className='relative'>
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          className={`w-full rounded-full border bg-transparent py-[0.92rem] font-(--font-abhaya) text-dark-red transition-all placeholder:text-dark-red/55 focus:outline-none focus:ring-2 ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-dark-red focus:ring-dark-red'} ${isRtl ? 'pl-12 pr-4 md:pl-14 md:pr-6' : 'pr-12 pl-4 md:pr-14 md:pl-6'}`}
        />
        <button
          type='button'
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t('login.hide_password', { defaultValue: 'Hide password' }) : t('login.show_password', { defaultValue: 'Show password' })}
          className={`absolute top-1/2 -translate-y-1/2 text-dark-red/70 hover:text-dark-red transition-colors ${isRtl ? 'left-4' : 'right-4'}`}
        >
          {visible ? <EyeClosed /> : <EyeOpen />}
        </button>
      </div>
    </div>
  );
}
