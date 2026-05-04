import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services';
import { validateEmailValue } from '../utils/formValidation';

export function ForgotPasswordPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';
  const [searchParams] = useSearchParams();

  const initialEmail = useMemo(() => {
    const fromQuery = searchParams.get('email')?.trim() ?? '';
    return fromQuery;
  }, [searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const emailValidation = validateEmailValue(email, {
      required: t('forgot_password.email_required'),
      invalid: t('forgot_password.email_invalid', {
        defaultValue: 'Please enter a valid email address',
      }),
    });

    if (!emailValidation.isValid) {
      toast.error(emailValidation.error);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.requestPasswordResetLink({
        email: emailValidation.value,
      });

      toast.success(response.message || t('forgot_password.success'));
      navigate('/login', { replace: true });
    } catch (error) {
      if (error instanceof Error && error.message) {
        toast.error(error.message);
      } else {
        toast.error(t('forgot_password.generic_error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='relative min-h-screen overflow-hidden font-["Abhaya_Libre"]'>
      <div className='absolute inset-0 auth-page' />
      <div className='absolute -bottom-20 left-[2%] h-[36vh] w-[68%] rounded-[26px] bg-[#5f0a13]/78 blur-sm' />
      <div className='absolute bottom-0 right-0 h-[44vh] w-[34%] rounded-tl-[40px] bg-[#f2ebe2]/82 blur-[2px]' />
      <div className='absolute inset-0 bg-[#f7edde]/36 backdrop-blur-[10px]' />

      <main className='relative z-10 flex min-h-screen items-center justify-center p-4 md:p-8'>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className='w-full max-w-150 rounded-[36px] bg-[#efe0c4] px-5 py-6 shadow-[0_20px_46px_rgba(28,6,10,0.22)] md:px-10 md:py-8'
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <div className='flex items-start justify-between gap-4'>
            <div className='w-full' />
            <button
              type='button'
              onClick={() => navigate('/login')}
              aria-label={t('forgot_password.close', { defaultValue: 'Close' })}
              className='leading-none text-[38px] text-dark-red transition-opacity hover:opacity-75'
            >
              ×
            </button>
          </div>

          <h1 className='-mt-2 text-center text-3xl font-extrabold text-dark-red md:text-[38px]'>
            {t('forgot_password.title')}
          </h1>

          <p className='mx-auto mt-2 max-w-116 text-center text-xl leading-[1.2] text-dark-red/95 md:text-[26px]'>
            {t('forgot_password.subtitle')}
          </p>

          <motion.form
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className='mx-auto mt-6 max-w-108 space-y-4'
            onSubmit={handleSubmit}
          >
            <div>
              <label className='mb-2 block text-center text-base font-semibold text-dark-red md:text-lg'>
                {t('forgot_password.email')}
              </label>
              <input
                type='email'
                placeholder={t('forgot_password.email_placeholder')}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete='email'
                maxLength={254}
                required
                className='h-11 w-full rounded-xl border border-[#6d232f]/35 bg-transparent px-4 text-sm text-dark-red outline-none placeholder:text-dark-red/45 transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/20 md:h-12 md:text-base'
              />
            </div>

            <div className='pt-1 text-center text-sm text-dark-red/80 md:text-base'>
              {t('forgot_password.remember_password')}{' '}
              <button
                type='button'
                onClick={() => navigate('/login')}
                className='font-bold underline underline-offset-4 transition hover:opacity-80'
              >
                {t('forgot_password.login_link')}
              </button>
            </div>

            <div className='mt-2 flex justify-center'>
              <button
                type='submit'
                disabled={isSubmitting}
                className='min-h-12 min-w-60 rounded-full bg-[#4f0010] px-6 text-base font-semibold text-[#f7e8cc] shadow-[0_10px_24px_rgba(45,4,12,0.28)] transition hover:-translate-y-px hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-65 md:min-w-76 md:text-2xl'
              >
                {isSubmitting
                  ? t('forgot_password.sending')
                  : t('forgot_password.submit')}
              </button>
            </div>
          </motion.form>
        </motion.section>
      </main>
    </div>
  );
}
