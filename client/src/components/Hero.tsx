import { motion } from 'framer-motion';
import useWindowWidth from '../hooks/useWindowWidth';
import { useTranslation } from 'react-i18next';

export function Hero() {
  const width = useWindowWidth();
  const { t, i18n } = useTranslation();

  return (
    <section
      id='home'
      className='relative min-h-screen w-full overflow-hidden bg-cover bg-no-repeat'
      style={{
        backgroundImage:
          width < 768 ? 'url(/hero-bg-mobile.jpg)' : 'url(/hero-bg.jpg)',
        backgroundSize: width < 768 ? '200% 100%' : '100% auto',
        backgroundPosition: width < 768 ? '100% 50%' : 'center center',
      }}
    >
      <div className='relative mx-auto flex min-h-screen w-full items-start px-5 pb-12 pt-[162px] sm:px-8 sm:pt-[190px] md:px-10 md:pt-[280px] lg:mx-auto lg:pt-[250px]'>
        <div className='max-w-[240px] sm:max-w-[320px] md:max-w-none mx-auto -translate-x-[45%]'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className='pl-10'
          >
            <p
              className={`text-[#efe0c9] font-normal font-italic text-[31px] leading-[1.08] sm:text-[46px] md:text-[62px] lg:text-[80px] ${i18n.language === 'ar' ? 'font-amiri!' : 'font-italic'}`}
            >
              {t('hero.welcome')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
            className='mt-5 sm:mt-6'
          >
            <h1
              className={`text-[#efe0c9] ${i18n.language === 'en' ? 'font-italic' : 'font-bold'} text-[48px] leading-[0.98] tracking-[0.055em] sm:text-[68px] md:text-[76px] md:leading-[1.05] lg:text-[120px] font-thin`}
              style={{ WebkitTextStroke: '0.3px #f8e5c6' }}
            >
              {t('hero.al_malaki')}
            </h1>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
