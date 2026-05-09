import React from 'react';

export function FormField({
  label,
  value,
  onChange,
  textarea,
  type = 'text',
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  textarea?: boolean;
  type?: React.HTMLInputTypeAttribute;
}) {
  return (
    <label className='block text-sm text-[#6D5A46]'>
      <span className='mb-2 block font-semibold text-black'>{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className='mt-1 w-full rounded-2xl border-2 border-[#d5bd9d] bg-white/80 px-4 py-3 text-sm text-black placeholder-[#a89580] outline-none transition-all focus:border-dark-red focus:bg-white focus:ring-4 focus:ring-dark-red/10 resize-none'
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className='mt-1 w-full rounded-full border-2 border-[#d5bd9d] bg-white/80 px-4 py-3 text-sm text-black placeholder-[#a89580] outline-none transition-all focus:border-dark-red focus:bg-white focus:ring-4 focus:ring-dark-red/10'
        />
      )}
    </label>
  );
}
