import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import OtpInput from 'react-otp-input';
import toast from 'react-hot-toast';
import { Header } from '../components/Header';
import { authService } from '../services';
import authModel from '../assets/auth-model.jpg';

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
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [otpExpiresInSeconds, setOtpExpiresInSeconds] = useState<number | null>(
    typeof locationState?.otpExpiresInSeconds === 'number'
      ? locationState.otpExpiresInSeconds
      : null,
  );

  const handleResendOtp = async () => {
    if (!email.trim()) {
      toast.error(t('register.email_required'));
      return;
    }

    setIsRequestingOtp(true);

    try {
      const response = await authService.requestRegisterOtp({
        email: email.trim(),
      });

      setOtpExpiresInSeconds(response.expiresInSeconds);
      toast.success(t('verify_email.otp_sent'));
    } catch (error) {
      if (error instanceof Error && error.message) {
        toast.error(error.message);
      } else {
        toast.error(t('verify_email.generic_error'));
      }
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error(t('register.email_required'));
      return;
    }

    if (!otpCode.trim()) {
      toast.error(t('verify_email.otp_required'));
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.verifyRegisterOtp({
        email: email.trim(),
        otpCode: otpCode.trim(),
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
    <div className='min-h-screen flex flex-col font-["Abhaya_Libre"] auth-page'>
      <div className='bg-transparent'>
        <Header withBackground={false} />
      </div>

      <main className='flex-1 flex items-center justify-center p-4 md:p-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className='bg-white rounded-[32px] shadow-2xl flex flex-col md:flex-row w-full max-w-[95%] sm:max-w-[70%] md:max-w-[55%] overflow-hidden'
        >
          <div className='w-full md:w-[45%] relative bg-gradient-to-b from-[#FCECD8] to-[#986E58] flex flex-col items-center justify-start p-8 min-h-[350px] md:min-h-[unset]'>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className='absolute top-5 left-0 w-full text-center z-10'
            >
              <h2 className='text-3xl text-dark-red font-abhaya mb-1'>
                {t('hero.welcome')}
              </h2>
              <h1 className='text-5xl text-dark-red font-abhaya font-bold uppercase tracking-wider'>
                {t('hero.al_malaki')}
              </h1>
            </motion.div>

            <div className='flex-1 w-full flex items-end justify-center absolute inset-0 z-0'>
              <motion.img
                initial={{ opacity: 0, filter: 'blur(5px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ delay: 0.4, duration: 0.8 }}
                src={authModel}
                alt='Al Malaki'
                className='object-cover w-full rounded-[32px] md:rounded-none h-full relative inset-0 top-0'
                style={{
                  objectPosition: 'center top',
                }}
              />
            </div>
          </div>

          <div className='w-full md:w-[55%] flex flex-col justify-center bg-white relative p-3'>
            <motion.h2
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className='text-3xl md:text-4xl text-dark-red font-abhaya font-extrabold text-center mb-2 md:mb-4'
            >
              {t('verify_email.title')}
            </motion.h2>

            <p className='text-dark-red/80 text-center text-lg mb-4'>
              {t('verify_email.subtitle')}
            </p>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className='text-center mb-6 md:mb-8 flex flex-wrap justify-center items-center gap-1 md:gap-2 text-sm md:text-md'
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              <span className='text-dark-red text-xl text-center'>
                {t('register.has_account')}
              </span>
              <Link
                to='/login'
                className='font-bold text-lg md:text-2xl text-dark-red font-abhaya underline decoration-dark-er underline-offset-5 tracking-wide'
              >
                {t('register.login_link')}
              </Link>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className='max-w-md mx-auto w-full space-y-5 max-h-[55vh] overflow-y-auto'
              dir={isRtl ? 'rtl' : 'ltr'}
              onSubmit={handleSubmit}
            >
              <div>
                <label className='block text-xl font-bold text-dark-red font-abhaya mb-2'>
                  {t('verify_email.email')}
                </label>
                <input
                  type='email'
                  placeholder={t('verify_email.email_placeholder')}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete='email'
                  required
                  className='w-full px-6 py-3 font-abhaya rounded-full border border-dark-red bg-transparent text-dark-red placeholder:text-dark-red/50 focus:outline-none focus:ring-2 focus:ring-dark-red transition-all'
                />
              </div>

              <div>
                <label className='block text-xl font-bold text-dark-red font-abhaya mb-2'>
                  {t('verify_email.otp')}
                </label>
                <OtpInput
                  value={otpCode}
                  onChange={(value) =>
                    setOtpCode(value.replace(/\D/g, '').slice(0, 6))
                  }
                  numInputs={6}
                  shouldAutoFocus
                  inputType='tel'
                  containerStyle='flex items-center gap-2'
                  renderInput={(props) => (
                    <input
                      {...props}
                      dir='ltr'
                      className='size-20 flex-1 rounded-xl border border-dark-red bg-transparent text-center text-dark-red text-lg font-bold focus:outline-none focus:ring-2 focus:ring-dark-red transition-all'
                    />
                  )}
                />

                {otpExpiresInSeconds ? (
                  <p className='mt-2 text-sm text-dark-red/70'>
                    {t('verify_email.otp_expiry_notice', {
                      minutes: Math.ceil(otpExpiresInSeconds / 60),
                    })}
                  </p>
                ) : null}
              </div>

              <button
                type='button'
                onClick={handleResendOtp}
                disabled={isRequestingOtp}
                className='w-full px-4 py-2 rounded-full font-abhaya font-bold text-dark-red bg-[#EEDCC1] bg-gradient-to-r from-[#e3caa2] to-[#eedcc1] hover:scale-105 transition-transform shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap'
              >
                {isRequestingOtp
                  ? t('verify_email.requesting_otp')
                  : t('verify_email.resend_otp')}
              </button>

              <div className='pt-2 flex justify-center'>
                <button
                  type='submit'
                  disabled={isSubmitting || isRequestingOtp}
                  className='px-12 py-3 rounded-full font-serif font-bold text-dark-red bg-[#EEDCC1] bg-gradient-to-r from-[#e3caa2] to-[#eedcc1] hover:scale-105 transition-transform shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100'
                  style={{
                    backgroundImage: 'url(/honey_pattern.png)',
                    backgroundSize: 'cover',
                  }}
                >
                  {isSubmitting
                    ? t('verify_email.loading')
                    : t('verify_email.submit')}
                </button>
              </div>
            </motion.form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
