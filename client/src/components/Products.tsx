import { useState, useEffect, useMemo } from 'react';
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getLandingProducts } from '../services/productService';
import type { ProductAnalyticsProduct } from '../types/product';
import Button from './ui/Button';

/** Products shown per page in the desktop grid. */
const DESKTOP_PAGE_SIZE = 3;

/** Products shown in the mobile carousel. */
const MOBILE_PRODUCT_COUNT = 3;

export function Products() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductAnalyticsProduct[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [page, setPage] = useState(0);

  useEffect(() => {
    async function loadProducts() {
      try {
        const fetchedProducts = await getLandingProducts();
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Failed to fetch products', error);
      }
    }

    loadProducts();
  }, []);

  const mobileProducts = useMemo(
    () => products.slice(0, MOBILE_PRODUCT_COUNT),
    [products],
  );

  const pageCount = Math.max(1, Math.ceil(products.length / DESKTOP_PAGE_SIZE));
  const hasPagination = products.length > DESKTOP_PAGE_SIZE;

  // Clamp during render so a shrinking product list cannot strand the page
  // index past the end.
  const safePage = page < pageCount ? page : 0;

  const pagedProducts = useMemo(
    () =>
      products.slice(
        safePage * DESKTOP_PAGE_SIZE,
        safePage * DESKTOP_PAGE_SIZE + DESKTOP_PAGE_SIZE,
      ),
    [products, safePage],
  );

  const goToPreviousPage = () =>
    setPage((current) => (current - 1 + pageCount) % pageCount);

  const goToNextPage = () => setPage((current) => (current + 1) % pageCount);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' as const },
    },
  };

  useEffect(() => {
    if (activeIndex > mobileProducts.length - 1) {
      setActiveIndex(0);
    }
  }, [activeIndex, mobileProducts.length]);

  return (
    <section id='products' className='bg-cream px-0 py-8 md:p-5'>
      <div className='mx-auto flex w-full flex-col items-center justify-center space-y-8 md:space-y-15'>
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className={`text-center font-[var(--font-abril)] text-[34px] md:text-[50px] ${i18n.language !== 'ar' ? 'font-augent' : 'font-amiri'} font-extrabold leading-[1.1] text-dark-red`}
        >
          {t('products.title')}
        </motion.h2>

        <div className='w-full md:hidden flex flex-col items-center overflow-hidden pb-4'>
          <div className='relative grid w-full place-items-center py-4'>
            {mobileProducts.map((product, index) => {
              const offset = index - activeIndex;
              const isActive = offset === 0;

              // Calculate Framer Motion animation states
              let x = '0%';
              let scale = 1;
              let opacity = 1;
              let zIndex = 10;

              if (offset === 0) {
                x = '0%';
                scale = 1;
                opacity = 1;
                zIndex = 10;
              } else if (offset === -1) {
                x = '-80%';
                scale = 0.85;
                opacity = 0.6;
                zIndex = 5;
              } else if (offset === 1) {
                x = '80%';
                scale = 0.85;
                opacity = 0.6;
                zIndex = 5;
              } else {
                x = offset < 0 ? '-180%' : '180%';
                scale = 0.7;
                opacity = 0;
                zIndex = 0;
              }

              return (
                <motion.button
                  key={product.id}
                  type='button'
                  initial={false}
                  animate={{ x, scale, opacity, zIndex }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  onClick={() => setActiveIndex(index)}
                  className={`col-start-1 row-start-1 flex w-[55vw] shrink-0 flex-col items-center ${
                    Math.abs(offset) > 1 ? 'pointer-events-none' : ''
                  }`}
                >
                  <div
                    className={`w-full aspect-[0.95] overflow-hidden rounded-[16px] bg-[#d9d2ca] transition-shadow duration-400 ${
                      isActive ? 'shadow-[0_8px_16px_rgba(92,71,52,0.28)]' : ''
                    }`}
                  >
                    {product.images?.[0] && (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className='h-full w-full object-cover'
                      />
                    )}
                  </div>

                  <h3
                    className={`mt-4 font-bona text-center leading-[1.15] text-[#251a14] transition-all duration-400 ${
                      isActive ? 'text-[18px]' : 'text-[15px]'
                    }`}
                  >
                    {product.name || t('products.name')}
                  </h3>

                  <Button
                    backgroundVariant='honeyPattern'
                    classNames={`mt-3 flex justify-center !rounded-[30px] transition-all duration-400 ${
                      isActive
                        ? 'min-w-[156px] px-7 py-[7px]'
                        : 'min-w-[120px] px-5 py-[5px]'
                    }`}
                    onClick={(e: React.MouseEvent) => {
                      if (isActive) {
                        e.stopPropagation();
                        navigate(`/products/${product.slug}`);
                      }
                    }}
                  >
                    <span
                      className={`font-abhaya font-bold text-dark-red transition-all duration-400 ${
                        isActive ? 'text-[16px]' : 'text-[14px]'
                      }`}
                    >
                      {t('products.button')}
                    </span>
                  </Button>
                </motion.button>
              );
            })}
          </div>

          {mobileProducts.length > 1 && (
            <div className='mt-8 flex items-center justify-center gap-2'>
              {mobileProducts.map((product, index) => (
                <button
                  key={product.id}
                  type='button'
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show product ${index + 1}`}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === activeIndex ? 'bg-[#6a1821]' : 'bg-[#d6c6be]'
                  }`}
                />
              ))}
              {mobileProducts.map((product, index) => (
                <button
                  key={product.id}
                  type='button'
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show product ${index + 1}`}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === activeIndex ? 'bg-[#6a1821]' : 'bg-[#d6c6be]'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className='relative hidden w-[85%] md:block'>
          {hasPagination && (
            <button
              type='button'
              onClick={goToPreviousPage}
              aria-label={t('products.previous', 'Previous products')}
              className='absolute top-1/2 -left-14 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-dark-red/30 bg-cream/80 text-dark-red transition-colors hover:border-gold hover:text-gold'
            >
              <ChevronLeft className='h-6 w-6' />
            </button>
          )}

          <motion.div
            variants={containerVariants}
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, margin: '-50px' }}
            className='grid w-full grid-cols-3 items-center justify-center justify-items-center gap-10'
          >
            {pagedProducts.map((product) => (
              <motion.article
                variants={itemVariants}
                key={product.id}
                className='w-full'
              >
                <div className='w-full aspect-square w-full bg-[#d9d9d9] flex items-center justify-center overflow-hidden'>
                  {product.images?.[0] && (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className='w-full h-full object-cover'
                    />
                  )}
                </div>
                <h3 className='mt-[20px] text-center qq text-4xl md:text-2xl font-italic leading-[1.05] text-black '>
                  {product.name}
                </h3>
                <Button
                  backgroundVariant='honeyPattern'
                  classNames='mx-auto flex mt-5 px-12 !rounded-[30px]'
                  onClick={() => navigate(`/products/${product.slug}`)}
                >
                  <span className='text-dark-red font-abhaya  !font-extrabold text-[20px]'>
                    {t('products.button')}
                  </span>
                </Button>
              </motion.article>
            ))}
          </motion.div>

          {hasPagination && (
            <button
              type='button'
              onClick={goToNextPage}
              aria-label={t('products.next', 'Next products')}
              className='absolute top-1/2 -right-14 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-dark-red/30 bg-cream/80 text-dark-red transition-colors hover:border-gold hover:text-gold'
            >
              <ChevronRight className='h-6 w-6' />
            </button>
          )}
        </div>

        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className='mt-10 hidden w-full justify-center md:flex'
        >
          <a
            href='/products'
            className='px-10 py-3 rounded-[41px] border border-dark-red font-[var(--font-abhaya)] text-xl cursor-pointer font-extrabold text-[#370d0f] hover:bg-[#370d0f] hover:text-[#fdf8f0] transition duration-300'
          >
            {t('products.seeMore', 'See more')}
          </a>
        </motion.div> */}
      </div>
    </section>
  );
}
