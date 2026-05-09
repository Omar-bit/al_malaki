import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';
import authModel from '../assets/auth-model.jpg';
import { X } from 'lucide-react';
import logo from '../assets/logo.svg';
import Button from './ui/Button';

export function GuestModal() {
  const { t } = useTranslation();
  const { isLoading, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Show modal if the user is not authenticated and hasn't seen it recently
    if (!isLoading && !user) {
      const hasSeenModal = sessionStorage.getItem('hasSeenGuestModal');
      if (!hasSeenModal) {
        // slight delay for better UX
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, user]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('hasSeenGuestModal', 'true');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md'>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className='bg-dark-red! relative w-full max-w-4xl p-4  rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row font-["Abhaya_Libre"]'
          >
            <button
              onClick={handleClose}
              className='absolute top-4 right-4 z-10 p-2 bg-white/50 backdrop-blur-sm rounded-full text-black hover:bg-white transition-colors'
            >
              <X className='w-5 h-5' />
            </button>
            <div className='w-full flex flex-col items-center gap-1 '>
              <img src={logo} alt='AL MALAKI' className='size-46 -mt-7' />

              <p className='-mt-5 text-white text-center px-10 text-2xl text-[#211E1E] leading-normal tracking-normal'>Sign in to receive your personal matricule, <br /> use it to answer our weekly questions and <br /> win exclusive promotions!</p>

              <div className='w-[35%] flex flex-col gap-3 items-center mt-5'>
                <Button backgroundVariant='honeyPattern' classNames='w-full text-black! py-4 rounded-xl tracking-wider text-xl font-semibold' onClick={() => navigate('/register')}>Join Us</Button>
                <Button backgroundVariant='honeyPattern' classNames='w-full text-black! py-4 rounded-xl tracking-wider text-xl font-semibold' onClick={() => navigate('/login')}>I already have an account</Button>
                <span className='text-[#8F8B8B] text-center text-lg font-medium' onClick={() => setIsOpen(false)}>Access to the site →</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
