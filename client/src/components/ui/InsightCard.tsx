
export function InsightCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className='group rounded-[28px] border border-[#d5bd9d] bg-gradient-to-br from-[#F4E0D4]/50 to-[#F7EEE1]/30 p-6 min-h-45 transition-all hover:shadow-sm hover:border-[#c8b49c]'>
      <h3 className='text-lg font-bold text-black'>{title}</h3>
      <p className='mt-4 text-sm leading-6 text-[#6D5A46] min-h-20 font-medium'>
        {description}
      </p>
    </div>
  );
}
