import React, { useRef, useState, useEffect } from 'react';
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
  Bell,
  History,
  ChevronLeft,
  Camera,
  Loader2,
} from 'lucide-react';
import { authService } from '../services';
import { useNavigate } from 'react-router-dom';
import { useAuth, useNotifications } from '../contexts';
import { avatarUrl } from '../utils/url';
import toast from 'react-hot-toast';

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
        path: '/admin/loyalty',
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
        icon: History,
        label: 'Activity History',
        path: '/admin/history',
      },
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

// ── Profile Modal ─────────────────────────────────────────────────────────────

function AdminProfileModal({ onClose }: { onClose: () => void }) {
  const { user, setUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const avatarSrc = avatarUrl(
    user?.profilePicture,
    user?.firstName,
    user?.lastName,
  );

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { url } = await authService.uploadProfilePicture(file);
      const updated = await authService.updateProfile({ profilePicture: url });
      setUser(updated);
      toast.success('Profile picture updated');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    setIsSaving(true);
    try {
      const updated = await authService.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
      });
      setUser(updated);
      toast.success('Profile saved');
      onClose();
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className='fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4'
    >
      <div className='relative w-full max-w-md rounded-2xl bg-[#fdf8f0] shadow-2xl p-8'>
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-[#6d5a46] hover:text-dark-red transition'
          aria-label='Close'
        >
          <X className='w-5 h-5' />
        </button>

        <h2 className='text-xl font-bold text-black font-bona mb-6'>
          My Profile
        </h2>

        {/* Avatar */}
        <div className='flex justify-center mb-6'>
          <div className='relative'>
            <img
              src={avatarSrc}
              alt='Profile'
              className='w-24 h-24 rounded-full object-cover border-2 border-dark-red'
            />
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className='absolute bottom-0 right-0 w-8 h-8 rounded-full bg-dark-red text-white flex items-center justify-center shadow hover:bg-dark-red/80 transition disabled:opacity-60'
              aria-label='Change photo'
            >
              {isUploading ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <Camera className='w-4 h-4' />
              )}
            </button>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              className='hidden'
              onChange={handleImageChange}
            />
          </div>
        </div>

        {/* Role badge */}
        <div className='flex justify-center mb-6'>
          <div className='bg-dark-red text-white text-xs px-4 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm'>
            <img className='w-4' src={crown} alt='crown' />
            <span className='tracking-wide'>
              {user?.role === 'ADMIN'
                ? 'Super Admin'
                : user?.role === 'VENDOR'
                  ? 'Vendor'
                  : 'Admin'}
            </span>
          </div>
        </div>

        {/* Fields */}
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-bona text-[#3f060f] mb-1'>
              First name
            </label>
            <input
              type='text'
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className='w-full rounded-lg border border-[#d4bfa8] bg-white px-3 py-2 text-sm font-bona text-[#3f060f] outline-none focus:border-[#3f060f] focus:ring-1 focus:ring-[#3f060f]/20 transition'
            />
          </div>
          <div>
            <label className='block text-sm font-bona text-[#3f060f] mb-1'>
              Last name
            </label>
            <input
              type='text'
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className='w-full rounded-lg border border-[#d4bfa8] bg-white px-3 py-2 text-sm font-bona text-[#3f060f] outline-none focus:border-[#3f060f] focus:ring-1 focus:ring-[#3f060f]/20 transition'
            />
          </div>
          <div>
            <label className='block text-sm font-bona text-[#3f060f] mb-1'>
              Email
            </label>
            <input
              type='email'
              value={user?.email ?? ''}
              readOnly
              className='w-full rounded-lg border border-[#d4bfa8] bg-[#f0e8dc] px-3 py-2 text-sm font-bona text-[#3f060f] outline-none cursor-not-allowed opacity-70'
            />
          </div>
        </div>

        <div className='mt-6 flex gap-3'>
          <button
            onClick={onClose}
            className='flex-1 rounded-xl border border-[#d4bfa8] py-2 text-sm font-bona text-[#6d5a46] hover:bg-[#f0e8dc] transition'
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className='flex-1 rounded-xl bg-dark-red py-2 text-sm font-bona text-white hover:bg-dark-red/90 transition disabled:opacity-60'
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [shouldShowAside, setShouldShowAside] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Close sidebar on route change on mobile
  useEffect(() => {
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

  const avatarSrc = avatarUrl(
    user?.profilePicture,
    user?.firstName || 'Super',
    user?.lastName || 'Admin',
  );

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
          className={`fixed md:static inset-y-0 left-0 z-50 w-64 ${isCollapsed ? 'md:w-16' : 'md:w-64'} bg-[#EFE0C9] bg-honeyPattern shadow-lg flex flex-col pt-5 transform transition-all duration-300 ease-in-out ${
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

          {user?.role === 'ADMIN' && (
            <div className={`flex items-center gap-3 mb-5 ${isCollapsed ? 'md:px-1' : 'px-6'}`}>
              <Link
                to='/admin/management'
                className={`text-base tracking-widest flex items-center gap-2 text-[#000000AD]! ${isCollapsed ? 'md:justify-center md:gap-0 w-full' : ''}`}
              >
                <span>&larr;</span>{' '}
                <span className={isCollapsed ? 'md:hidden' : ''}>Admin Management</span>
              </Link>
            </div>
          )}

          {/* Clickable user area → profile modal */}
          <button
            type='button'
            onClick={() => setIsProfileOpen(true)}
            className={`mb-5 flex items-center gap-4 gap-y-2 border-b pb-4 border-[#00000082] w-full text-left hover:bg-[#D5BD9D]/30 transition rounded-sm ${isCollapsed ? 'md:px-1 md:justify-center' : 'px-6'}`}
          >
            <div className='relative shrink-0'>
              <img
                src={avatarSrc}
                alt={user?.firstName || 'Admin'}
                className='w-14 h-14 rounded-full object-cover'
              />
              <span className='absolute bottom-0 right-0 w-4 h-4 rounded-full bg-dark-red border-2 border-[#EFE0C9] flex items-center justify-center'>
                <Camera className='w-2.5 h-2.5 text-white' />
              </span>
            </div>
            <div className={`${isCollapsed ? 'md:hidden' : ''}`}>
              <h2 className='text-base font-bold text-black tracking-wide capitalize font-bona! leading-tight'>
                {user ? `${user.firstName} ${user.lastName}` : 'User'}
              </h2>
              <div className='bg-dark-red text-white text-xs px-4 py-1.25 rounded-md flex mt-1 items-center gap-1 shadow-sm'>
                <img className='w-5' src={crown} alt='crown' />
                <span className='text-xs font-thin tracking-wide'>
                  {user?.role === 'ADMIN'
                    ? 'Super Admin'
                    : user?.role === 'VENDOR'
                      ? 'Vendor'
                      : 'Admin'}
                </span>
              </div>
              <Link
                to='/notifications'
                onClick={(e) => e.stopPropagation()}
                className='mt-2 inline-flex items-center gap-2 rounded-full border border-[#3F060F]/15 bg-[#fcecd8] px-3 py-1.5 text-xs font-semibold text-[#3f060f] transition hover:bg-[#f5dfc4]'
              >
                <Bell className='h-4 w-4' />
                Notifications
                {unreadCount > 0 && (
                  <span className='flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#3f060f] px-1 text-[10px] font-bold text-[#fdf8f0]'>
                    {unreadCount}
                  </span>
                )}
              </Link>
            </div>
          </button>

          <nav className='flex-1 overflow-y-auto px-4 custom-scrollbar space-y-3'>
            {sidebarMenu
              .filter((section) => section.items.length > 0)
              .map((section, idx) => (
                <div key={idx}>
                  <h3
                    className={`text-[12px] font-normal font-bona! text-[#000000AD] tracking-widest px-2 mb-2 uppercase ${isCollapsed ? 'md:hidden' : ''}`}
                  >
                    {section.category}
                  </h3>
                  <ul className='space-y-1'>
                    {section.items.map((item, itemIdx) => (
                      <li key={itemIdx}>
                        <Link
                          to={item.path}
                          className={`flex items-center gap-3 px-3 py-2 w-full rounded-xl transition-all duration-200 ${
                            location.pathname === item.path
                              ? 'bg-[#FCECD8] text-dark-red shadow-sm font-bold'
                              : 'text-black hover:bg-[#D5BD9D] hover:text-dark-red'
                          } ${isCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''}`}
                        >
                          <item.icon className='w-5 h-5 shrink-0' />
                          <span className={`text-md ${isCollapsed ? 'md:hidden' : ''}`}>
                            {item.path === '/admin/dashboard' && user?.role === 'VENDOR'
                              ? 'My Dashboard'
                              : item.label}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </nav>

          <div className='p-2 mt-auto space-y-1'>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`hidden md:flex items-center gap-3 px-3 py-2 w-full text-left text-[#6D5A46] hover:bg-[#D5BD9D] hover:text-dark-red rounded-xl transition-all duration-200 ${isCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''}`}
            >
              <ChevronLeft
                className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
              />
              <span className={`text-md ${isCollapsed ? 'md:hidden' : ''}`}>
                {isCollapsed ? 'Expand' : 'Collapse'}
              </span>
            </button>
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 px-3 py-2 w-full text-left text-[#6D5A46] hover:bg-[#D5BD9D] hover:text-dark-red rounded-xl transition-all duration-200 ${isCollapsed ? 'md:justify-center md:px-0 md:gap-0' : ''}`}
            >
              <LogOut className='w-5 h-5 shrink-0' />
              <span className={`text-md ${isCollapsed ? 'md:hidden' : ''}`}>Logout</span>
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
          <div className='flex items-center gap-3'>
            <Link
              to='/notifications'
              className='relative text-black'
              aria-label='Notifications'
            >
              <Bell className='h-5 w-5' />
              {unreadCount > 0 && (
                <span className='absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#3f060f] px-1 text-[10px] font-bold text-[#fdf8f0]'>
                  {unreadCount}
                </span>
              )}
            </Link>
            <button
              type='button'
              onClick={() => setIsProfileOpen(true)}
              className='relative'
              aria-label='My profile'
            >
              <img
                src={avatarSrc}
                alt={user?.firstName || 'Admin'}
                className='w-8 h-8 rounded-full shadow-sm object-cover'
              />
            </button>
          </div>
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

      {isProfileOpen && <AdminProfileModal onClose={() => setIsProfileOpen(false)} />}
    </div>
  );
}
