import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Header } from '../components/Header';
import { authService } from '../services';
import { getStoredInfluencerTrackingCode } from '../services/influencerTrackingService';
import {
  validateBirthDateValue,
  validateEmailValue,
  validateNameValue,
  validatePasswordValue,
  validatePhoneValue,
} from '../utils/formValidation';
import authModel from '../assets/auth-model.jpg';

export function RegisterPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [profilePictureName, setProfilePictureName] = useState('');
  const [isUploadingProfilePicture, setIsUploadingProfilePicture] =
    useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasPasswordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const handlePhoneNumberChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 8);
    setPhoneNumber(digitsOnly);
  };

  const handleProfilePictureChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error(
        t('register.profile_picture_invalid', {
          defaultValue: 'Please upload a valid image file',
        }),
      );
      event.target.value = '';
      return;
    }

    setIsUploadingProfilePicture(true);

    try {
      const response = await authService.uploadProfilePicture(file);
      setProfilePicture(response.url);
      setProfilePictureName(file.name);
      toast.success(
        t('register.profile_picture_uploaded', {
          defaultValue: 'Profile picture uploaded',
        }),
      );
    } catch (error) {
      if (error instanceof Error && error.message) {
        toast.error(error.message);
      } else {
        toast.error(
          t('register.profile_picture_invalid', {
            defaultValue: 'Please upload a valid image file',
          }),
        );
      }
      setProfilePicture('');
      setProfilePictureName('');
    } finally {
      setIsUploadingProfilePicture(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const firstNameValidation = validateNameValue(firstName, {
      required: t('register.first_name_required', {
        defaultValue: 'Please enter your first name',
      }),
      tooLong: t('register.name_too_long', {
        defaultValue: 'Name must be at most 100 characters',
      }),
    });

    if (!firstNameValidation.isValid) {
      toast.error(firstNameValidation.error);
      return;
    }

    const lastNameValidation = validateNameValue(lastName, {
      required: t('register.last_name_required', {
        defaultValue: 'Please enter your last name',
      }),
      tooLong: t('register.name_too_long', {
        defaultValue: 'Name must be at most 100 characters',
      }),
    });

    if (!lastNameValidation.isValid) {
      toast.error(lastNameValidation.error);
      return;
    }

    const phoneValidation = validatePhoneValue(phoneNumber, {
      required: t('register.phone_required', {
        defaultValue: 'Please enter your phone number',
      }),
      invalid: t('register.phone_invalid', {
        defaultValue: 'Please enter a valid phone number',
      }),
    });

    if (!phoneValidation.isValid) {
      toast.error(phoneValidation.error);
      return;
    }

    const emailValidation = validateEmailValue(email, {
      required: t('register.email_required'),
      invalid: t('register.email_invalid', {
        defaultValue: 'Please enter a valid email address',
      }),
    });

    if (!emailValidation.isValid) {
      toast.error(emailValidation.error);
      return;
    }

    const birthDateValidation = validateBirthDateValue(birthDate, {
      required: t('register.birth_date_required', {
        defaultValue: 'Please enter your date of birth',
      }),
      invalid: t('register.birth_date_invalid', {
        defaultValue: 'Please enter a valid date of birth',
      }),
      future: t('register.birth_date_future', {
        defaultValue: 'Date of birth cannot be in the future',
      }),
    });

    if (!birthDateValidation.isValid) {
      toast.error(birthDateValidation.error);
      return;
    }

    const passwordValidation = validatePasswordValue(password, {
      required: t('register.password_required', {
        defaultValue: 'Please enter a password',
      }),
      tooShort: t('register.password_too_short', {
        defaultValue: 'Password must be at least 8 characters',
      }),
      tooLong: t('register.password_too_long', {
        defaultValue: 'Password must be at most 64 characters',
      }),
    });

    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.error);
      return;
    }

    const confirmPasswordValidation = validatePasswordValue(confirmPassword, {
      required: t('register.confirm_password_required', {
        defaultValue: 'Please confirm your password',
      }),
      tooShort: t('register.password_too_short', {
        defaultValue: 'Password must be at least 8 characters',
      }),
      tooLong: t('register.password_too_long', {
        defaultValue: 'Password must be at most 64 characters',
      }),
    });

    if (!confirmPasswordValidation.isValid) {
      toast.error(confirmPasswordValidation.error);
      return;
    }

    if (passwordValidation.value !== confirmPasswordValidation.value) {
      toast.error(t('register.password_mismatch'));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.register({
        firstName: firstNameValidation.value,
        lastName: lastNameValidation.value,
        phoneNumber: phoneValidation.value,
        email: emailValidation.value,
        birthDate: birthDateValidation.value,
        profilePicture,
        password: passwordValidation.value,
        influencerTrackingCode: getStoredInfluencerTrackingCode(),
      });

      toast.success(t('register.success'));
      navigate(
        `/verify-email?email=${encodeURIComponent(emailValidation.value)}`,
        {
          replace: true,
          state: {
            otpExpiresInSeconds: response.expiresInSeconds,
          },
        },
      );
    } catch (error) {
      if (error instanceof Error && error.message) {
        toast.error(error.message);
      } else {
        toast.error(t('register.generic_error'));
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

      <main className=' flex-1 items-center mx-auto md:mx-[unset]  justify-center overflow-hidden px-4 pb-8 pt-24 md:flex  md:px-8 md:pt-20'>
        <div className='fixed inset-0 md:hidden'>
          <img
            src={authModel}
            alt='Al Malaki'
            className='h-full w-full object-cover blur-md opacity-80'
            style={{ objectPosition: 'center top' }}
          />
          {/* <div className='absolute inset-0 bg-[#ead8d0]/72 backdrop-blur-[2px]' /> */}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className='sticky flex w-full max-w-[360px] flex-col overflow-hidden  rounded-none bg-transparent shadow-none sm:max-w-[70%] md:max-h-[85vh] md:max-w-[50%] md:flex-row md:rounded-[32px] md:bg-white md:shadow-2xl'
        >
          <div className='relative hidden min-h-[440px] w-full flex-col items-center justify-start bg-gradient-to-b from-[#F4E6D4] via-[#CCB19C] to-[#7A302D] p-4 md:flex md:min-h-[560px] lg:w-[46%] lg:p-6'>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className='absolute left-0 top-6 z-10 w-full text-center'
            >
              <h2 className='mb-1 text-3xl text-dark-red font-abhaya md:text-2xl'>
                {t('hero.welcome')}
              </h2>
              <h1 className='text-5xl font-bold uppercase tracking-[0.08em] text-dark-red md:text-4xl'>
                {t('hero.al_malaki')}
              </h1>
            </motion.div>

            <div className='absolute inset-0 z-0 flex w-full flex-1 items-end justify-center'>
              <motion.img
                initial={{ opacity: 0, filter: 'blur(5px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ delay: 0.4, duration: 0.8 }}
                src={authModel}
                alt='Al Malaki'
                className='relative inset-0 top-0 h-full w-full object-cover lg:rounded-none rounded-[32px]'
                style={{
                  objectPosition: 'center center',
                }}
              />
            </div>
          </div>

          <div className='relative z-10 flex w-full flex-col justify-center px-3 pb-2 pt-4 md:bg-white md:px-6 md:pt-7 lg:w-[54%] lg:px-10 lg:pt-5 '>
            <motion.h2
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className='mb-3 text-center text-[2.15rem] font-abhaya font-extrabold text-dark-red md:text-2xl'
            >
              {t('register.title')}
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className='mb-8 flex flex-wrap items-center justify-center gap-1 text-center text-base md:mb-8 md:gap-2 md:text-sm'
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              <span className='text-center text-[1.05rem] text-dark-red md:text-xl'>
                {t('register.has_account')}
              </span>
              <Link
                to='/login'
                className='font-abhaya text-[1.05rem] font-semibold tracking-wide text-dark-red underline decoration-dark-red underline-offset-4 md:text-xl md:underline-offset-8'
              >
                {t('register.login_link')}
              </Link>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className='mx-auto flex  w-full max-w-[290px] flex-col gap-4 overflow-y-auto md:max-w-none md:pr-1 lg:max-h-[90vh]'
              dir={isRtl ? 'rtl' : 'ltr'}
              onSubmit={handleSubmit}
            >
              <div>
                <label className='mb-2 block text-[1.55rem] font-bold text-dark-red font-abhaya md:text-xl'>
                  {t('register.first_name')}
                </label>
                <input
                  type='text'
                  placeholder={t('register.first_name_placeholder')}
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  autoComplete='name'
                  maxLength={100}
                  required
                  className='w-full rounded-full border border-dark-red bg-transparent px-4 py-[0.92rem] font-abhaya text-dark-red transition-all placeholder:text-dark-red/55 focus:outline-none focus:ring-2 focus:ring-dark-red md:px-6 md:py-2'
                />
              </div>
              <div>
                <label className='mb-2 block text-[1.55rem] font-bold text-dark-red font-abhaya md:text-xl'>
                  {t('register.last_name')}
                </label>
                <input
                  type='text'
                  placeholder={t('register.last_name_placeholder')}
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  autoComplete='name'
                  maxLength={100}
                  required
                  className='w-full rounded-full border border-dark-red bg-transparent px-4 py-[0.92rem] font-abhaya text-dark-red transition-all placeholder:text-dark-red/55 focus:outline-none focus:ring-2 focus:ring-dark-red md:px-6 md:py-2'
                />
              </div>

              <div>
                <label className='mb-2 block text-[1.55rem] font-bold text-dark-red font-abhaya md:text-xl'>
                  {t('register.phone')}
                </label>
                <input
                  type='tel'
                  placeholder={t('register.phone_placeholder')}
                  value={phoneNumber}
                  onChange={(event) =>
                    handlePhoneNumberChange(event.target.value)
                  }
                  autoComplete='tel'
                  inputMode='numeric'
                  maxLength={8}
                  pattern='[0-9]{8}'
                  required
                  className='w-full rounded-full border border-dark-red bg-transparent px-4 py-[0.92rem] font-abhaya text-dark-red transition-all placeholder:text-dark-red/55 focus:outline-none focus:ring-2 focus:ring-dark-red md:px-6 md:py-2'
                />
              </div>

              <div>
                <label className='mb-2 block text-[1.55rem] font-bold text-dark-red font-abhaya md:text-xl'>
                  {t('register.email')}
                </label>
                <input
                  type='email'
                  placeholder={t('register.email_placeholder')}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete='email'
                  maxLength={254}
                  required
                  className='w-full rounded-full border border-dark-red bg-transparent px-4 py-[0.92rem] font-abhaya text-dark-red transition-all placeholder:text-dark-red/55 focus:outline-none focus:ring-2 focus:ring-dark-red md:px-6 md:py-2'
                />
              </div>

              <div>
                <label className='mb-2 block text-[1.55rem] font-bold text-dark-red font-abhaya md:text-xl'>
                  {t('register.birth_date')}
                </label>
                <input
                  type='date'
                  placeholder={t('register.birth_date_placeholder')}
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className='w-full rounded-full border border-dark-red bg-transparent px-4 py-[0.92rem] font-abhaya text-dark-red transition-all placeholder:text-dark-red/55 focus:outline-none focus:ring-2 focus:ring-dark-red md:px-6 md:py-2'
                />
              </div>

              <div>
                <label className='mb-2 block text-[1.55rem] font-bold text-dark-red font-abhaya md:text-xl'>
                  {t('register.password')}
                </label>
                <div className='relative'>
                  <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    placeholder={t('register.password_placeholder')}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete='new-password'
                    required
                    minLength={8}
                    maxLength={64}
                    className={`w-full rounded-full border border-dark-red bg-transparent py-[0.92rem] font-abhaya text-dark-red transition-all placeholder:text-dark-red/55 focus:outline-none focus:ring-2 focus:ring-dark-red ${isRtl ? 'pl-12 pr-4 md:pl-14 md:pr-6' : 'pr-12 pl-4 md:pr-14 md:pl-6'}`}
                  />
                  <button
                    type='button'
                    onClick={() =>
                      setIsPasswordVisible((currentValue) => !currentValue)
                    }
                    aria-label={
                      isPasswordVisible
                        ? t('register.hide_password')
                        : t('register.show_password')
                    }
                    title={
                      isPasswordVisible
                        ? t('register.hide_password')
                        : t('register.show_password')
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

              <div>
                <label className='mb-2 block text-[1.55rem] font-bold text-dark-red font-abhaya md:text-xl'>
                  {t('register.confirm_password')}
                </label>
                <div className='relative'>
                  <input
                    type={isConfirmPasswordVisible ? 'text' : 'password'}
                    placeholder={t('register.confirm_password_placeholder')}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete='new-password'
                    required
                    minLength={8}
                    maxLength={64}
                    className={`w-full rounded-full border bg-transparent py-[0.92rem] font-abhaya text-dark-red transition-all placeholder:text-dark-red/55 focus:outline-none focus:ring-2 ${hasPasswordMismatch ? 'border-red-500 focus:ring-red-500' : 'border-dark-red focus:ring-dark-red'} ${isRtl ? 'pl-12 pr-4 md:pl-14 md:pr-6' : 'pr-12 pl-4 md:pr-14 md:pl-6'}`}
                  />
                  <button
                    type='button'
                    onClick={() =>
                      setIsConfirmPasswordVisible(
                        (currentValue) => !currentValue,
                      )
                    }
                    aria-label={
                      isConfirmPasswordVisible
                        ? t('register.hide_password')
                        : t('register.show_password')
                    }
                    title={
                      isConfirmPasswordVisible
                        ? t('register.hide_password')
                        : t('register.show_password')
                    }
                    className={`absolute top-1/2 -translate-y-1/2 text-dark-red/70 hover:text-dark-red transition-colors ${isRtl ? 'left-4' : 'right-4'}`}
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
                {hasPasswordMismatch ? (
                  <p className='mt-2 text-sm text-red-600'>
                    {t('register.password_mismatch')}
                  </p>
                ) : null}
              </div>

              <div>
                <label className='mb-2 block text-[1.55rem] font-bold text-dark-red font-abhaya md:text-xl'>
                  {t('register.profile_picture')}{' '}
                  <span className='text-sm font-normal text-dark-red/60'>
                    ({t('others.optional')})
                  </span>
                </label>
                <label className='flex cursor-pointer items-center justify-between rounded-full border border-dark-red bg-transparent px-4 py-[0.92rem] font-abhaya text-dark-red transition-all hover:bg-[#f8efe4] md:px-6 md:py-2'>
                  <span className='truncate pr-4 text-dark-red/45'>
                    {isUploadingProfilePicture
                      ? t('register.profile_picture_uploading')
                      : profilePictureName ||
                        t('register.profile_picture_placeholder')}
                  </span>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1.8'
                    className='h-5 w-5 shrink-0 text-dark-red/70'
                    aria-hidden='true'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2'
                    />
                  </svg>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleProfilePictureChange}
                    disabled={isUploadingProfilePicture}
                    className='hidden'
                  />
                </label>
              </div>
              <div className='flex justify-center pt-2'>
                <button
                  type='submit'
                  disabled={isSubmitting || isUploadingProfilePicture}
                  className='rounded-full bg-[#EEDCC1] bg-gradient-to-r from-[#e3caa2] to-[#eedcc1] px-14 py-3 font-serif text-base font-bold text-dark-red shadow-md transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 md:px-12 md:text-base'
                  style={{
                    backgroundImage: 'url(/honey_pattern.png)',
                    backgroundSize: 'cover',
                  }}
                >
                  {isSubmitting ? t('register.loading') : t('register.submit')}
                </button>
              </div>
            </motion.form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
