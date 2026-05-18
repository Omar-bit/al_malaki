import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Header, Footer, ProductCard } from '../components';
import { CategoryTabs } from '../components/ui/CategoryTabs';
import { FilterBar } from '../components/ui/FilterBar';
import {
  getPublicProducts,
  getPublicCategories,
} from '../services/productService';
import type {
  ProductAnalyticsProduct,
  ProductCategory,
} from '../types/product';
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

        setProducts(fetchedProducts.filter((p) => p.status === 'active'));
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

  const categoryNames = categories.map((c) => c.name);

  const sortOptions = [
    { value: 'all', label: t('products.sortAll', 'Tous') },
    { value: 'price_asc', label: t('products.sortPriceAsc', 'Prix croissant') },
    {
      value: 'price_desc',
      label: t('products.sortPriceDesc', 'Prix décroissant'),
    },
    { value: 'date_desc', label: t('products.sortDateDesc', 'Plus récents') },
    { value: 'date_asc', label: t('products.sortDateAsc', 'Plus anciens') },
  ];

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesCategory = activeCategory
        ? product.category === activeCategory
        : true;
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    // Sort the result
    result = [...result].sort((a, b) => {
      const priceA = a.discountPrice || a.price;
      const priceB = b.discountPrice || b.price;

      switch (sortBy) {
        case 'price_asc':
          return priceA - priceB;
        case 'price_desc':
          return priceB - priceA;
        case 'date_desc':
          // @ts-ignore - Check if createdAt exists, otherwise fallback to id comparison
          if (a.createdAt && b.createdAt) {
            // @ts-ignore
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          }
          return b.id.localeCompare(a.id);
        case 'date_asc':
          // @ts-ignore
          if (a.createdAt && b.createdAt) {
            // @ts-ignore
            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          }
          return a.id.localeCompare(b.id);
        case 'all':
        default:
          return 0;
      }
    });

    return result;
  }, [products, activeCategory, searchQuery, sortBy]);

  return (
    <div className='relative bg-[#f7eee1] min-h-screen overflow-x-hidden flex flex-col'>
      <Header />

      <main className='flex-grow pt-[25px] px-10 w-auto w-full'>
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
              sortOptions={sortOptions}
            />

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-5 justify-items-center mt-5'>
              {filteredProducts.map((product) => (
                <div key={product.id} className='w-full max-w-[350px]'>
                  <ProductCard
                    name={product.name}
                    image={product.images[0]}
                    slug={product.slug}
                  />
                </div>
              ))}

              {filteredProducts.length === 0 && (
                <div className='col-span-1 md:col-span-2 lg:col-span-3 text-center text-dark-red py-10'>
                  {t(
                    'products.noResults',
                    'No products found matching your criteria.',
                  )}
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
