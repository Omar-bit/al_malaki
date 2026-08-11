import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Footer, ProductQRCode } from '../components';
import { ArrowLeft } from 'lucide-react';
import { getPublicProduct } from '../services/productService';
import { useCart } from '../contexts/CartContext';
import type { ProductAnalyticsProduct } from '../types/product';
import toast from 'react-hot-toast';

export function ProductDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<ProductAnalyticsProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, openCart } = useCart();

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      try {
        setIsLoading(true);
        const data = await getPublicProduct(slug);
        setProduct(data);
      } catch (error) {
        toast.error('Failed to load product details');
        console.log(error);
        navigate('/products');
      } finally {
        setIsLoading(false);
      }
    }

    loadProduct();
  }, [slug, navigate]);

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  return (
    <div className='relative bg-[#f7eee1] min-h-screen overflow-x-hidden flex flex-col'>
      <main className='flex-grow  px-5 pb-10 max-w-7xl mx-auto w-full pt-10 min-h-screen flex flex-col items-center justify-center'>
        <button
          onClick={() => navigate(-1)}
          aria-label='Go back'
          className='mb-6 inline-flex items-center justify-center w-11 h-11 rounded-full bg-dark-red text-[#f7eee1] hover:bg-dark-red/90 transition-colors shadow-md absolute top-3 left-3'
        >
          <ArrowLeft className='w-5 h-5' />
        </button>
        {isLoading ? (
          <div className='flex justify-center items-center h-64'>
            <div className='text-dark-red text-xl'>Loading...</div>
          </div>
        ) : !product ? (
          <div className='flex justify-center items-center h-64'>
            <div className='text-dark-red text-xl'>Product not found</div>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-10  items-center'>
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
              <h1 className='text-6xl md:text-5xl font-augent font-bold leading-tight mb-2'>
                {product.name}
              </h1>

              <p className='text-lg md:text-xl text-black! font-bona mb-5 leading-relaxed max-w-md'>
                {product.description ||
                  'A refined and pure honey selection, carefully crafted by nature to bring you energy, balance, and a quiet moment of indulgence.'}
              </p>

              <div className='flex items-center gap-10 mb-5 text-black!'>
                <span className='text-2xl text-black font-bold font-aboreto stroke-1'>
                  {product.price.toFixed(2)} DT
                </span>
                <span className='text-xl font-bold font-aboreto uppercase tracking-wider'>
                  350G JAR
                </span>
              </div>

              <div className='flex items-center gap-6 mb-5'>
                <div className='flex items-center border border-dark-red '>
                  <button
                    onClick={handleDecrement}
                    className='px-4 py-2 text-lg font-abee hover:bg-dark-red hover:text-cream transition-colors'
                  >
                    -
                  </button>
                  <div className='px-4 py-2 border-l border-r border-dark-red text-lg font-bold font-aboreto'>
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

              <button
                onClick={() => {
                  if (!product) return;
                  addToCart(
                    {
                      id: product.id,
                      name: product.name,
                      price: product.discountPrice || product.price,
                      image: product.images?.[0] || '',
                      slug: product.slug,
                    },
                    quantity,
                  );
                  toast.success(`${product.name} added to cart`);
                  setQuantity(1);
                  openCart();
                }}
                className='w-fit px-20 py-4 rounded-[41px] bg-honeyPattern bg-[#e6d7c2] font-abhaya text-2xl font-extrabold text-dark-red hover:opacity-90 transition-opacity shadow-md mb-5'
              >
                Add to cart
              </button>

              {/* Specs Footer */}
              <div className='grid grid-cols-3 gap-4 border-t border-[#000000]/25 text-[#000000]/68 pt-3 text-sm font-bona text-center'>
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

              {/* Share via QR */}
              <div className='mt-5 flex items-center gap-5 rounded-[24px] border border-dark-red/20 bg-white/50 p-5'>
                <ProductQRCode
                  slug={product.slug}
                  name={product.name}
                  price={product.price}
                  discountPrice={product.discountPrice}
                  size={96}
                  showUrl={false}
                  actions={['copy', 'download']}
                />
                <div>
                  <p className='font-bona font-bold text-black'>
                    Scan to share
                  </p>
                  <p className='text-sm font-bona text-[#000000]/68 max-w-xs'>
                    Scan this code with a phone camera to open {product.name}{' '}
                    instantly, or copy the link to share it.
                  </p>
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
