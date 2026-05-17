import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header, Footer } from '../components';
import { getPublicProduct } from '../services/productService';
import type { ProductAnalyticsProduct } from '../types/product';
import toast from 'react-hot-toast';

export function ProductDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [product, setProduct] = useState<ProductAnalyticsProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      try {
        setIsLoading(true);
        const data = await getPublicProduct(slug);
        setProduct(data);
      } catch (error) {
        toast.error('Failed to load product details');
        navigate('/products');
      } finally {
        setIsLoading(false);
      }
    }

    loadProduct();
  }, [slug, navigate]);

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  return (
    <div className='relative bg-cream min-h-screen overflow-x-hidden flex flex-col'>
      <Header />

      <main className='flex-grow pt-[120px] px-5 pb-20 max-w-7xl mx-auto w-full'>
        {isLoading ? (
          <div className='flex justify-center items-center h-64'>
            <div className='text-dark-red text-xl'>Loading...</div>
          </div>
        ) : !product ? (
          <div className='flex justify-center items-center h-64'>
            <div className='text-dark-red text-xl'>Product not found</div>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center'>
            {/* Left side: Image */}
            <div className='w-full aspect-square bg-[#A89885] rounded-[40px] overflow-hidden flex items-center justify-center shadow-lg'>
              {product.images && product.images[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className='w-full h-full object-cover'
                />
              ) : (
                <div className='text-[#e8dbcc] font-abee'>No Image</div>
              )}
            </div>

            {/* Right side: Details */}
            <div className='flex flex-col text-dark-red'>
              <h1 className='text-6xl md:text-7xl font-abril font-bold leading-tight mb-8'>
                {product.name}
              </h1>

              <p className='text-lg md:text-xl font-abee mb-10 leading-relaxed max-w-md'>
                {product.description ||
                  'A refined and pure honey selection, carefully crafted by nature to bring you energy, balance, and a quiet moment of indulgence.'}
              </p>

              <div className='flex items-center gap-10 mb-10'>
                <span className='text-2xl font-bold font-abril'>
                  {product.price.toFixed(2)} DT
                </span>
                <span className='text-xl font-bold font-abril uppercase tracking-wider'>
                  350G JAR
                </span>
              </div>

              <div className='flex items-center gap-6 mb-12'>
                <div className='flex items-center border border-dark-red rounded-sm'>
                  <button
                    onClick={handleDecrement}
                    className='px-4 py-2 text-lg font-abee hover:bg-dark-red hover:text-cream transition-colors'
                  >
                    -
                  </button>
                  <div className='px-4 py-2 border-l border-r border-dark-red text-lg font-bold font-abee'>
                    {quantity}
                  </div>
                  <button
                    onClick={handleIncrement}
                    className='px-4 py-2 text-lg font-abee hover:bg-dark-red hover:text-cream transition-colors'
                  >
                    +
                  </button>
                </div>
              </div>

              <button className='w-fit px-12 py-4 rounded-[41px] bg-honeyPattern bg-[#e6d7c2] font-abhaya text-2xl font-extrabold text-dark-red hover:opacity-90 transition-opacity shadow-md mb-16'>
                Add to cart
              </button>

              {/* Specs Footer */}
              <div className='grid grid-cols-3 gap-4 border-t border-dark-red/20 pt-6 text-sm font-abee text-center'>
                <div className='flex flex-col justify-center items-center px-2'>
                  <span>100%</span>
                  <span>Pure & Raw</span>
                </div>
                <div className='flex flex-col justify-center items-center px-2 border-l border-r border-dark-red/20'>
                  <span>Hand-crafted</span>
                  <span>Small batches</span>
                </div>
                <div className='flex flex-col justify-center items-center px-2'>
                  <span>Origin</span>
                  <span>Tunisia</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
