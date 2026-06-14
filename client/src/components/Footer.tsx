import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { MapPin } from 'lucide-react';
import Seperator from './ui/Seperator';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 448 512'
    fill='currentColor'
    className={className}
  >
    <path d='M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z' />
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    className={className}
  >
    <path d='M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    className={className}
  >
    <rect x='2' y='2' width='20' height='20' rx='5' ry='5' />
    <path d='M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z' />
    <line x1='17.5' y1='6.5' x2='17.51' y2='6.5' />
  </svg>
);

const MailIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    className={className}
  >
    <rect x='2' y='4' width='20' height='16' rx='2' />
    <path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' />
  </svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.5'
    strokeLinecap='round'
    strokeLinejoin='round'
    className={className}
  >
    <path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.87 12 19.79 19.79 0 0 1 1.82 3.18 2 2 0 0 1 3.8 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z' />
  </svg>
);

export function Footer() {
  return (
    <footer className='w-full bg-dark-red mt-10 md:mt-16'>
      {/* 
        -----------------------------------------------------
        MOBILE VIEW 
        -----------------------------------------------------
      */}
      <div className='md:hidden px-6 pt-10 pb-6 flex flex-col'>
        {/* Logo & Tagline */}
        <div className='flex flex-col items-center mb-10'>
          <Logo className='w-36 mb-2' />
          <p className='text-white font-abhaya text-lg'>
            Pure honey, crafted by nature
          </p>
        </div>

        <div className='flex flex-col space-y-8 pl-2'>
          {/* QUICK LINKS */}
          <div className='flex flex-col items-start'>
            <h3 className='text-gold uppercase tracking-wider text-sm mb-4 font-semibold'>
              Quick Links
            </h3>
            <ul className='flex flex-col space-y-3'>
              <li>
                <Link to='/' className='text-white font-abhaya text-lg'>
                  Home
                </Link>
              </li>
              <li>
                <Link to='/products' className='text-white font-abhaya text-lg'>
                  Shop
                </Link>
              </li>
              <li>
                <Link to='/about' className='text-white font-abhaya text-lg'>
                  About
                </Link>
              </li>
              <li>
                <Link to='/contact' className='text-white font-abhaya text-lg'>
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* CUSTOMER AREA */}
          <div className='flex flex-col items-start'>
            <h3 className='text-gold uppercase tracking-wider text-sm mb-4 font-semibold'>
              Customer Area
            </h3>
            <ul className='flex flex-col space-y-3'>
              <li>
                <Link to='/profile' className='text-white font-abhaya text-lg'>
                  My account
                </Link>
              </li>
              <li>
                <Link
                  to='/track-order'
                  className='text-white font-abhaya text-lg'
                >
                  Track Order
                </Link>
              </li>
              <li>
                <Link to='/rewards' className='text-white font-abhaya text-lg'>
                  Rewards
                </Link>
              </li>
            </ul>
          </div>

          {/* CONTACT */}
          <div className='flex flex-col items-start'>
            <h3 className='text-gold uppercase tracking-wider text-sm mb-4 font-semibold'>
              Contact
            </h3>
            <div className='flex flex-col space-y-3'>
              <a
                href='tel:+21697530057'
                className='flex items-center gap-3 text-white font-abhaya text-lg'
              >
                <PhoneIcon className='size-4' />
                <span>97 530 057</span>
              </a>
              <a
                href='mailto:almalaki97530@gmail.com'
                className='flex items-center gap-3 text-white font-abhaya text-lg'
              >
                <MailIcon className='size-4' />
                <span>almalaki97530@gmail.com</span>
              </a>
            </div>
          </div>

          {/* FOLLOW */}
          <div className='flex flex-col items-start'>
            <h3 className='text-gold uppercase tracking-wider text-sm mb-4 font-semibold'>
              Follow
            </h3>
            <div className='flex flex-col space-y-3'>
              <a
                href='https://instagram.com/al.malaki_'
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-3 text-white font-abhaya text-lg'
              >
                <InstagramIcon className='size-4' />
                <span>al.malaki_</span>
              </a>
              <a
                href='https://tiktok.com/@al.malaki_'
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-3 text-white font-abhaya text-lg'
              >
                <TikTokIcon className='size-4' />
                <span>al.malaki_</span>
              </a>
              <a
                href='https://facebook.com/al.malaki_'
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-3 text-white font-abhaya text-lg'
              >
                <FacebookIcon className='size-4' />
                <span>al.malaki_</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 
        -----------------------------------------------------
        DESKTOP VIEW 
        -----------------------------------------------------
      */}
      <div className='hidden md:block max-w-6xl mx-auto px-6 md:px-12 pt-10 pb-6'>
        {/* Top 3-column grid */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-10 pb-8'>
          {/* Column 1: Logo */}
          <div className='flex flex-col items-start justify-start'>
            <Logo className='w-36 mb-2' />
          </div>

          {/* Column 2: Quick Links */}
          <div className='flex flex-col w-auto  items-start md:items-center '>
            <div>
              <h3 className='text-gold font-bold font-italic text-2xl mb-5 tracking-wide'>
                Quick Links
              </h3>
              <ul className='flex flex-col  space-y-2 '>
                <li>
                  <Link
                    to='/'
                    className='text-white hover:text-gold transition-colors font-abhaya text-base text-lg'
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to='/products'
                    className='text-white hover:text-gold transition-colors font-abhaya text-base text-lg'
                  >
                    Shop
                  </Link>
                </li>
                <li>
                  <Link
                    to='/about'
                    className='text-white hover:text-gold transition-colors font-abhaya text-base text-lg'
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    to='/contact'
                    className='text-white hover:text-gold transition-colors font-abhaya text-base text-lg'
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 3: Customer Area */}
          <div className='flex flex-col items-start md:items-center'>
            <div>
              <h3 className='text-gold font-bold font-italic text-2xl mb-5 tracking-wide'>
                Customer Area
              </h3>
              <ul className='flex flex-col space-y-2'>
                <li>
                  <Link
                    to='/profile'
                    className='text-white hover:text-gold transition-colors font-abhaya text-base text-lg'
                  >
                    My account
                  </Link>
                </li>
                <li>
                  <Link
                    to='/track-order'
                    className='text-white hover:text-gold transition-colors font-abhaya text-base text-lg'
                  >
                    Track Order
                  </Link>
                </li>
                <li>
                  <Link
                    to='/rewards'
                    className='text-white hover:text-gold transition-colors font-abhaya text-base text-lg'
                  >
                    Rewards
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Info bar: Location | Phone | Socials */}
        <div className='flex flex-col sm:flex-row items-center justify-between  py-4 '>
          {/* Location */}
          <div className='flex items-center gap-2 text-white text-sm font-abhaya '>
            <MapPin className='size-6 text-white' />
            <span className='font-abee tracking-widest '>Soon</span>
          </div>

          {/* Phone */}
          <a
            href='tel:+21697530057'
            className='flex items-center gap-2 text-white hover:text-gold transition-colors text-sm font-abhaya ml-30'
          >
            <PhoneIcon className='size-6 ' />
            <span className='font-abee tracking-widest '>+216 97 530 057</span>
          </a>

          {/* Social icons */}
          <div className='flex items-center justify-center gap-13 '>
            <a
              href='https://instagram.com/al.malaki_'
              target='_blank'
              rel='noopener noreferrer'
              className='text-white hover:text-gold transition-colors'
            >
              <InstagramIcon className='size-6' />
            </a>
            <a
              href='mailto:almalaki97530@gmail.com'
              className='text-white hover:text-gold transition-colors'
            >
              <MailIcon className='size-6' />
            </a>
            <a
              href='https://facebook.com/al.malaki_'
              target='_blank'
              rel='noopener noreferrer'
              className='text-white hover:text-gold transition-colors'
            >
              <FacebookIcon className='size-6' />
            </a>
            <a
              href='https://tiktok.com/@al.malaki_'
              target='_blank'
              rel='noopener noreferrer'
              className='text-white hover:text-gold transition-colors'
            >
              <TikTokIcon className='w-4 h-4' />
            </a>
          </div>
        </div>
      </div>
      <Seperator lineColor='white' lineSize='thin' crownSize='medium' />

      {/* Copyright */}
      <p className='text-center text-white text-md font-abee font-light pb-4 '>
        © 2026 Influence Template . All Rights Reserved
      </p>
    </footer>
  );
}
