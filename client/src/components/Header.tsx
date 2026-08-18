import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Logo } from './Logo';
import { SearchOverlay } from './SearchOverlay';
import { useCart } from '../contexts/CartContext';
import { useAuth, useNotifications } from '../contexts';
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
  { labelKey: 'customize', href: '/customize-pack' },
];

export function Header({
  withBackground = false,
  topHide = false,
}: {
  withBackground?: boolean;
  topHide?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);
  const lastScrollYRef = useRef(0);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { openCart, totalItems } = useCart();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const mobileMenuLinks = [
    navLinks.find((link) => link.labelKey === 'products'),
    navLinks.find((link) => link.labelKey === 'about'),
    navLinks.find((link) => link.labelKey === 'customize'),
  ].filter((link): link is NavLink => Boolean(link));

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isAwayFromTop = currentScrollY > 10;

      setHasScrolled((prevHasScrolled) =>
        prevHasScrolled === isAwayFromTop ? prevHasScrolled : isAwayFromTop,
      );

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

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen]);

  const toggleLanguage = () => {
    const nextLang = { en: 'fr', fr: 'ar', ar: 'en' }[i18n.language] || 'en';
    i18n.changeLanguage(nextLang);
  };

  const openSearch = () => {
    setIsOpen(false);
    setIsSearchOpen(true);
  };

  const isLinkActive = (link: NavLink) => {
    if (link.href === '/') {
      return location.pathname === '/' && !location.hash;
    }

    if (link.href.startsWith('/#')) {
      const targetHash = link.href.slice(1);

      return location.pathname === '/' && location.hash === targetHash;
    }

    if (link.href === '/products') {
      return (
        location.pathname === '/products' ||
        location.pathname.startsWith('/products/')
      );
    }

    return location.pathname === link.href;
  };

  const accountPath = user
    ? user.role === 'CUSTOMER'
      ? '/dashboard'
      : '/admin/dashboard'
    : '/login';
  const notificationsPath = user ? '/notifications' : '/login';

  return (
    <header
      className={`fixed top-0 left-0 z-30 w-full transition-transform duration-300 ease-in-out ${
        isOpen || (isVisible && (!topHide || hasScrolled)) ? 'translate-y-0' : '-translate-y-full'
      } ${
        hasScrolled
          ? 'bg-[#e1d0bc]/58 backdrop-blur-md shadow-sm'
          : withBackground
            ? 'bg-[#e1d0bc]/70'
            : 'bg-transparent'
      }`}
    >
      <nav
        className={`${isOpen ? 'hidden md:flex' : 'relative flex'} w-full items-center justify-between bg-transparent px-5 py-4 md:px-8 md:py-3`}
      >
        <div className='flex items-center gap-3 md:hidden'>
          <button
            data-tour='mobile-menu'
            className='flex h-9 w-9 items-center justify-center text-dark-red transition-colors hover:text-gold'
            onClick={() => setIsOpen(!isOpen)}
            aria-label='Toggle menu'
          >
            {isOpen ? (
              <svg
                className='h-7 w-7'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.75}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            ) : (
              <svg
                className='h-7 w-7'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.6}
                  d='M3 6.75h18M3 12h18M3 17.25h18'
                />
              </svg>
            )}
          </button>

          <Link
            data-tour='mobile-account'
            to={accountPath}
            className='text-dark-red transition-colors hover:text-gold'
            aria-label='Account'
          >
            <img className='h-8 w-auto' src={profile} alt='Account' />
          </Link>
        </div>

        <span data-tour='logo' className='hidden md:block'>
          <Logo
            className='w-30!'
            onClick={() => {
              navigate('/');
            }}
          />
        </span>

        <button
          type='button'
          className='absolute left-1/2 md:top-3 -translate-x-1/2 md:hidden'
          onClick={() => navigate('/')}
          aria-label='Go to home'
        >
          <Logo className='w-[122px] max-w-none !-mt-1' />
        </button>

        <div className='flex items-center gap-3 md:hidden'>
          {user && (
            <Link
              to={notificationsPath}
              className='relative text-dark-red transition-colors hover:text-gold'
              aria-label='Notifications'
            >
              <Bell className='h-7 w-7' strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span className='absolute -right-2 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#3f060f] px-1 text-[11px] font-abee font-bold text-[#fdf8f0]'>
                  {unreadCount}
                </span>
              )}
            </Link>
          )}
          <button
            data-tour='mobile-search'
            type='button'
            className='text-dark-red transition-colors hover:text-gold'
            aria-label='Search'
            onClick={openSearch}
          >
            <img className='h-7 w-auto' src={scoopIcon} alt='Search' />
          </button>
          <button
            data-tour='mobile-cart'
            className='relative text-dark-red transition-colors hover:text-gold'
            aria-label='Cart'
            onClick={openCart}
          >
            <img className='h-7 w-auto' src={cartIcon} alt='Cart' />
            {totalItems > 0 && (
              <span className='absolute -right-2 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#3f060f] px-1 text-[11px] font-abee font-bold text-[#fdf8f0]'>
                {totalItems}
              </span>
            )}
          </button>
        </div>

        {/* Desktop Navigation */}
        <ul data-tour='nav-links' className='hidden md:flex items-center gap-x-14'>
          {navLinks.map((link) => (
            <li key={link.labelKey}>
              <a
                href={link.href}
                className={`whitespace-nowrap text-[22px] leading-[1.178] transition-colors testing ${
                  isLinkActive(link)
                    ? 'text-gold'
                    : 'text-dark-red hover:text-gold'
                } ${i18n.language === 'en' ? 'font-italic' : 'font-taviraj font-bold'}`}
              >
                {t(`header.${link.labelKey}`)}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop Icons */}
        <div className='hidden md:flex items-center gap-7'>
          <button
            data-tour='search'
            className='text-dark-red transition-colors hover:text-gold relative'
            aria-label='Search'
            onClick={openSearch}
          >
            <img className='size-6' src={scoopIcon} alt='Search' />
          </button>
          {user && (
            <Link
              to={notificationsPath}
              className='text-dark-red transition-colors hover:text-gold relative'
              aria-label='Notifications'
            >
              <Bell className='size-6' strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span className='absolute -top-1.5 -right-2 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-[#3f060f] text-[#fdf8f0] text-[11px] font-abee font-bold px-1'>
                  {unreadCount}
                </span>
              )}
            </Link>
          )}
          <button
            data-tour='cart'
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
            data-tour='account'
            to={accountPath}
            className='text-dark-red transition-colors hover:text-gold'
            aria-label='Account'
          >
            <img className='size-6' src={profile} alt='Account' />
          </Link>

          <button
            data-tour='lang-toggle'
            onClick={toggleLanguage}
            className='text-dark-red font-abee text-[20px] leading-[1.182] transition-colors hover:text-gold sm:text-[24px] cursor-pointer'
          >
            {t('header.lang')}
          </button>
        </div>
      </nav>

      {/* Premium search overlay (all viewports) */}
      <SearchOverlay
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className='absolute left-0 top-0 z-40 w-full border-t border-[#d2c2b5] bg-[white] shadow-md md:hidden'>
          <div className='flex items-center justify-between gap-4 px-5 py-6'>
            <button
              type='button'
              className='shrink-0'
              onClick={() => {
                setIsOpen(false);
                navigate('/');
              }}
              aria-label='Go to home'
            >
              <Logo className='w-[108px] max-w-none !-mt-2' />
            </button>

            <button
              type='button'
              onClick={openSearch}
              className='flex h-[34px] w-full max-w-[282px] items-center justify-between border border-[#ccbcb0] bg-transparent px-4 text-[14px] font-bona text-[#8c7878]'
              aria-label='Search products'
            >
              <span>Search products...</span>
              <img className='h-5 w-5' src={scoopIcon} alt='Search' />
            </button>
          </div>

          <ul className='flex flex-col'>
            {mobileMenuLinks.map((link) => {
              const isActive = isLinkActive(link);

              return (
                <li key={link.labelKey}>
                  <a
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex min-h-[58px] items-center px-4 text-[24px] leading-none transition-colors ${
                      isActive
                        ? 'bg-[#62000b] text-[#f3eadc]'
                        : 'bg-[#e7dcc9] text-dark-red hover:bg-[#dfd1be]'
                    } ${i18n.language === 'en' ? 'font-italic' : 'font-taviraj font-bold'}`}
                  >
                    {t(`header.${link.labelKey}`)}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
