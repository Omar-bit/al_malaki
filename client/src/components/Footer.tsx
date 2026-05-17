import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { Phone, Mail } from 'lucide-react';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 448 512" 
    fill="currentColor"
    className={className}
  >
    <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export function Footer() {
  return (
    <footer className='w-full bg-dark-red py-12 px-6 md:px-16 mt-10 md:mt-16'>
      <div className='max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8'>
        
        {/* Column 1: Logo & Tagline */}
        <div className='flex flex-col items-start'>
          <Logo className='w-36 mb-6' />
          <p className='text-cream text-lg font-abhaya tracking-wide'>
            Pure honey, crafted by nature
          </p>
        </div>

        {/* Column 2: Quick Links */}
        <div className='flex flex-col'>
          <h3 className='text-gold font-bold mb-6 font-abee tracking-widest text-lg uppercase'>Quick Links</h3>
          <ul className='flex flex-col space-y-4'>
            <li><Link to='/' className='text-cream hover:text-gold transition-colors font-abhaya text-xl'>Home</Link></li>
            <li><Link to='/products' className='text-cream hover:text-gold transition-colors font-abhaya text-xl'>Shop</Link></li>
            <li><Link to='/about' className='text-cream hover:text-gold transition-colors font-abhaya text-xl'>About</Link></li>
            <li><Link to='/contact' className='text-cream hover:text-gold transition-colors font-abhaya text-xl'>Contact</Link></li>
          </ul>
        </div>

        {/* Column 3: Customer Area */}
        <div className='flex flex-col'>
          <h3 className='text-gold font-bold mb-6 font-abee tracking-widest text-lg uppercase'>Customer Area</h3>
          <ul className='flex flex-col space-y-4'>
            <li><Link to='/profile' className='text-cream hover:text-gold transition-colors font-abhaya text-xl'>My account</Link></li>
            <li><Link to='/track-order' className='text-cream hover:text-gold transition-colors font-abhaya text-xl'>Track Order</Link></li>
            <li><Link to='/rewards' className='text-cream hover:text-gold transition-colors font-abhaya text-xl'>Rewards</Link></li>
          </ul>
        </div>

        {/* Column 4: Contact & Socials */}
        <div className='flex flex-col'>
          <h3 className='text-gold font-bold mb-6 font-abee tracking-widest text-lg uppercase'>Contact</h3>
          <div className='flex flex-col space-y-4 mb-8'>
            <a href='tel:97530057' className='flex items-center text-cream hover:text-gold transition-colors font-abhaya text-xl'>
              <Phone className='w-5 h-5 mr-3' />
              97 530 057
            </a>
            <a href='mailto:almalaki97530@gmail.com' className='flex items-center text-cream hover:text-gold transition-colors font-abhaya text-xl'>
              <Mail className='w-5 h-5 mr-3' />
              almalaki97530@gmail.com
            </a>
          </div>

          <h3 className='text-gold font-bold mb-6 font-abee tracking-widest text-lg uppercase'>Follow</h3>
          <div className='flex flex-col space-y-4'>
            <a href='https://instagram.com/al.malaki_' target='_blank' rel='noopener noreferrer' className='flex items-center text-cream hover:text-gold transition-colors font-abhaya text-xl'>
              <InstagramIcon className='w-5 h-5 mr-3' />
              al.malaki_
            </a>
            <a href='https://tiktok.com/@al.malaki_' target='_blank' rel='noopener noreferrer' className='flex items-center text-cream hover:text-gold transition-colors font-abhaya text-xl'>
              <TikTokIcon className='w-5 h-5 mr-3' />
              al.malaki_
            </a>
            <a href='https://facebook.com/al.malaki_' target='_blank' rel='noopener noreferrer' className='flex items-center text-cream hover:text-gold transition-colors font-abhaya text-xl'>
              <FacebookIcon className='w-5 h-5 mr-3' />
              al.malaki_
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
