import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Logo } from './Logo';
import { SearchOverlay } from './SearchOverlay';
import { MaskIcon } from './ui/MaskIcon';
import { useCart } from '../contexts/CartContext';
import { useAuth, useNotifications } from '../contexts';
import cartIcon from '../assets/cart.svg';
import scoopIcon from '../assets/scoop.svg';
import profile from '../assets/profile.svg';
type NavLink = {
  labelKey: string;
  href: string;
};

const flagIcons: Record<string, ReactElement> = {
  en: (
    <svg viewBox='0 0 24 16' className='h-3 w-4 shrink-0' aria-hidden='true'>
      <rect width='24' height='16' fill='#B22234' />
      {[1, 3, 5, 7, 9, 11].map((i) => (
        <rect
          key={i}
          y={i * (16 / 13)}
          width='24'
          height={16 / 13}
          fill='#fff'
        />
      ))}
      <rect width='10' height={16 * (7 / 13)} fill='#3C3B6E' />
    </svg>
  ),
  fr: (
    <svg viewBox='0 0 24 16' className='h-3 w-4 shrink-0' aria-hidden='true'>
      <rect width='24' height='16' fill='#fff' />
      <rect width='8' height='16' fill='#0055A4' />
      <rect x='16' width='8' height='16' fill='#EF4135' />
    </svg>
  ),
  ar: (
    <svg viewBox='0 0 24 16' className='h-3 w-4 shrink-0' aria-hidden='true'>
      <rect width='24' height='16' fill='#E70013' />
      <circle cx='12' cy='8' r='5' fill='#fff' />
      <circle cx='11.6' cy='8' r='3.4' fill='#E70013' />
      <circle cx='12.6' cy='8' r='2.8' fill='#fff' />
      <polygon
        fill='#E70013'
        points='13.10,6.30 13.50,7.45 14.72,7.47 13.75,8.21 14.10,9.38 13.10,8.68 12.10,9.38 12.45,8.21 11.48,7.47 12.70,7.45'
      />
    </svg>
  ),
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

  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isMobileLangOpen, setIsMobileLangOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const mobileLangMenuRef = useRef<HTMLDivElement>(null);

  const languages: { code: string; label: string }[] = [
    { code: 'en', label: 'En' },
    { code: 'fr', label: 'Fr' },
    { code: 'ar', label: 'Ar' },
  ];

  const selectLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setIsLangOpen(false);
    setIsMobileLangOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        langMenuRef.current &&
        !langMenuRef.current.contains(event.target as Node)
      ) {
        setIsLangOpen(false);
      }

      if (
        mobileLangMenuRef.current &&
        !mobileLangMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileLangOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const openSearch = () => {
    setIsOpen(false);
    setIsMobileLangOpen(false);
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
        isOpen || (isVisible && (!topHide || hasScrolled))
          ? 'translate-y-0'
          : '-translate-y-full'
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
            className='group text-dark-red transition-colors hover:text-gold'
            aria-label='Account'
          >
            <MaskIcon
              src={profile}
              className='h-8 w-auto aspect-[28/37] text-[#461218] transition-colors group-hover:text-gold'
            />
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
            className='group text-dark-red transition-colors hover:text-gold'
            aria-label='Search'
            onClick={openSearch}
          >
            <MaskIcon
              src={scoopIcon}
              className='h-7 w-auto aspect-[35/36] text-[#461218] transition-colors group-hover:text-gold'
            />
          </button>
          <button
            data-tour='mobile-cart'
            className='group relative text-dark-red transition-colors hover:text-gold'
            aria-label='Cart'
            onClick={openCart}
          >
            <MaskIcon
              src={cartIcon}
              className='h-7 w-auto aspect-[41/38] text-[#461218] transition-colors group-hover:text-gold'
            />
            {totalItems > 0 && (
              <span className='absolute -right-2 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#3f060f] px-1 text-[11px] font-abee font-bold text-[#fdf8f0]'>
                {totalItems}
              </span>
            )}
          </button>
        </div>

        {/* Desktop Navigation */}
        <ul
          data-tour='nav-links'
          className='hidden md:flex items-center gap-x-16'
        >
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
        <div className='hidden md:flex items-center gap-7 '>
          <button
            data-tour='search'
            className='group text-dark-red transition-colors hover:text-gold relative'
            aria-label='Search'
            onClick={openSearch}
          >
            <MaskIcon
              src={scoopIcon}
              className='size-6 text-[#461218] transition-colors group-hover:text-gold'
            />
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
            className='group text-dark-red transition-colors hover:text-gold relative'
            aria-label='Cart'
            onClick={openCart}
          >
            <MaskIcon
              src={cartIcon}
              className='size-6 text-[#461218] transition-colors group-hover:text-gold'
            />
            {totalItems > 0 && (
              <span className='absolute -top-1.5 -right-2 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-[#3f060f] text-[#fdf8f0] text-[11px] font-abee font-bold px-1'>
                {totalItems}
              </span>
            )}
          </button>
          <Link
            data-tour='account'
            to={accountPath}
            className='group text-dark-red transition-colors hover:text-gold'
            aria-label='Account'
          >
            <MaskIcon
              src={profile}
              className='size-6 text-[#461218] transition-colors group-hover:text-gold'
            />
          </Link>

          <div data-tour='lang-toggle' className='relative' ref={langMenuRef}>
            <button
              type='button'
              onClick={() => setIsLangOpen((prev) => !prev)}
              className='text-dark-red font-abee text-[20px] leading-[1.182] transition-colors hover:text-gold sm:text-[24px] cursor-pointer'
              aria-haspopup='listbox'
              aria-expanded={isLangOpen}
            >
              <span className='inline-flex items-center gap-1.5'>
                {/* {flagIcons[i18n.language] ?? flagIcons.en} */}
                {languages.find((lang) => lang.code === i18n.language)?.label ??
                  'En'}
              </span>
            </button>

            {isLangOpen && (
              <ul
                role='listbox'
                className='absolute right-0 top-full z-50 mt-2 min-w-[64px] rounded-md border border-[#d2c2b5] bg-white py-1 shadow-md'
              >
                {languages.map((lang) => (
                  <li key={lang.code}>
                    <button
                      type='button'
                      role='option'
                      aria-selected={i18n.language === lang.code}
                      onClick={() => selectLanguage(lang.code)}
                      className={`flex w-full items-center gap-1.5 px-4 py-1.5 text-left font-abee text-[18px] transition-colors hover:bg-[#f3eadc] hover:text-gold ${
                        i18n.language === lang.code
                          ? 'text-gold'
                          : 'text-dark-red'
                      }`}
                    >
                      {flagIcons[lang.code]}
                      {lang.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
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

            <div className='relative shrink-0' ref={mobileLangMenuRef}>
              <button
                type='button'
                onClick={() => setIsMobileLangOpen((prev) => !prev)}
                className='flex h-[34px] items-center gap-1.5 border border-[#ccbcb0] bg-transparent px-3 font-abee text-[14px] text-dark-red transition-colors hover:text-gold'
                aria-haspopup='listbox'
                aria-expanded={isMobileLangOpen}
                aria-label='Change language'
              >
                {flagIcons[i18n.language] ?? flagIcons.en}
                {languages.find((lang) => lang.code === i18n.language)?.label ??
                  'En'}
              </button>

              {isMobileLangOpen && (
                <ul
                  role='listbox'
                  className='absolute right-0 top-full z-50 mt-1 min-w-[84px] border border-[#ccbcb0] bg-white py-1 shadow-md'
                >
                  {languages.map((lang) => (
                    <li key={lang.code}>
                      <button
                        type='button'
                        role='option'
                        aria-selected={i18n.language === lang.code}
                        onClick={() => selectLanguage(lang.code)}
                        className={`flex w-full items-center gap-1.5 px-3 py-1.5 text-left font-abee text-[14px] transition-colors hover:bg-[#f3eadc] hover:text-gold ${
                          i18n.language === lang.code
                            ? 'text-gold'
                            : 'text-dark-red'
                        }`}
                      >
                        {flagIcons[lang.code]}
                        {lang.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
