import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Seperator from './ui/Seperator';

export function About() {
  const { t, i18n } = useTranslation();

  return (
    <section id='about' className='bg-cream px-6 '>
      <div className='mx-auto w-full '>
        <Seperator />
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`text-center font-abhaya  text-[36px] md:text-[55px] font-bold  tracking-wide text-dark-red  uppercase`}
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
          className='mt-10 flex justify-center'
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
