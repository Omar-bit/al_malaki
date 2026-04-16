import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export function Follow() {
  const { t, i18n } = useTranslation();

  return (
    <section className='bg-cream px-6 mt-5'>
      <div className='mx-auto flex w-full  justify-center'>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className='h-auto py-10 md:py-0 md:h-[450px] w-full md:w-[70%] lg:w-[35%] rounded-[66px] bg-[#efe0c9] px-6 text-center shadow-[0_14px_10.8px_rgba(0,0,0,0.25)] flex flex-col justify-center'
        >
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`text-dark-red ${i18n.language === 'en' ? 'font-italic font-extralight ' : 'font-taviraj font-bold'} tracking-wide text-[40px] md:text-[55px] leading-[1.07]`}
          >
            {t('follow.title')}
          </motion.p>
          <motion.a
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            href='https://instagram.com/almalaki'
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center justify-center gap-2 font-[var(--font-abhaya)] text-[32px] md:text-[50px] leading-[1.05] text-dark-red transition-colors hover:text-[#7d2b35] lg:text-[30px]'
          >
            @almalaki
            <span aria-hidden='true'>→</span>
          </motion.a>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className='mx-auto mt-[36px] h-[200px] md:h-[250px] w-full max-w-[350px] bg-[#d9d9d9]'
          ></motion.div>
        </motion.div>
      </div>
    </section>
  );
}
