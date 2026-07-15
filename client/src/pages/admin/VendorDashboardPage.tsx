import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Users, Mail, Ticket } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { useAuth } from '../../contexts';
import {
  getVendorDashboardStats,
  type VendorDashboardStats,
} from '../../services/adminService';

/* ─── Stat Card ─────────────────────────────────────────────────────────── */
interface DashStatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  subtitle?: string;
}

function DashStatCard({ label, value, icon, subtitle }: DashStatCardProps) {
  return (
    <div className='flex-1 min-w-0 bg-[#D9D9D9]/34 border border-dark-red rounded-2xl px-5 py-4 flex flex-col gap-1 shadow-sm'>
      <div className='flex items-center justify-between'>
        <span className='text-lg font-medium text-black font-bona'>
          {label}
        </span>
        <span className='text-black p-2 rounded-full flex items-center justify-center bg-[#D9D9D9]'>
          {icon}
        </span>
      </div>
      <span className='text-lg font-bold text-black font-aboreto leading-tight'>
        {value}
      </span>
      {subtitle && (
        <span className='text-xs text-[#8a6a4e] font-bona'>{subtitle}</span>
      )}
    </div>
  );
}

/* ─── Task Row ────────────────────────────────────────────────────────────── */
interface TaskRowProps {
  text: string;
  tag: string;
  tagPath: string;
}

function TaskRow({ text, tag, tagPath }: TaskRowProps) {
  const navigate = useNavigate();
  return (
    <div className='flex items-center justify-between py-3 border-b border-[#d6c0a8]/60 last:border-0'>
      <div className='flex items-center gap-2 text-sm text-[#1a0a05] font-bona'>
        <span className='w-2 h-2 rounded-full bg-[#1a0a05] shrink-0 mt-0.5' />
        <span>{text}</span>
      </div>
      <button
        onClick={() => navigate(tagPath)}
        className='shrink-0 ml-3 text-xs font-medium bg-[#D9D9D9] hover:bg-[#C9B49A] text-black px-3 py-1 rounded-lg transition-colors font-bona'
      >
        {tag}
      </button>
    </div>
  );
}

/* ─── Access Item ─────────────────────────────────────────────────────────── */
interface AccessItemProps {
  text: string;
  active: boolean;
}

function AccessItem({ text, active }: AccessItemProps) {
  return (
    <div className='flex items-start gap-2 py-2'>
      <span
        className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${
          active ? 'bg-[#4a7c59]' : 'bg-[#b0b0b0]'
        }`}
      />
      <span className='text-sm text-[#2a1a0a] font-bona leading-snug'>
        {text}
      </span>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */

export function VendorDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<VendorDashboardStats>({
    ordersToday: 0,
    topClients: 0,
    newMessages: 0,
    activePromos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVendorDashboardStats()
      .then(setStats)
      .catch(() => {
        /* silently use defaults */
      })
      .finally(() => setLoading(false));
  }, []);

  const tasks: TaskRowProps[] = [
    {
      text: `Reply to ${stats.newMessages || 3} unread contact messages`,
      tag: 'Messages',
      tagPath: '/admin/messages',
    },
    {
      text: "Review today's order fulfillment",
      tag: 'Orders',
      tagPath: '/admin/orders',
    },
    {
      text: 'Check influencer campaign performance',
      tag: 'Marketing',
      tagPath: '/admin/promo-codes',
    },
    {
      text: 'Update product analytics report',
      tag: 'Analytics',
      tagPath: '/admin/analytics',
    },
  ];

  return (
    <AdminLayout>
      <div className='px-5 md:px-8 py-5 w-full font-bona!'>
        {/* ── Header ── */}
        <header className='mb-6'>
          <p className='text-sm font-medium text-[#6D5A46] mb-0.5'>
            Team Member Dashboard
          </p>
          <h1 className='text-2xl md:text-3xl font-bold text-[#1a0a05] mb-1'>
            Welcome back, {user?.firstName ?? 'Team Member'}
          </h1>
          <p className='text-sm text-[#6D5A46]'>
            Here&apos;s a snapshot of your operational tasks for today.
          </p>
        </header>

        {/* ── Stat Cards Row ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className='flex gap-3 flex-wrap mb-7'
        >
          <DashStatCard
            label='Orders Today'
            value={loading ? '—' : stats.ordersToday}
            icon={<ShoppingBag className='w-5 h-5' />}
          />
          <DashStatCard
            label='Top Clients'
            value={loading ? '—' : stats.topClients}
            icon={<Users className='w-5 h-5' />}
          />
          <DashStatCard
            label='New Messages'
            value={loading ? '—' : stats.newMessages}
            icon={<Mail className='w-5 h-5' />}
          />
          <DashStatCard
            label='Active Promos'
            value={loading ? '—' : stats.activePromos}
            icon={<Ticket className='w-5 h-5' />}
            subtitle='View only'
          />
        </motion.div>

        {/* ── Two-column section ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className='flex flex-col md:flex-row gap-4'
        >
          {/* Today's Tasks */}
          <div className='flex-1 bg-[#D9D9D9]/57 border border-dark-red rounded-2xl p-5 shadow-sm'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-base font-bold text-[#1a0a05] font-bona'>
                Today&apos;s Tasks
              </h2>
              <span className='text-xs font-semibold bg-[#D9D9D9] text-black px-3 py-1 rounded-full font-bona'>
                {tasks.length} pending
              </span>
            </div>
            <div className='space-y-0'>
              {tasks.map((task, i) => (
                <TaskRow key={i} {...task} />
              ))}
            </div>
          </div>

          {/* Your Access */}
          <div className='w-full md:w-72 bg-[#D9D9D9]/34 border border-dark-red rounded-2xl p-5 shadow-sm'>
            <h2 className='text-base font-bold text-[#1a0a05] font-bona mb-1'>
              Your Access
            </h2>
            <p className='text-xs text-[#6D5A46] font-bona mb-3'>
              What you can do with your role
            </p>
            <div className='space-y-0'>
              <AccessItem active text='Manage orders &amp; view top clients' />
              <AccessItem active text='Track influencers, view promo codes' />
              <AccessItem
                active
                text='Reply to contact messages &amp; view analytics'
              />
              <AccessItem
                active={false}
                text='No access to admin management, loyalty control, or activity history'
              />
            </div>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
