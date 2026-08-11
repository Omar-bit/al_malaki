import useSWR from 'swr';
import { getPublicProducts, getPublicCategories } from '../services/productService';

export function usePublicProducts() {
  const { data: products = [], isLoading: productsLoading, error: productsError } = useSWR(
    'public:products',
    getPublicProducts,
  );

  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useSWR(
    'public:categories',
    getPublicCategories,
  );

  return {
    products,
    categories,
    isLoading: productsLoading || categoriesLoading,
    error: productsError ?? categoriesError,
  };
}
