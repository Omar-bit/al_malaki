import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Header } from '../components/Header';
import { authService } from '../services';
import { validatePasswordValue } from '../utils/formValidation';
import authModel from '../assets/auth-model.jpg';

export function ResetPasswordPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';
  const [searchParams] = useSearchParams();

  const token = useMemo(
    () => searchParams.get('token')?.trim() ?? '',
    [searchParams],
  );

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const validateToken = async () => {
      if (!token) {
        toast.error(t('reset_password.invalid_link'));
        navigate('/forgot-password', { replace: true });
        return;
      }

      try {
        await authService.validateResetPasswordToken({ token });
        if (isMounted) {
          setIsTokenValid(true);
        }
      } catch (error) {
        if (error instanceof Error && error.message) {
          toast.error(error.message);
        } else {
          toast.error(t('reset_password.invalid_link'));
        }

        navigate('/forgot-password', { replace: true });
      } finally {
        if (isMounted) {
          setIsValidatingToken(false);
        }
      }
    };

    void validateToken();

    return () => {
      isMounted = false;
    };
  }, [navigate, t, token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newPasswordValidation = validatePasswordValue(newPassword, {
      required: t('reset_password.new_password_required'),
      tooShort: t('reset_password.password_too_short'),
      tooLong: t('reset_password.password_too_long', {
        defaultValue: 'Password must be at most 64 characters',
      }),
    });

    if (!newPasswordValidation.isValid) {
      toast.error(newPasswordValidation.error);
      return;
    }

    if (!confirmPassword.trim()) {
      toast.error(
        t('reset_password.confirm_password_required', {
          defaultValue: 'Please confirm your new password',
        }),
      );
      return;
    }

    if (newPasswordValidation.value !== confirmPassword) {
      toast.error(t('reset_password.password_mismatch'));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.resetPassword({
        token,
        newPassword: newPasswordValidation.value,
      });

      toast.success(response.message || t('reset_password.success'));
      navigate('/login', { replace: true });
    } catch (error) {
      if (error instanceof Error && error.message) {
        toast.error(error.message);
      } else {
        toast.error(t('reset_password.generic_error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidatingToken) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-[#f6efe3]'>
        <p className='text-dark-red text-lg font-abhaya'>
          {t('reset_password.validating_link')}
        </p>
      </div>
    );
  }

  if (!isTokenValid) {
    return null;
  }

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
          className='bg-white rounded-[32px] shadow-2xl flex flex-col md:flex-row w-full max-w-[95%] sm:max-w-[70%] md:max-w-[58%] overflow-hidden'
        >
          <div className='w-full md:w-[42%] relative bg-gradient-to-b from-[#FCECD8] to-[#986E58] flex flex-col items-center justify-start p-8 min-h-[350px] md:min-h-[unset]'>
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

          <div className='w-full md:w-[58%] flex flex-col justify-center bg-white relative p-3'>
            <motion.h2
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className='text-3xl md:text-4xl text-dark-red font-abhaya font-extrabold text-center mb-2 md:mb-4'
            >
              {t('reset_password.title')}
            </motion.h2>

            <p className='text-dark-red/80 text-center text-lg mb-4'>
              {t('reset_password.subtitle')}
            </p>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className='text-center mb-6 md:mb-8 flex flex-wrap justify-center items-center gap-1 md:gap-2 text-sm md:text-md'
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              <span className='text-dark-red text-xl text-center'>
                {t('reset_password.remember_password')}
              </span>
              <Link
                to='/login'
                className='font-bold text-lg md:text-2xl text-dark-red font-abhaya underline decoration-dark-er underline-offset-5 tracking-wide'
              >
                {t('reset_password.login_link')}
              </Link>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className='max-w-md mx-auto w-full space-y-5'
              dir={isRtl ? 'rtl' : 'ltr'}
              onSubmit={handleSubmit}
            >
              <div>
                <label className='block text-xl font-bold text-dark-red font-abhaya mb-2'>
                  {t('reset_password.new_password')}
                </label>
                <div className='relative'>
                  <input
                    type={isNewPasswordVisible ? 'text' : 'password'}
                    placeholder={t('reset_password.new_password_placeholder')}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete='new-password'
                    required
                    minLength={8}
                    maxLength={64}
                    className={`w-full py-3 font-abhaya rounded-full border border-dark-red bg-transparent text-dark-red placeholder:text-dark-red/50 focus:outline-none focus:ring-2 focus:ring-dark-red transition-all ${isRtl ? 'pl-14 pr-6' : 'pr-14 pl-6'}`}
                  />
                  <button
                    type='button'
                    onClick={() =>
                      setIsNewPasswordVisible((currentValue) => !currentValue)
                    }
                    className={`absolute top-1/2 -translate-y-1/2 text-dark-red/70 hover:text-dark-red transition-colors ${isRtl ? 'left-4' : 'right-4'}`}
                    aria-label={
                      isNewPasswordVisible
                        ? t('reset_password.hide_password')
                        : t('reset_password.show_password')
                    }
                  >
                    {isNewPasswordVisible ? (
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

              <div>
                <label className='block text-xl font-bold text-dark-red font-abhaya mb-2'>
                  {t('reset_password.confirm_password')}
                </label>
                <div className='relative'>
                  <input
                    type={isConfirmPasswordVisible ? 'text' : 'password'}
                    placeholder={t(
                      'reset_password.confirm_password_placeholder',
                    )}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete='new-password'
                    required
                    minLength={8}
                    maxLength={64}
                    className={`w-full py-3 font-abhaya rounded-full border border-dark-red bg-transparent text-dark-red placeholder:text-dark-red/50 focus:outline-none focus:ring-2 focus:ring-dark-red transition-all ${isRtl ? 'pl-14 pr-6' : 'pr-14 pl-6'}`}
                  />
                  <button
                    type='button'
                    onClick={() =>
                      setIsConfirmPasswordVisible(
                        (currentValue) => !currentValue,
                      )
                    }
                    className={`absolute top-1/2 -translate-y-1/2 text-dark-red/70 hover:text-dark-red transition-colors ${isRtl ? 'left-4' : 'right-4'}`}
                    aria-label={
                      isConfirmPasswordVisible
                        ? t('reset_password.hide_password')
                        : t('reset_password.show_password')
                    }
                  >
                    {isConfirmPasswordVisible ? (
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

              <div className='pt-2 flex justify-center'>
                <button
                  type='submit'
                  disabled={isSubmitting}
                  className='px-12 py-3 rounded-full font-serif font-bold text-dark-red bg-[#EEDCC1] bg-gradient-to-r from-[#e3caa2] to-[#eedcc1] hover:scale-105 transition-transform shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100'
                  style={{
                    backgroundImage: 'url(/honey_pattern.png)',
                    backgroundSize: 'cover',
                  }}
                >
                  {isSubmitting
                    ? t('reset_password.loading')
                    : t('reset_password.submit')}
                </button>
              </div>
            </motion.form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
