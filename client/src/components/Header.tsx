import { Logo } from './Logo';

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
  return (
    <header className='fixed top-0 left-0 w-full z-50 bg-transparent'>
      <nav className='max-w-[1512px] h-[105px] mx-auto px-[65px] flex items-start justify-between'>
        <Logo />

        <ul className='hidden md:flex items-center gap-[82px] absolute left-1/2 -translate-x-1/2 top-[38px]'>
          {navLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className='text-dark-red font-italic text-[24px] leading-[1.178] hover:text-gold transition-colors whitespace-nowrap'
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className='flex items-center gap-9 pt-[38px]'>
          <button
            className='text-dark-red hover:text-gold transition-colors'
            aria-label='Cart'
          >
            <svg
              width='37'
              height='35'
              viewBox='0 0 37 35'
              fill='none'
              stroke='#461218'
              strokeWidth='1.7'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M4 9h29l-2.7 18.3H6.7L4 9Z' />
              <path d='M11.3 9c0-4 2.9-7.2 7.2-7.2S25.7 5 25.7 9' />
            </svg>
          </button>
          <button
            className='text-dark-red hover:text-gold transition-colors'
            aria-label='Account'
          >
            <svg
              width='28'
              height='37'
              viewBox='0 0 28 37'
              fill='none'
              stroke='#461218'
              strokeWidth='1.7'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <circle cx='14' cy='9.3' r='7.5' />
              <path d='M2.1 35.2a11.9 11.9 0 0 1 23.8 0' />
            </svg>
          </button>
          <button className='text-dark-red font-abee text-[24px] leading-[1.182] hover:text-gold transition-colors'>
            En
          </button>
        </div>
      </nav>
    </header>
  );
}
