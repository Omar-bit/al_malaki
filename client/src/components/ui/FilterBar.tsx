import { useTranslation } from 'react-i18next';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  sortOptions?: { value: string; label: string }[];
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  sortOptions = [{ value: 'all', label: 'Tous' }],
}: FilterBarProps) {
  const { t } = useTranslation();

  return (
    <div className='flex flex-col sm:flex-row justify-center items-center gap-6 mb-16'>
      <div className='relative w-full sm:w-[350px]'>
        <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
          <svg className='h-6 w-6 text-[#7a6452]' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
          </svg>
        </div>
        <input
          type='text'
          placeholder={t('products.search', 'Rechercher')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className='w-full pl-12 pr-4 py-3 bg-[#e8dbcc] border border-[#d2bba0] rounded-xl text-dark-red placeholder-[#7a6452] focus:outline-none focus:ring-2 focus:ring-gold transition-colors font-abee'
        />
      </div>

      <div className='relative w-full sm:w-[350px]'>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className='w-full px-4 py-3 bg-[#e8dbcc] border border-[#d2bba0] rounded-xl text-dark-red appearance-none focus:outline-none focus:ring-2 focus:ring-gold transition-colors font-abee cursor-pointer'
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {t('products.sortBy', 'Trier par')} : {option.label}
            </option>
          ))}
        </select>
        <div className='absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none'>
          <svg className='h-5 w-5 text-[#7a6452]' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M19 9l-7 7-7-7' />
          </svg>
        </div>
      </div>
    </div>
  );
}
