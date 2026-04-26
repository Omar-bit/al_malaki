import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export function Products() {
  const { t, i18n } = useTranslation();

  const products = [{ id: '1' }, { id: '2' }, { id: '3' }];

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
              <div className='w-full aspect-square  w-full  bg-[#d9d9d9] '></div>
              <h3 className='mt-[20px] text-center font-[var(--font-abhaya)] text-3xl md:text-2xl !font-semibold font-italic leading-[1.05] text-black'>
                {t('products.name')}
              </h3>
              <div className='mt-[15px] flex justify-center'>
                <button
                  type='button'
                  className='px-5 py-3 rounded-[41px]  bg-[#e6d7c2] font-[var(--font-abhaya)] text-lg cursor-pointer leading-[1.05] font-extrabold text-[#370d0f] hover:bg-[#e6d7c2]/90 transition duration-300'
                >
                  {t('products.button')}
                </button>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
