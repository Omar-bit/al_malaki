import React, { useState } from 'react';
import crown from '../assets/crown.png';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Trophy,
  Megaphone,
  Ticket,
  MessageSquare,
  BarChart,
  Plus,
  LogOut,
  Menu,
  X,
  StepBack,
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
      },
      {
        icon: Trophy,
        label: 'Top Clients',
        path: '/admin/top-clients',
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
      },
      {
        icon: Ticket,
        label: 'Promo Codes',
        path: '/admin/promo-codes',
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
      },
      {
        icon: BarChart,
        label: 'Product Analytics',
        path: '/admin/analytics',
      },
      {
        icon: Plus,
        label: 'Add products',
        path: '/admin/products/new',
      },
    ],
  },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [shouldShowAside, setShouldShowAside] = useState(true);

  // Close sidebar on route change on mobile
  React.useEffect(() => {
    setIsSidebarOpen(false);

    setShouldShowAside(location.pathname !== '/admin/management');
  }, [location.pathname]);

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
    <div className='flex h-screen bg-[#EFE0C9] font-bona! overflow-hidden'>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className='fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity'
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {shouldShowAside && (
        <aside
          className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#EFE0C9] bg-honeyPattern shadow-lg flex flex-col pt-5 transform transition-transform duration-300 ease-in-out  ${
            isSidebarOpen
              ? 'translate-x-0'
              : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Mobile close button */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className='absolute top-4 right-4 p-2 text-black md:hidden'
          >
            <X className='w-5 h-5' />
          </button>
          <div className='flex items-center gap-3 px-6 mb-5'>
            <Link
              to='/admin/management'
              className='text-base   tracking-widest  flex items-center gap-2 text-[#000000AD]! '
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
              <h2 className='text-base font-bold text-black tracking-wide capitalize font-bona! leading-tight'>
                {user ? `${user.firstName} ${user.lastName}` : 'Super Admin'}
              </h2>
              <div className='bg-dark-red text-white text-xs px-4 py-1.25 rounded-md flex mt-1 items-center gap-1 shadow-sm'>
                <img className='w-5 ' src={crown} alt='crown' />
                <span className='text-xs font-thin tracking-wide'>
                  {user?.role === 'ADMIN' ? 'Super Admin' : 'Admin'}
                </span>
              </div>
            </div>
          </div>

          <nav className='flex-1 overflow-y-auto px-4 custom-scrollbar space-y-3'>
            {sidebarMenu.map((section, idx) => (
              <div key={idx}>
                <h3 className='text-[12px] font-normal font-bona! text-[#000000AD]  tracking-widest px-2 mb-2 uppercase'>
                  {section.category}
                </h3>
                <ul className='space-y-1'>
                  {section.items.map((item, itemIdx) => (
                    <li key={itemIdx}>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                          location.pathname === item.path
                            ? 'bg-[#FCECD8] text-dark-red shadow-sm font-bold'
                            : 'text-black hover:bg-[#D5BD9D] hover:text-dark-red'
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
              className='flex items-center gap-3 px-3 py-2 w-full text-left text-[#6D5A46] hover:bg-[#D5BD9D] hover:text-dark-red rounded-xl transition-all duration-200'
            >
              <LogOut className='w-5 h-5' />
              <span className='text-md'>Logout</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div className='flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f7eee1]'>
        {/* Mobile Header */}
        <header className='md:hidden flex items-center justify-between p-4 bg-[#EFE0C9] shadow-sm z-30'>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className='p-1 text-black'
            >
              <Menu className='w-6 h-6' />
            </button>
            <span className='font-bold text-black tracking-wide'>
              Al Malaki Admin
            </span>
          </div>
          <img
            src={`https://ui-avatars.com/api/?name=${user?.firstName || 'Super'}+${user?.lastName || 'Admin'}&background=random`}
            alt={user?.firstName || 'Admin'}
            className='w-8 h-8 rounded-full shadow-sm'
          />
        </header>

        <main className='relative flex-1 overflow-y-auto p-4 md:p-0'>
          {!shouldShowAside && (
            <StepBack
              className='absolute cursor-pointer hover:opacity-70 top-3 left-3 text-white'
              onClick={() => navigate('/admin/dashboard')}
            />
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
