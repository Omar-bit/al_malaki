
export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className='block text-sm text-[#6D5A46]'>
      <span className='mb-2 block font-semibold text-black'>{label}</span>
      <div className='relative'>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className='mt-1 w-full appearance-none rounded-full border-2 border-[#d5bd9d] bg-white/80 py-3 pl-4 pr-10 text-sm text-black outline-none transition-all focus:border-dark-red focus:bg-white focus:ring-4 focus:ring-dark-red/10 cursor-pointer'
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className='pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#d5bd9d] mt-0.5'>
          <svg
            className='h-4 w-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M19 9l-7 7-7-7'
            />
          </svg>
        </div>
      </div>
    </label>
  );
}
