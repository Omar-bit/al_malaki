import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';

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
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6'
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className='w-full max-w-3xl rounded-4xl border border-[#A68F74]/40 bg-[#f9f3ed] p-6 shadow-[0_20px_60px_rgba(24,9,9,0.18)]'
            onClick={(event) => event.stopPropagation()}
          >
            <div className='flex items-center justify-between gap-4 border-b border-[#d5bd9d] pb-4 mb-5'>
              <h2 className='text-2xl font-bold text-black'>{title}</h2>
              <button
                type='button'
                className='text-[#6D5A46] hover:text-dark-red transition'
                onClick={onClose}
              >
                Close
              </button>
            </div>

            <div className='space-y-5 max-h-[70vh] overflow-y-auto'>
              {children}
            </div>

            {footer ? <div className='mt-6'>{footer}</div> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
