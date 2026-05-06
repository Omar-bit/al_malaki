import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminService } from '../services';
import {
  validateNameValue,
  validatePasswordValue,
  validatePhoneValue,
} from '../utils/formValidation';

export function InviteAcceptPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = useMemo(
    () => searchParams.get('token')?.trim() ?? '',
    [searchParams],
  );
  const inviteEmail = useMemo(
    () => searchParams.get('email')?.trim() ?? '',
    [searchParams],
  );

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      toast.error('Invitation token is missing or invalid.');
      return;
    }

    const firstNameValidation = validateNameValue(firstName, {
      required: 'Please enter your first name',
      tooLong: 'Name must be at most 100 characters',
    });

    if (!firstNameValidation.isValid) {
      toast.error(firstNameValidation.error);
      return;
    }

    const lastNameValidation = validateNameValue(lastName, {
      required: 'Please enter your last name',
      tooLong: 'Name must be at most 100 characters',
    });

    if (!lastNameValidation.isValid) {
      toast.error(lastNameValidation.error);
      return;
    }

    const passwordValidation = validatePasswordValue(password, {
      required: 'Please enter a password',
      tooShort: 'Password must be at least 8 characters',
      tooLong: 'Password must be at most 64 characters',
    });

    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.error);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    let normalizedPhoneNumber: string | undefined;

    if (phoneNumber.trim().length > 0) {
      const phoneValidation = validatePhoneValue(phoneNumber, {
        required: 'Please enter your phone number',
        invalid: 'Please enter a valid phone number',
      });

      if (!phoneValidation.isValid) {
        toast.error(phoneValidation.error);
        return;
      }

      normalizedPhoneNumber = phoneValidation.value;
    }

    setIsSubmitting(true);

    try {
      await adminService.acceptAdminInvitation({
        token,
        firstName: firstNameValidation.value,
        lastName: lastNameValidation.value,
        password: passwordValidation.value,
        phoneNumber: normalizedPhoneNumber,
      });

      toast.success('Invitation accepted. You can now log in.');
      navigate('/login', { replace: true });
    } catch (error) {
      if (error instanceof Error && error.message) {
        toast.error(error.message);
      } else {
        toast.error('Unable to accept invitation. Please try again.');
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
          className='w-full max-w-150 rounded-[36px] bg-[#efe0c4] px-6 py-8 shadow-[0_20px_46px_rgba(28,6,10,0.22)] md:px-10'
        >
          <div className='flex items-start justify-between'>
            <div>
              <p className='text-xs uppercase tracking-[0.3em] text-[#7d5c4a]'>
                AL MALAKI
              </p>
              <h1 className='mt-2 text-3xl font-extrabold text-dark-red md:text-[38px]'>
                Confirm your invitation
              </h1>
            </div>
            <button
              type='button'
              onClick={() => navigate('/login')}
              aria-label='Close'
              className='leading-none text-[38px] text-dark-red transition-opacity hover:opacity-75'
            >
              ×
            </button>
          </div>

          <p className='mt-3 text-base text-dark-red/90 md:text-lg'>
            Set your details to activate your admin access.
          </p>

          {inviteEmail && (
            <p className='mt-2 text-sm text-dark-red/70'>
              Invitation sent to{' '}
              <span className='font-semibold'>{inviteEmail}</span>
            </p>
          )}

          {!token ? (
            <div className='mt-6 rounded-2xl border border-[#6d232f]/30 bg-white/70 px-4 py-3 text-sm text-dark-red'>
              Invalid or missing invitation token. Please request a new
              invitation.
            </div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className='mt-6 grid gap-4'
              onSubmit={handleSubmit}
            >
              <div className='grid gap-4 md:grid-cols-2'>
                <div>
                  <label className='mb-2 block text-sm font-semibold text-dark-red'>
                    First name
                  </label>
                  <input
                    type='text'
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    className='h-11 w-full rounded-xl border border-[#6d232f]/35 bg-transparent px-4 text-sm text-dark-red outline-none focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/20'
                    required
                  />
                </div>
                <div>
                  <label className='mb-2 block text-sm font-semibold text-dark-red'>
                    Last name
                  </label>
                  <input
                    type='text'
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className='h-11 w-full rounded-xl border border-[#6d232f]/35 bg-transparent px-4 text-sm text-dark-red outline-none focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/20'
                    required
                  />
                </div>
              </div>

              <div>
                <label className='mb-2 block text-sm font-semibold text-dark-red'>
                  Phone number (optional)
                </label>
                <input
                  type='tel'
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  className='h-11 w-full rounded-xl border border-[#6d232f]/35 bg-transparent px-4 text-sm text-dark-red outline-none focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/20'
                />
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                <div>
                  <label className='mb-2 block text-sm font-semibold text-dark-red'>
                    Password
                  </label>
                  <input
                    type='password'
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className='h-11 w-full rounded-xl border border-[#6d232f]/35 bg-transparent px-4 text-sm text-dark-red outline-none focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/20'
                    minLength={8}
                    maxLength={64}
                    required
                  />
                </div>
                <div>
                  <label className='mb-2 block text-sm font-semibold text-dark-red'>
                    Confirm password
                  </label>
                  <input
                    type='password'
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className='h-11 w-full rounded-xl border border-[#6d232f]/35 bg-transparent px-4 text-sm text-dark-red outline-none focus:border-[#6d232f] focus:ring-2 focus:ring-[#6d232f]/20'
                    minLength={8}
                    maxLength={64}
                    required
                  />
                </div>
              </div>

              <div className='mt-4 flex justify-end gap-3'>
                <button
                  type='button'
                  onClick={() => navigate('/login')}
                  className='rounded-full border border-[#6d232f]/40 px-5 py-2 text-sm font-semibold text-dark-red transition hover:bg-white/70'
                >
                  Back to login
                </button>
                <button
                  type='submit'
                  disabled={isSubmitting}
                  className='rounded-full bg-[#4f0010] px-6 py-2 text-sm font-semibold text-[#f7e8cc] shadow-[0_10px_24px_rgba(45,4,12,0.28)] transition hover:-translate-y-px hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-65'
                >
                  {isSubmitting ? 'Saving...' : 'Confirm access'}
                </button>
              </div>
            </motion.form>
          )}
        </motion.section>
      </main>
    </div>
  );
}
