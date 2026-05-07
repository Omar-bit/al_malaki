import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm'
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className='flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-[32px] border border-[#d5bd9d]/50 bg-[#f7efe6] shadow-[0_20px_60px_rgba(24,9,9,0.18)]'
            onClick={(event) => event.stopPropagation()}
          >
            <div className='flex items-center justify-between border-b border-[#d5bd9d]/50 bg-white/50 px-6 py-5 backdrop-blur-md md:px-8'>
              <h2 className='text-2xl font-bold text-black'>{title}</h2>
              <button
                type='button'
                className='rounded-full bg-[#f4e0d4]/50 p-2 text-[#6d5a46] transition-colors hover:bg-dark-red hover:text-white'
                onClick={onClose}
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            <div className='overflow-y-auto px-6 py-6 md:px-8 custom-scrollbar'>
              {children}
            </div>

            {footer ? (
              <div className='border-t border-[#d5bd9d]/50 bg-white/50 px-6 py-5 backdrop-blur-md md:px-8'>
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
