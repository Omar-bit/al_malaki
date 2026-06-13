import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { useCart } from '../contexts/CartContext';
import cartIcon from '../assets/cart.svg';
import scoopIcon from '../assets/scoop.svg';
import profile from '../assets/profile.svg';
type NavLink = {
  labelKey: string;
  href: string;
};

const navLinks: NavLink[] = [
  { labelKey: 'home', href: '/' },
  { labelKey: 'about', href: '/#about' },
  { labelKey: 'products', href: '/products' },
  { labelKey: 'customize', href: '/#customize' },
];

export function Header({
  withBackground = true,
}: {
  withBackground?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { openCart, totalItems } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (isOpen) {
        setIsVisible(true);
        lastScrollYRef.current = currentScrollY;
        return;
      }

      const shouldShowHeader =
        currentScrollY <= 10 || currentScrollY < lastScrollYRef.current;

      setIsVisible((prevIsVisible) =>
        prevIsVisible === shouldShowHeader ? prevIsVisible : shouldShowHeader,
      );

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen]);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en');
  };

  return (
    <header
      className={`fixed top-0 left-0 z-30 w-full p-4 py-0 md:p-0 backdrop-blur opacity-80 transition-transform duration-300 ease-in-out ${isVisible || isOpen ? 'translate-y-0' : '-translate-y-full'} ${withBackground ? 'bg-[#e1d0bc79] ' : ' '}`}
    >
      <nav className=' flex w-full items-center justify-between px-5 py-1 bg-transparent'>
        <Logo
          onClick={() => {
            navigate('/');
          }}
        />

        {/* Mobile Burger Toggle */}
        <button
          className='md:hidden text-dark-red p-2 transition-colors hover:text-gold'
          onClick={() => setIsOpen(!isOpen)}
          aria-label='Toggle menu'
        >
          {isOpen ? (
            <svg
              className='w-8 h-8'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          ) : (
            <svg
              className='w-8 h-8'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 6h16M4 12h16M4 18h16'
              />
            </svg>
          )}
        </button>

        {/* Desktop Navigation */}
        <ul className='hidden md:flex items-center gap-x-14 '>
          {navLinks.map((link) => (
            <li key={link.labelKey} className=''>
              <a
                href={link.href}
                className={`whitespace-nowrap text-dark-red text-[22px] leading-[1.178] transition-colors hover:text-gold testing ${i18n.language === 'en' ? 'font-italic' : 'font-taviraj font-bold'}`}
              >
                {t(`header.${link.labelKey}`)}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop Icons */}
        <div className='hidden md:flex items-center gap-7 '>
          <button
            className='text-dark-red transition-colors hover:text-gold relative'
            aria-label='Scoop'
            // onClick={openCart}
          >
            <img className='size-6' src={scoopIcon} alt='scoop' />
          </button>
          <button
            className='text-dark-red transition-colors hover:text-gold relative'
            aria-label='Cart'
            onClick={openCart}
          >
            <img className='size-6' src={cartIcon} alt='Cart' />
            {totalItems > 0 && (
              <span className='absolute -top-1.5 -right-2 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-[#3f060f] text-[#fdf8f0] text-[11px] font-abee font-bold px-1'>
                {totalItems}
              </span>
            )}
          </button>
          <Link
            to='/login'
            className='text-dark-red transition-colors hover:text-gold'
            aria-label='Account'
          >
            <img className='size-6' src={profile} alt='Account' />
          </Link>

          <button
            onClick={toggleLanguage}
            className='text-dark-red font-abee text-[20px] leading-[1.182] transition-colors hover:text-gold sm:text-[24px] cursor-pointer'
          >
            {t('header.lang')}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className='absolute top-full left-0 w-full bg-[#E0CFBB] flex flex-col items-center py-6 shadow-md md:hidden z-40 gap-6 border-t border-[#d9c7b3]'>
          <ul className='flex flex-col items-center gap-6'>
            {navLinks.map((link) => (
              <li key={link.labelKey} className=''>
                <a
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`whitespace-nowrap text-dark-red text-[24px] leading-[1.178] transition-colors hover:text-gold ${i18n.language === 'en' ? 'font-italic' : 'font-taviraj font-bold'}`}
                >
                  {t(`header.${link.labelKey}`)}
                </a>
              </li>
            ))}
          </ul>

          <div className='flex items-center gap-10 mt-4'>
            <button
              onClick={toggleLanguage}
              className='text-dark-red font-abee text-[24px] transition-colors hover:text-gold cursor-pointer'
            >
              {t('header.lang')}
            </button>
            <button
              className='text-dark-red transition-colors hover:text-gold relative'
              aria-label='Cart'
              onClick={() => {
                setIsOpen(false);
                openCart();
              }}
            >
              <img src={cartIcon} alt='Cart' />
              {totalItems > 0 && (
                <span className='absolute -top-1.5 -right-2 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-[#3f060f] text-[#fdf8f0] text-[11px] font-abee font-bold px-1'>
                  {totalItems}
                </span>
              )}
            </button>
            <Link
              to='/login'
              className='text-dark-red transition-colors hover:text-gold'
              aria-label='Account'
            >
              <img src={profile} alt='Account' />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
