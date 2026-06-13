import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getPublicProducts } from '../services/productService';
import type { ProductAnalyticsProduct } from '../types/product';
import Button from './ui/Button';

export function Products() {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<ProductAnalyticsProduct[]>([]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const fetchedProducts = await getPublicProducts();
        // Display up to 3 active products
        setProducts(
          fetchedProducts.filter((p) => p.status === 'active').slice(0, 3),
        );
      } catch (error) {
        console.error('Failed to fetch products', error);
      }
    }

    loadProducts();
  }, []);

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

  return (
    <section id='products' className='bg-cream p-5'>
      <div className='mx-auto w-full  space-y-15 flex items-center justify-center flex-col'>
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className={`text-center font-[var(--font-abril)] text-[40px] md:text-[50px] ${i18n.language === 'en' ? 'font-italic' : 'font-taviraj'} font-extrabold  leading-[1.1] text-dark-red`}
        >
          {t('products.title')}
        </motion.h2>

        <motion.div
          variants={containerVariants}
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true, margin: '-50px' }}
          className=' w-[85%] items-center justify-center  grid grid-cols-1 justify-items-center gap-10 md:grid-cols-3 '
        >
          {products.map((product) => (
            <motion.article
              variants={itemVariants}
              key={product.id}
              className='w-full  '
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
                classNames='mx-auto flex mt-5 px-16 !rounded-[30px]'
              >
                <span className='text-dark-red font-abhaya  font-bold text-[18px]'>
                  Show Details
                </span>
              </Button>
            </motion.article>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className='mt-10 flex justify-center w-full'
        >
          <a
            href='/products'
            className='px-10 py-3 rounded-[41px] border border-dark-red font-[var(--font-abhaya)] text-xl cursor-pointer font-extrabold text-[#370d0f] hover:bg-[#370d0f] hover:text-[#fdf8f0] transition duration-300'
          >
            {t('products.seeMore', 'See more')}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
