import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Header } from '../components/Header';
import { authService } from '../services';
import { useAuth } from '../contexts';
import {
  validateEmailValue,
  validatePasswordValue,
} from '../utils/formValidation';
import authModel from '../assets/auth-model.jpg';

export function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setUser } = useAuth();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const emailValidation = validateEmailValue(email, {
      required: t('login.email_required', {
        defaultValue: 'Please enter your email first',
      }),
      invalid: t('login.email_invalid', {
        defaultValue: 'Please enter a valid email address',
      }),
    });

    if (!emailValidation.isValid) {
      toast.error(emailValidation.error);
      return;
    }

    const passwordValidation = validatePasswordValue(password, {
      required: t('login.password_required', {
        defaultValue: 'Please enter your password',
      }),
      tooShort: t('login.password_too_short', {
        defaultValue: 'Password must be at least 8 characters',
      }),
      tooLong: t('login.password_too_long', {
        defaultValue: 'Password must be at most 64 characters',
      }),
    });

    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.error);
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await authService.login({
        email: emailValidation.value,
        password: passwordValidation.value,
      });
      setUser(user);
      toast.success(t('login.success'));
      console.log('USER :', user);
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      if (
        error instanceof authService.ApiError &&
        error.code === 'EMAIL_NOT_VERIFIED'
      ) {
        toast.error(error.message);
        navigate(
          `/verify-email?email=${encodeURIComponent(emailValidation.value)}`,
          {
            replace: true,
          },
        );
        return;
      }

      if (error instanceof Error && error.message) {
        toast.error(error.message);
      } else {
        toast.error(t('login.generic_error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen  flex flex-col font-['Abhaya_Libre'] auth-page ">
      <div className='bg-transparent'>
        <Header withBackground={false} />
      </div>

      <main className='flex-1 flex items-center justify-center p-4 md:p-8 mt-10'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`bg-white rounded-[32px] shadow-2xl flex flex-col md:flex-row w-full max-w-[95%] sm:max-w-[70%] md:max-w-[55%] overflow-hidden `}
        >
          {/* Left / Right Image Section */}
          <div className='w-full md:w-[45%] relative bg-gradient-to-b from-[#FCECD8] to-[#986E58] flex flex-col items-center justify-start p-8 min-h-[350px] md:min-h-[unset] relative'>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className='absolute top-5 left-0 w-full text-center z-10'
            >
              <h2 className='text-3xl text-dark-red font-(--font-abhaya) mb-1'>
                {t('hero.welcome')}
              </h2>
              <h1 className='text-5xl text-dark-red font-(--font-abhaya) font-bold uppercase tracking-wider'>
                {t('hero.al_malaki')}
              </h1>
            </motion.div>

            {/* Crown Woman Image */}
            <div className='flex-1 w-full flex items-end justify-center  absolute inset-0 z-0'>
              {/* Placeholder that can be easily replaced */}
              <motion.img
                initial={{ opacity: 0, filter: 'blur(5px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ delay: 0.4, duration: 0.8 }}
                src={authModel}
                alt='Al Malaki'
                className='object-cover w-full  rounded-[32px] md:rounded-none h-full relative inset-0 top-0 '
                style={{
                  objectPosition: 'center top',
                  //   maskImage:
                  //     'linear-gradient(to bottom, transparent, black 20%)',
                }}
              />
            </div>
          </div>

          {/* Form Section */}
          <div className='w-full md:w-[55%] p-6  flex flex-col justify-center bg-white relative'>
            <motion.h2
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className='text-3xl md:text-4xl text-dark-red font-(--font-abhaya) !font-extrabold text-center mb-4 md:mb-6'
            >
              {t('login.title')}
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className='text-center mb-6 md:mb-8 flex flex-wrap justify-center items-center gap-1 md:gap-2 text-sm md:text-md'
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              <span className='text-dark-red text-xl text-center'>
                {t('login.no_account')}
              </span>
              <Link
                to='/register'
                className='font-semibold text-lg md:text-xl text-dark-red font-(--font-abhaya) underline decoration-dark-red underline-offset-8 tracking-wide'
              >
                {t('login.sign_up')}
              </Link>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className='max-w-md mx-auto w-full space-y-6'
              dir={isRtl ? 'rtl' : 'ltr'}
              onSubmit={handleSubmit}
            >
              <div>
                <label className='block text-xl !font-bold text-dark-red font-(--font-abhaya) mb-2 font-italic'>
                  {t('login.email')}
                </label>
                <input
                  type='email'
                  placeholder={t('login.email_placeholder')}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete='email'
                  maxLength={254}
                  required
                  className='w-full px-6 py-3 font-(--font-abhaya) font-italic rounded-full border border-dark-red bg-transparent text-dark-red placeholder:text-dark-red/50 focus:outline-none focus:ring-2 focus:ring-dark-red transition-all'
                />
              </div>

              <div>
                <label className='block text-xl !font-bold text-dark-red font-(--font-abhaya) mb-2 font-italic'>
                  {t('login.password')}
                </label>
                <div className='relative'>
                  <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    placeholder={t('login.password_placeholder')}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete='current-password'
                    required
                    minLength={8}
                    maxLength={64}
                    className={`w-full py-3 font-(--font-abhaya) font-italic rounded-full border border-dark-red bg-transparent text-dark-red placeholder:text-dark-red/50 focus:outline-none focus:ring-2 focus:ring-dark-red transition-all ${isRtl ? 'pl-14 pr-6' : 'pr-14 pl-6'}`}
                  />

                  <button
                    type='button'
                    onClick={() =>
                      setIsPasswordVisible((currentValue) => !currentValue)
                    }
                    aria-label={
                      isPasswordVisible
                        ? t('login.hide_password')
                        : t('login.show_password')
                    }
                    title={
                      isPasswordVisible
                        ? t('login.hide_password')
                        : t('login.show_password')
                    }
                    className={`absolute top-1/2 -translate-y-1/2 text-dark-red/70 hover:text-dark-red transition-colors ${isRtl ? 'left-4' : 'right-4'}`}
                  >
                    {isPasswordVisible ? (
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='1.8'
                        className='h-5 w-5'
                        aria-hidden='true'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          d='M3 3l18 18m-2.4-2.4A10.5 10.5 0 0 1 12 20C6.5 20 3.2 15.9 2 12c.6-1.9 1.6-3.6 2.9-5m3.1-2.4A10.8 10.8 0 0 1 12 4c5.5 0 8.8 4.1 10 8-0.6 1.9-1.6 3.6-2.9 5M15 12a3 3 0 0 1-4.5 2.6'
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='1.8'
                        className='h-5 w-5'
                        aria-hidden='true'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          d='M2 12s3.3-8 10-8 10 8 10 8-3.3 8-10 8S2 12 2 12z'
                        />
                        <circle cx='12' cy='12' r='3' />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className='pt-3 flex justify-center'>
                <button
                  type='submit'
                  disabled={isSubmitting}
                  className='px-12 py-3 rounded-full font-serif font-bold text-dark-red bg-[#EEDCC1] bg-gradient-to-r from-[#e3caa2] to-[#eedcc1] hover:scale-105 transition-transform shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100'
                  style={{
                    backgroundImage: 'url(/honey_pattern.png)',
                    backgroundSize: 'cover',
                  }}
                >
                  {isSubmitting ? t('login.loading') : t('login.title')}
                </button>
              </div>

              <div className='text-center mt-2'>
                <Link
                  to={`/forgot-password?email=${encodeURIComponent(email.trim())}`}
                  className='text-sm text-dark-red hover:underline'
                >
                  {t('login.forgot_password')}
                </Link>
              </div>
            </motion.form>
          </div>
        </motion.div>
      </main>

      {/* Exclude Footer from standard view maybe? The design doesn't show a footer but I'll add it if it's there, let's omit for exact pixel match of the screen */}
    </div>
  );
}
