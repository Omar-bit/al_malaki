import crown from '../../assets/crown.png';

interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryTabs({ categories, activeCategory, onSelectCategory }: CategoryTabsProps) {
  return (
    <div className='flex justify-center items-end gap-16 md:gap-32 mb-12 mt-16'>
      {categories.map((category) => {
        const isActive = activeCategory === category;
        return (
          <div
            key={category}
            className='flex flex-col items-center cursor-pointer transition-transform hover:scale-105'
            onClick={() => onSelectCategory(category)}
          >
            {isActive ? (
              <img src={crown} alt='Crown' className='w-20  mb-2' />
            ) : (
              <div className='h-12' /> /* Placeholder for crown to maintain layout */
            )}
            <h2 className={`text-2xl font-nova md:text-5xl  font-bold text-dark-red ${isActive ? '' : 'opacity-80'}`}>
              {category}
            </h2>
          </div>
        );
      })}
    </div>
  );
}
