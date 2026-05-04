import React from 'react';
import { motion } from 'framer-motion';
import crown from '../assets/crown.png';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Trophy,
  Megaphone,
  Ticket,
  MessageSquare,
  BarChart,
  LogOut,
} from 'lucide-react';
import { authService } from '../services';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';

const sidebarMenu = [
  {
    category: 'OVERVIEW',
    items: [
      {
        icon: LayoutDashboard,
        label: 'Dashboard Overview',
        path: '/admin/dashboard',
        active: true,
      },
    ],
  },
  {
    category: 'SALES & ORDERS',
    items: [
      {
        icon: ShoppingCart,
        label: 'Orders Management',
        path: '/admin/orders',
        active: false,
      },
    ],
  },
  {
    category: 'CUSTOMERS & LOYALTY',
    items: [
      {
        icon: Users,
        label: 'Loyalty Control',
        path: '/admin/loyalty',
        active: false,
      },
      {
        icon: Trophy,
        label: 'Top Clients',
        path: '/admin/top-clients',
        active: false,
      },
    ],
  },
  {
    category: 'MARKETING & INFLUENCERS',
    items: [
      {
        icon: Megaphone,
        label: 'Influencer Tracking',
        path: '/admin/influencers',
        active: false,
      },
      {
        icon: Ticket,
        label: 'Promo Codes',
        path: '/admin/promo-codes',
        active: false,
      },
    ],
  },
  {
    category: 'MANAGEMENT & SETTINGS',
    items: [
      {
        icon: MessageSquare,
        label: 'Contact Messages',
        path: '/admin/messages',
        active: false,
      },
      {
        icon: BarChart,
        label: 'Product Analytics',
        path: '/admin/analytics',
        active: false,
      },
    ],
  },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      navigate('/login', { replace: true });
    } catch {
      setUser(null);
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className='flex h-screen bg-[#EFE0C9] font-bona!'>
      {/* Sidebar */}
      <aside className='w-64 bg-[#EFE0C9] shadow-lg flex flex-col pt-5'>
        <div className='flex items-center gap-3 px-6 mb-5'>
          <Link
            to='/'
            className='text-lg   tracking-widest  flex items-center gap-2 text-[#000000AD]!'
          >
            <span>&larr;</span> Admin Management
          </Link>
        </div>

        <div className='px-6 mb-5 flex items-center gap-4 gap-y-2 border-b pb-4 border-[#00000082] '>
          <img
            src={`https://ui-avatars.com/api/?name=${user?.firstName || 'Super'}+${user?.lastName || 'Admin'}&background=random`}
            alt={user?.firstName || 'Admin'}
            className='w-14 h-14 rounded-full '
          />
          <div>
            <h2 className='text-lg font-bold text-black tracking-wide capitalize font-bona! leading-tight'>
              {user ? `${user.firstName} ${user.lastName}` : 'Super Admin'}
            </h2>
            <div className='bg-dark-red text-white text-xs px-4 py-[5px] rounded-md flex  mt-1 items-center gap-1 shadow-sm'>
              <img className='w-7 ' src={crown} alt='crown' />
              <span className='text-md font-thin tracking-wide'>
                {user?.role === 'ADMIN' ? 'Super Admin' : 'Admin'}
              </span>
            </div>
          </div>
        </div>

        <nav className='flex-1 overflow-y-auto px-4 custom-scrollbar space-y-3'>
          {sidebarMenu.map((section, idx) => (
            <div key={idx}>
              <h3 className='text-[11px] font-semibold font-bona! text-[#000000AD]  tracking-widest px-2 mb-2 uppercase'>
                {section.category}
              </h3>
              <ul className='space-y-1'>
                {section.items.map((item, itemIdx) => (
                  <li key={itemIdx}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                        item.active
                          ? 'bg-[#FCECD8] text-[#3f060f] shadow-sm font-bold'
                          : 'text-black hover:bg-[#D5BD9D] hover:text-[#3f060f]'
                      }`}
                    >
                      <item.icon className='w-5 h-5' />
                      <span className='text-md'>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className='p-2 mt-auto'>
          <button
            onClick={handleLogout}
            className='flex items-center gap-3 px-3 py-2 w-full text-left text-[#6D5A46] hover:bg-[#D5BD9D] hover:text-[#3f060f] rounded-xl transition-all duration-200'
          >
            <LogOut className='w-5 h-5' />
            <span className='text-md'>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className='flex-1 overflow-y-auto bg-[#f7eee1]'>{children}</main>
    </div>
  );
}
