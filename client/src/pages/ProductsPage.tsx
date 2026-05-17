import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Header, Footer, ProductCard } from '../components';
import { CategoryTabs } from '../components/ui/CategoryTabs';
import { FilterBar } from '../components/ui/FilterBar';
import { getPublicProducts, getPublicCategories } from '../services/productService';
import type { ProductAnalyticsProduct, ProductCategory } from '../types/product';
import toast from 'react-hot-toast';

export function ProductsPage() {
  const { t } = useTranslation();
  
  const [products, setProducts] = useState<ProductAnalyticsProduct[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [fetchedProducts, fetchedCategories] = await Promise.all([
          getPublicProducts(),
          getPublicCategories(),
        ]);
        
        setProducts(fetchedProducts.filter(p => p.status === 'active'));
        setCategories(fetchedCategories);
        
        if (fetchedCategories.length > 0) {
          setActiveCategory(fetchedCategories[0].name);
        }
      } catch (error) {
        toast.error('Failed to load products');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const categoryNames = categories.map(c => c.name);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = activeCategory ? product.category === activeCategory : true;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  return (
    <div className='relative bg-cream min-h-screen overflow-x-hidden flex flex-col'>
      <Header />
      
      <main className='flex-grow pt-[120px] px-5 pb-20 max-w-7xl mx-auto w-full'>
        {isLoading ? (
          <div className='flex justify-center items-center h-64'>
            <div className='text-dark-red text-xl'>Loading...</div>
          </div>
        ) : (
          <>
            <CategoryTabs 
              categories={categoryNames} 
              activeCategory={activeCategory} 
              onSelectCategory={setActiveCategory} 
            />

            <FilterBar 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              sortOptions={[{ value: 'all', label: t('products.sortAll', 'Tous') }]}
            />

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16 justify-items-center mt-10'>
              {filteredProducts.map((product) => (
                <div key={product.id} className='w-full max-w-[350px]'>
                  <ProductCard name={product.name} image={product.images[0]} slug={product.slug} />
                </div>
              ))}
              
              {filteredProducts.length === 0 && (
                <div className='col-span-1 md:col-span-2 lg:col-span-3 text-center text-dark-red py-10'>
                  {t('products.noResults', 'No products found matching your criteria.')}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
