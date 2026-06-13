import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';
import { useTranslation } from 'react-i18next';
import crownPng from '../assets/crown.png';

interface GuestModalProps {
  forceOpen?: boolean;
  blocking?: boolean;
}

export function GuestModal({
  forceOpen = false,
  blocking = false,
}: GuestModalProps) {
  const { isLoading, user } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const isRTL = i18n.language === 'ar';
  const langLabel = t('guest_modal.lang_label');

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    if (!isLoading && user) {
      setIsOpen(false);
      return;
    }

    if (!isLoading && !user) {
      const hasSeenModal = sessionStorage.getItem('hasSeenGuestModal');
      if (!hasSeenModal) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [forceOpen, isLoading, user]);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const handleClose = () => {
    if (blocking) return;
    setIsOpen(false);
    sessionStorage.setItem('hasSeenGuestModal', 'true');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'>
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            // dir={isRTL ? 'rtl' : 'ltr'}
            className='relative w-full max-w-[60%] rounded-3xl overflow-hidden shadow-2xl'
            style={{ backgroundColor: '#3F060F' }}
          >
            {/* Lang label — top left (or top right in RTL) */}
            <span
              className={`absolute top-4  left-5 text-[#EFE0C9] text-lg font-abee select-none cursor-pointer`}
              onClick={() => {
                const newLang = isRTL ? 'en' : 'ar';
                i18n.changeLanguage(newLang);
              }}
            >
              {langLabel}
            </span>

            {/* Close button — top right (or top left in RTL) */}
            {!blocking && (
              <button
                onClick={handleClose}
                className={`absolute top-4 right-5 text-[#EFE0C9] hover:text-white transition-colors text-2xl font-light leading-none`}
                aria-label='Close'
              >
                ✕
              </button>
            )}

            {/* Content */}
            <div className='flex flex-col items-center px-12 pt-8 pb-7 gap-5'>
              {/* Crown icon */}
              <img
                src={crownPng}
                alt='AL MALAKI crown'
                className='size-25 object-contain'
              />

              {/* Brand name */}
              <h2 className='font-italic text-gold text-3xl tracking-widest -mt-8'>
                AL MALAKI
              </h2>

              {/* Body text */}
              <pre
                className={`text-white/90 text-center text-3xl leading-relaxed px-2 my-2 ${isRTL ? 'text-right' : 'text-center'}`}
                style={{ fontFamily: 'Abhaya Libre, serif' }}
              >
                {t('guest_modal.body')}
              </pre>

              {/* Buttons */}
              <div className='w-full flex flex-col gap-3 mt-1 items-center'>
                {/* Join us */}
                <button
                  onClick={() => navigate('/register')}
                  className='w-[30%] py-3 rounded-xl text-sm font-semibold text-stone-800 bg-honeyPattern hover:opacity-90 transition-opacity tracking-wide'
                >
                  {t('guest_modal.join')}
                </button>

                {/* Already have an account */}
                <button
                  onClick={() => navigate('/login')}
                  className='w-[30%] py-3 rounded-xl text-sm font-semibold text-stone-800 bg-honeyPattern hover:opacity-90 transition-opacity tracking-wide'
                >
                  {t('guest_modal.already_account')}
                </button>
              </div>

              {/* Discover link */}
              {!blocking && (
                <button
                  onClick={handleClose}
                  className='text-[#ADAAA4] text-xs font-abee hover:text-white/80 transition-colors tracking-wide mt-1'
                >
                  {isRTL
                    ? `← ${t('guest_modal.discover')}`
                    : `${t('guest_modal.discover')} →`}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
