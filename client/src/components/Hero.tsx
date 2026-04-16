import { motion } from 'framer-motion';
import useWindowWidth from '../hooks/useWindowWidth';
import { useTranslation } from 'react-i18next';

export function Hero() {
  const width = useWindowWidth();
  const { t, i18n } = useTranslation();
  return (
    <section
      id='home'
      className='relative h-screen w-full overflow-hidden bg-cover bg-center bg-no-repeat'
      style={{
        backgroundImage: 'url(/hero-bg.png)',
        backgroundPosition: width < 768 ? '90% 100%' : '',
      }}
    >
      <div className='relative mx-auto h-full w-full '>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className={`absolute ${i18n.language === 'en' ? 'left-4 md:left-10 sm:left-[80px] lg:left-[150px]' : 'right-4 md:right-10 sm:right-[80px] lg:right-[150px]'} top-[150px] md:top-[280px] lg:top-[250px]`}
        >
          <p
            className={`text-[#efe0c9] ${i18n.language === 'en' ? 'font-italic' : 'font-bold'} text-[40px] md:text-[62px] leading-[1.178] sm:text-[78px] lg:text-[72px]`}
          >
            {t('hero.welcome')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
          className={`absolute ${i18n.language === 'en' ? 'left-4 md:left-6 sm:left-[80px] lg:left-[114px]' : 'right-4 md:right-6 sm:right-[80px] lg:right-[114px]'} top-[220px] md:top-[392px] lg:top-[375px]`}
        >
          <h1
            className={`text-[#efe0c9] ${i18n.language === 'en' ? 'font-italic' : 'font-bold'} text-[48px] md:text-[76px] leading-[1.178] tracking-[0.03em] sm:text-[100px] lg:text-[105px]`}
            style={{ WebkitTextStroke: '0.7px #f8e5c6' }}
          >
            {t('hero.al_malaki')}
          </h1>
        </motion.div>
      </div>
    </section>
  );
}
