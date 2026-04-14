export function Logo() {
  return (
    <div className='flex flex-col items-center justify-center w-[155px] h-[105px] pt-[6px]'>
      <svg
        width='38'
        height='24'
        viewBox='0 0 40 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className='mb-1'
      >
        <path
          d='M4.09375 19H35.9062V22.5H4.09375V19ZM36.1969 9.0625L28.125 15.65L20 4.3125L11.875 15.65L3.80312 9.0625L5.75 17.25H34.25L36.1969 9.0625Z'
          fill='#BE9D61'
        />
        <circle cx='20' cy='2' r='2' fill='#BE9D61' />
        <circle cx='4' cy='7' r='2' fill='#BE9D61' />
        <circle cx='36' cy='7' r='2' fill='#BE9D61' />
      </svg>
      <span className='text-[36px] leading-[1.178] tracking-[0.08em] font-italic text-[#BE9D61] uppercase'>
        AL MALAKI
      </span>
    </div>
  );
}
