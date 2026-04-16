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
  return (
    <header className=' top-0 left-0 z-30 w-full  '>
      <nav className=' flex  w-full  items-center justify-between test bg-[#E0CFBB]  '>
        <Logo />

        <ul className='flex items-center gap-20 '>
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

        <div className='flex items-center gap-10 '>
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
    </header>
  );
}
