export function InsightCard({
  description,
  productName,
  icon,
}: {
  title: string; // Kept for backwards compatibility but not displayed
  description: string;
  productName?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className='flex items-start gap-3 rounded-[18px] border border-[#3F060F] bg-[#D9D9D957] p-4 min-h-[90px] shadow-md shadow-gray-300'>
      {/* Icon */}
      <div className='flex h-8 w-8 items-center justify-center rounded-md bg-[#BE9D61] text-[#000000] shrink-0 mt-0.5'>
        {icon ? (
          icon
        ) : (
          <svg
            className='h-4 w-4'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.8'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M8 4h8l1 3H7L8 4z' />
            <rect x='6' y='7' width='12' height='13' rx='3' />
            <path d='M12 10 Q13 13 12 15' />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className='flex flex-col'>
        {productName && (
          <p className='text-lg font-bold text-black mb-0.5'>{productName}</p>
        )}
        <p className='text-[13px] leading-snug text-[#6d5a46]'>{description}</p>
      </div>
    </div>
  );
}
