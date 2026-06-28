import { useTranslation } from 'react-i18next';

interface CategoryOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categoryOptions?: CategoryOption[];
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categoryOptions = [],
}: FilterBarProps) {
  const { t } = useTranslation();

  return (
    <div className='flex flex-col sm:flex-row justify-center items-center gap-6 mb-16'>
      <div className='relative w-full sm:w-87.5'>
        <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
          <svg
            className='h-6 w-6 text-dark-red'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={1.5}
              d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
            />
          </svg>
        </div>
        <input
          type='text'
          placeholder={t('products.search', 'Rechercher')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className='w-full pl-12 pr-4 py-3 border border-dark-red rounded-xl text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-gold transition-colors font-abee bg-transparent'
        />
      </div>

      <div className='relative w-full sm:w-87.5'>
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className='w-full px-4 py-3 border border-dark-red rounded-xl text-black appearance-none focus:outline-none focus:ring-2 focus:ring-gold transition-colors font-abee cursor-pointer bg-transparent'
        >
          <option value=''>{t('products.category', 'Catégorie')}</option>
          {categoryOptions.map((option) => (
            <option
              className='text-black!'
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
        <div className='absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none'>
          <svg
            className='h-5 w-5 text-[#7a6452]'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={1.5}
              d='M19 9l-7 7-7-7'
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
