import { useState } from 'react';
import { Logo } from './Logo';
import cart from '../assets/cart.svg';
import profile from '../assets/profile.svg';
type NavLink = {
  label: string;
  href: string;
};

const navLinks: NavLink[] = [
  { label: 'Home', href: '#home' },
  { label: 'About us', href: '#about' },
  { label: 'Products', href: '#products' },
  { label: 'Customize pack', href: '#customize' },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className='relative top-0 left-0 z-30 w-full p-4 md:p-0'>
      <nav className=' flex w-full items-center justify-between test bg-[#E0CFBB]'>
        <Logo />

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
        <ul className='hidden md:flex items-center gap-20 '>
          {navLinks.map((link) => (
            <li key={link.label} className=''>
              <a
                href={link.href}
                className='whitespace-nowrap text-dark-red text-[24px] leading-[1.178] transition-colors hover:text-gold font-italic testing'
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop Icons */}
        <div className='hidden md:flex items-center gap-10 '>
          <button
            className='text-dark-red transition-colors hover:text-gold'
            aria-label='Cart'
          >
            <img src={cart} alt='Cart' />
          </button>
          <button
            className='text-dark-red transition-colors hover:text-gold'
            aria-label='Account'
          >
            <img src={profile} alt='Account' />
          </button>

          <button className='text-dark-red font-abee text-[20px] leading-[1.182] transition-colors hover:text-gold sm:text-[24px]'>
            En
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className='absolute top-full left-0 w-full bg-[#E0CFBB] flex flex-col items-center py-6 shadow-md md:hidden z-40 gap-6 border-t border-[#d9c7b3]'>
          <ul className='flex flex-col items-center gap-6'>
            {navLinks.map((link) => (
              <li key={link.label} className=''>
                <a
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className='whitespace-nowrap text-dark-red text-[24px] leading-[1.178] transition-colors hover:text-gold font-italic'
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className='flex items-center gap-10 mt-4'>
            <button
              className='text-dark-red transition-colors hover:text-gold'
              aria-label='Cart'
            >
              <img src={cart} alt='Cart' />
            </button>
            <button
              className='text-dark-red transition-colors hover:text-gold'
              aria-label='Account'
            >
              <img src={profile} alt='Account' />
            </button>
            <button className='text-dark-red font-abee text-[24px] leading-[1.182] transition-colors hover:text-gold'>
              En
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
