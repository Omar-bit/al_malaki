import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import OtpInput from 'react-otp-input';
import toast from 'react-hot-toast';
import { authService } from '../services';
import { validateEmailValue, validateOtpValue } from '../utils/formValidation';

type VerifyEmailLocationState = {
  otpExpiresInSeconds?: number;
};

export function VerifyEmailPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const locationState = location.state as VerifyEmailLocationState | null;

  const initialEmail = useMemo(() => {
    const fromQuery = searchParams.get('email')?.trim() ?? '';
    return fromQuery;
  }, [searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const otpExpiresInSeconds =
    typeof locationState?.otpExpiresInSeconds === 'number'
      ? locationState.otpExpiresInSeconds
      : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const emailValidation = validateEmailValue(email, {
      required: t('verify_email.email_required', {
        defaultValue: 'Please enter your email first',
      }),
      invalid: t('verify_email.email_invalid', {
        defaultValue: 'Please enter a valid email address',
      }),
    });

    if (!emailValidation.isValid) {
      toast.error(emailValidation.error);
      return;
    }

    const otpValidation = validateOtpValue(otpCode, {
      required: t('verify_email.otp_required'),
      invalid: t('verify_email.otp_invalid', {
        defaultValue: 'OTP must be a 6-digit code',
      }),
    });

    if (!otpValidation.isValid) {
      toast.error(otpValidation.error);
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.verifyRegisterOtp({
        email: emailValidation.value,
        otpCode: otpValidation.value,
      });

      toast.success(t('verify_email.success'));
      navigate('/dashboard', { replace: true });
    } catch (error) {
      if (error instanceof Error && error.message) {
        toast.error(error.message);
      } else {
        toast.error(t('verify_email.generic_error'));
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
              onClick={() => navigate('/register')}
              aria-label={t('verify_email.close', { defaultValue: 'Close' })}
              className='leading-none text-[38px] text-dark-red transition-opacity hover:opacity-75'
            >
              ×
            </button>
          </div>

          <h1 className='-mt-2 text-center text-3xl font-extrabold text-dark-red md:text-[38px]'>
            {t('verify_email.title')}
          </h1>

          <p className='mx-auto mt-2 max-w-116 text-center text-xl leading-[1.2] text-dark-red/95 md:text-[28px]'>
            {t('verify_email.subtitle', {
              defaultValue: 'Enter the 6-digit code sent to your email',
            })}
          </p>

          <motion.form
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className='mx-auto mt-6 max-w-108'
            onSubmit={handleSubmit}
          >
            {email ? (
              <input
                type='email'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete='email'
                maxLength={254}
                className='sr-only'
                aria-hidden='true'
                tabIndex={-1}
              />
            ) : (
              <div className='mb-4'>
                <label className='mb-2 block text-center text-base font-semibold text-dark-red md:text-lg'>
                  {t('verify_email.email')}
                </label>
                <input
                  type='email'
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete='email'
                  maxLength={254}
                  placeholder={t('verify_email.email_placeholder')}
                  className='h-11 w-full rounded-xl border border-[#6d232f]/35 bg-transparent px-4 text-sm text-dark-red outline-none placeholder:text-dark-red/45 transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/20 md:h-12 md:text-base'
                />
              </div>
            )}

            <OtpInput
              value={otpCode}
              onChange={(value) =>
                setOtpCode(value.replace(/\D/g, '').slice(0, 6))
              }
              numInputs={6}
              shouldAutoFocus
              inputType='tel'
              containerStyle='flex items-center justify-center gap-2 md:gap-2.5'
              renderInput={(props) => (
                <input
                  {...props}
                  dir='ltr'
                  className='h-12 w-10 rounded-xl border border-[#6d232f]/30 bg-transparent text-center text-xl font-bold text-dark-red outline-none transition focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/20 md:h-13 md:w-11 md:text-2xl'
                />
              )}
            />

            <div className='mt-3 text-center text-sm text-dark-red/85 md:text-xl'>
              {otpExpiresInSeconds
                ? t('verify_email.otp_expiry_notice', {
                    minutes: Math.ceil(otpExpiresInSeconds / 60),
                  })
                : t('verify_email.otp_expiry_notice', {
                    minutes: 5,
                    defaultValue: 'Code expires in about 5 minutes',
                  })}
            </div>

            <div className='mt-6 flex justify-center'>
              <button
                type='submit'
                disabled={isSubmitting}
                className='min-h-12 min-w-60 rounded-full bg-[#4f0010] px-6 text-base font-semibold text-[#f7e8cc] shadow-[0_10px_24px_rgba(45,4,12,0.28)] transition hover:-translate-y-px hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-65 md:min-w-76 md:text-2xl'
              >
                {isSubmitting
                  ? t('verify_email.loading')
                  : t('verify_email.submit')}
              </button>
            </div>
          </motion.form>
        </motion.section>
      </main>
    </div>
  );
}
