import crown from './../assets/crown.svg';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export function About() {
  const { t, i18n } = useTranslation();

  return (
    <section id='about' className='bg-cream px-6 '>
      <div className='mx-auto w-full '>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className='relative flex items-center justify-center'
        >
          <div className='absolute left-0 h-[2px] w-[45%] bg-dark-red'></div>
          <div className='absolute right-0 h-[2px] w-[45%] bg-dark-red'></div>
          <img src={crown} alt='crown' className='z-10 ' />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`text-center font-[var(--font-abril)] ${i18n.language === 'en' ? 'font-italic' : 'font-taviraj'} text-[36px] md:text-[55px] font-bold leading-[1] tracking-wide text-dark-red  uppercase`}
        >
          {t('about.title')}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className={`mx-auto max-w-[1100px] text-center ${i18n.language === 'en' ? 'font-[var(--font-abhaya)]' : 'font-taviraj'} text-xl md:text-3xl leading-[1.5] text-black mt-10 tracking-wide`}
        >
          {t('about.text')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className='mt-5 flex justify-center'
        >
          <button
            type='button'
            className={`px-13 tracking-wide py-4 cursor-pointer rounded-[41px] border border-[#e4d8c8] ${i18n.language === 'en' ? 'font-[var(--font-abhaya)]' : 'font-taviraj'} text-2xl leading-[1.02] font-extrabold text-dark-red shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]`}
            style={{
              backgroundImage: 'url(/honey_pattern.png)',
              backgroundSize: 'cover',
            }}
          >
            {t('about.button')}
          </button>
        </motion.div>
      </div>
    </section>
  );
}
