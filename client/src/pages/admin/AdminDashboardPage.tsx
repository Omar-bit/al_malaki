import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ShoppingBag, Users, Calendar, Sparkles } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { useAuth } from '../../contexts';
import { VendorDashboardPage } from './VendorDashboardPage';
import { getAdminDashboardStats } from '../../services/adminService';
import type {
  AdminDashboardStats,
  DashboardChartPoint,
} from '../../types/admin';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
  Legend,
);

// Helper to format date as "MAY 19TH, 2026"
function formatDisplayDate(date: Date): string {
  const months = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  let suffix = 'TH';
  if (day === 1 || day === 21 || day === 31) suffix = 'ST';
  else if (day === 2 || day === 22) suffix = 'ND';
  else if (day === 3 || day === 23) suffix = 'RD';

  return `${month} ${day}${suffix}, ${year}`;
}

// 1. Revenue Overtime Area Chart
function RevenueAreaChart({ data }: { data: DashboardChartPoint[] }) {
  if (!data || data.length === 0) return null;

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        fill: true,
        label: 'Revenue (TND)',
        data: data.map((d) => d.revenue),
        borderColor: '#3F060F',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom,
          );
          gradient.addColorStop(0, 'rgba(63, 6, 15, 0.25)');
          gradient.addColorStop(1, 'rgba(63, 6, 15, 0.0)');
          return gradient;
        },
        borderWidth: 2.5,
        pointBackgroundColor: '#EFE7DC',
        pointBorderColor: '#3F060F',
        pointBorderWidth: 1.5,
        pointRadius: 3,
        pointHoverRadius: 5.5,
        pointHoverBackgroundColor: '#3F060F',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#3F060F',
        titleColor: '#D5BD9D',
        bodyColor: '#fff',
        titleFont: { size: 9, family: 'sans-serif', weight: 400 as const },
        bodyFont: { size: 12, family: 'sans-serif', weight: 600 as const },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function (context: any) {
            return context.parsed.y.toLocaleString() + ' TND';
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: {
          color: 'rgba(109, 90, 70, 0.7)',
          font: { size: 10, family: 'sans-serif', weight: 600 },
          maxTicksLimit: 8,
        },
      },
      y: {
        grid: {
          color: '#6D5A46',
          borderDash: [4, 4],
          lineWidth: 0.5,
          drawBorder: false,
        },
        ticks: {
          color: '#6D5A46',
          font: { size: 10, family: 'sans-serif', weight: 600 },
          maxTicksLimit: 5,
          callback: function (value: any) {
            if (value >= 1000)
              return (value / 1000).toFixed(1).replace('.0', '') + 'k';
            return value;
          },
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className='relative w-full h-[220px] select-none'>
      <Line data={chartData} options={options} />
    </div>
  );
}

// 2. Orders Over Time Bar Chart
function OrdersBarChart({ data }: { data: DashboardChartPoint[] }) {
  if (!data || data.length === 0) return null;

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: 'Orders',
        data: data.map((d) => d.orders),
        backgroundColor: '#6D5A46',
        hoverBackgroundColor: '#3F060F',
        borderRadius: 3,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#3F060F',
        titleColor: '#D5BD9D',
        bodyColor: '#fff',
        titleFont: { size: 8, family: 'sans-serif', weight: 400 as const },
        bodyFont: { size: 10, family: 'sans-serif', weight: 600 as const },
        padding: 8,
        cornerRadius: 4,
        displayColors: false,
        callbacks: {
          label: function (context: any) {
            return context.parsed.y + ' Orders';
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: {
          color: 'rgba(109, 90, 70, 0.7)',
          font: { size: 9, family: 'sans-serif', weight: 600 },
          maxTicksLimit: 5,
        },
      },
      y: {
        grid: {
          color: 'rgba(109, 90, 70, 0.3)',
          borderDash: [3, 3],
          lineWidth: 0.5,
          drawBorder: false,
        },
        ticks: { display: false },
        border: { display: false },
      },
    },
  };

  return (
    <div className='relative w-full h-[150px] select-none'>
      <Bar data={chartData} options={options} />
    </div>
  );
}

// 3. New Users Over Time Line Chart
function UsersLineChart({ data }: { data: DashboardChartPoint[] }) {
  if (!data || data.length === 0) return null;

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: 'New Users',
        data: data.map((d) => d.users),
        borderColor: '#BE9D61',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointBackgroundColor: '#EFE7DC',
        pointBorderColor: '#BE9D61',
        pointBorderWidth: 1.5,
        pointRadius: 2.5,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#BE9D61',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#3F060F',
        titleColor: '#D5BD9D',
        bodyColor: '#fff',
        titleFont: { size: 8, family: 'sans-serif', weight: 400 as const },
        bodyFont: { size: 10, family: 'sans-serif', weight: 600 as const },
        padding: 8,
        cornerRadius: 4,
        displayColors: false,
        callbacks: {
          label: function (context: any) {
            return context.parsed.y + ' New Users';
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: {
          color: 'rgba(109, 90, 70, 0.7)',
          font: { size: 9, family: 'sans-serif', weight: 600 },
          maxTicksLimit: 5,
        },
      },
      y: {
        grid: {
          color: 'rgba(109, 90, 70, 0.3)',
          borderDash: [3, 3],
          lineWidth: 0.5,
          drawBorder: false,
        },
        ticks: { display: false },
        border: { display: false },
      },
    },
  };

  return (
    <div className='relative w-full h-[150px] select-none'>
      <Line data={chartData} options={options} />
    </div>
  );
}

export function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>(
    'month',
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    getAdminDashboardStats(period, selectedDate)
      .then(setStats)
      .catch(() => {
        /* silently use defaults */
      })
      .finally(() => setLoading(false));
  }, [period, selectedDate]);

  if (user?.role === 'VENDOR') {
    return <VendorDashboardPage />;
  }

  const periodOptions: ('day' | 'week' | 'month' | 'year')[] = [
    'day',
    'week',
    'month',
    'year',
  ];

  return (
    <AdminLayout>
      <div className=' py-6 w-full font-bona bg-[#f7eee1] min-h-screen text-black '>
        {/* Header */}
        <header className='mb-4 px-4'>
          <h1 className='text-xl font-bold font-bona tracking-wide mb-1'>
            Admin Dashboard
          </h1>
          <p className='text-[11px] font-bona text-[#000000]/68 font-medium uppercase tracking-wider'>
            Manage your platform
          </p>
        </header>

        {/* Divider Line */}
        <div className='w-full h-[0.5px] bg-[#000000]/68 mb-6' />

        <main className='px-4'>
          {/* Section Heading & Subtext */}
          <div className='mb-6'>
            <h2 className='text-xl font-bold font-bona tracking-wide mb-1'>
              Dashboard Overview
            </h2>
            <p className='text-xs font-bona text-[#000000]/68  uppercase tracking-wider'>
              Key metrics and performance at a glance.
            </p>
          </div>

          {/* Controls Container (Date & Timeframe) */}
          <div className='bg-[#D9D9D9]/34 border border-dark-red rounded-3xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm'>
            {/* Custom Styled Date Selector */}
            <div
              onClick={() => dateInputRef.current?.showPicker()}
              className='relative flex items-center bg-[#EDE7DF] hover:bg-[#DDD2C4] transition-colors rounded-xl px-4 py-2 border border-dark-red cursor-pointer text-xs font-aboreto font-bold uppercase tracking-wider text-black'
            >
              <Calendar className='w-4 h-4 mr-2 text-black' />
              <span>{formatDisplayDate(new Date(selectedDate))}</span>
              <input
                ref={dateInputRef}
                type='date'
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className='absolute w-0 h-0 opacity-0 pointer-events-none'
                style={{ visibility: 'hidden' }}
              />
            </div>

            {/* Timeframe Segmented Selector */}
            <div className='flex border border-dark-red rounded-xl overflow-hidden bg-transparent'>
              {periodOptions.map((opt) => {
                const isActive = period === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setPeriod(opt)}
                    className={`px-4 py-2 text-md font-bona  font-bold capitalize transition-all duration-200 border-r border-dark-red last:border-r-0 bg-[#EDE7DF] ${
                      isActive
                        ? ' text-black text-lg font-extrabold shadow-inner'
                        : 'text-[#000000]/68 hover:bg-[#DCCFB9]/40 bg-transparent'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className='flex items-center justify-center h-96'>
              <Loader2 className='w-10 h-10 animate-spin text-black' />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className='space-y-6'
            >
              {/* Metric Cards Grid */}
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                {/* Card 1: Total Revenue */}
                <div className='bg-[#D9D9D9]/34 rounded-3xl p-5 border border-dark-red shadow-sm transition-transform duration-300 hover:scale-[1.01]'>
                  <div className='flex items-center justify-between mb-3'>
                    <span className='font-bona! text-lg uppercase tracking-wider text-black'>
                      Total Revenue
                    </span>
                    <span className='text-xs font-bold w-7 h-7 rounded-full bg-[#D9D9D9]  flex items-center justify-center text-black shadow-sm select-none'>
                      DT
                    </span>
                  </div>
                  <h3 className='text-xl font-aboreto font-medium text-black [-webkit-text-stroke:0.5px_black]'>
                    {stats?.revenue.formattedValue || '0 TND'}
                  </h3>
                  <p
                    className={`text-[10px] font-abee font-bold mt-1 flex items-center ${
                      stats?.revenue.isPositive ? 'text-black' : 'text-red-700'
                    }`}
                  >
                    <span className='mr-1'>
                      {stats?.revenue.isPositive ? '↗' : '↘'}{' '}
                      {stats ? Math.abs(stats.revenue.trend) : 0}%
                    </span>
                    <span className='text-[#000000]/68 font-abee'>
                      vs. last period
                    </span>
                  </p>
                </div>

                {/* Card 2: Total Orders */}
                <div className='bg-[#D9D9D9]/34 rounded-3xl p-5 border border-dark-red shadow-sm transition-transform duration-300 hover:scale-[1.01]'>
                  <div className='flex items-center justify-between mb-3'>
                    <span className='font-bona! text-lg uppercase tracking-wider text-black'>
                      Total orders
                    </span>
                    <span className='w-7 h-7 rounded-full bg-[#D9D9D9]  flex items-center justify-center text-black shadow-sm'>
                      <ShoppingBag className='w-3.5 h-3.5' />
                    </span>
                  </div>
                  <h3 className='text-xl font-aboreto font-medium text-black [-webkit-text-stroke:0.5px_black]'>
                    {stats?.orders.formattedValue || '0'}
                  </h3>
                  <p
                    className={`text-[10px] font-sans font-bold mt-1 flex items-center ${
                      stats?.orders.isPositive ? 'text-black' : 'text-red-700'
                    }`}
                  >
                    <span className='mr-1'>
                      {stats?.orders.isPositive ? '↗' : '↘'}{' '}
                      {stats ? Math.abs(stats.orders.trend) : 0}%
                    </span>
                    <span className='text-[#000000]/68 font-abee'>
                      vs. last period
                    </span>
                  </p>
                </div>

                {/* Card 3: Total Users */}
                <div className='bg-[#D9D9D9]/34 rounded-3xl p-5 border border-dark-red shadow-sm transition-transform duration-300 hover:scale-[1.01]'>
                  <div className='flex items-center justify-between mb-3'>
                    <span className='font-bona! text-lg uppercase tracking-wider text-black'>
                      Total users
                    </span>
                    <span className='w-7 h-7 rounded-full bg-[#D9D9D9]  flex items-center justify-center text-black shadow-sm'>
                      <Users className='w-3.5 h-3.5' />
                    </span>
                  </div>
                  <h3 className='text-xl font-aboreto font-medium text-black [-webkit-text-stroke:0.5px_black]'>
                    {stats?.users.formattedValue || '0'}
                  </h3>
                  <p
                    className={`text-[10px] font-sans font-bold mt-1 flex items-center ${
                      stats?.users.isPositive ? 'text-black' : 'text-red-700'
                    }`}
                  >
                    <span className='mr-1'>
                      {stats?.users.isPositive ? '↗' : '↘'}{' '}
                      {stats ? Math.abs(stats.users.trend) : 0}%
                    </span>
                    <span className='text-[#000000]/68 font-abee'>
                      vs. last period
                    </span>
                  </p>
                </div>

                {/* Card 4: Total Points */}
                <div className='bg-[#D9D9D9]/34 rounded-3xl p-5 border border-dark-red shadow-sm transition-transform duration-300 hover:scale-[1.01]'>
                  <div className='flex items-center justify-between mb-3'>
                    <span className='font-bona! text-lg uppercase tracking-wider text-black'>
                      Total points
                    </span>
                    <span className='w-7 h-7 rounded-full bg-[#D9D9D9]  flex items-center justify-center text-black shadow-sm'>
                      <Sparkles className='w-3.5 h-3.5' />
                    </span>
                  </div>
                  <h3 className='text-xl font-aboreto font-medium text-black [-webkit-text-stroke:0.5px_black]'>
                    {stats?.points.formattedValue || '0 PTS'}
                  </h3>
                  <p
                    className={`text-[10px] font-sans font-bold mt-1 flex items-center ${
                      stats?.points.isPositive ? 'text-black' : 'text-red-700'
                    }`}
                  >
                    <span className='mr-1'>
                      {stats?.points.isPositive ? '↗' : '↘'}{' '}
                      {stats ? Math.abs(stats.points.trend) : 0}%
                    </span>
                    <span className='text-[#000000]/68 font-abee'>
                      vs. last period
                    </span>
                  </p>
                </div>
              </div>

              {/* Revenue Overtime Large Chart Card */}
              <div className='bg-[#D9D9D9]/34 rounded-3xl p-5 border border-dark-red shadow-sm'>
                <h3 className='text-lg font-bold font-bona text-black mb-4'>
                  Revenue overtime
                </h3>
                {stats && stats.chartData.length > 0 ? (
                  <RevenueAreaChart data={stats.chartData} />
                ) : (
                  <div className='w-full h-[220px] flex items-center justify-center text-[#A68F74] bg-[#f7eee1]/40 rounded-2xl border border-dashed border-[#3F060F]/30'>
                    No sales data for this period
                  </div>
                )}
              </div>

              {/* Bottom Two Charts Grid */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Chart: Orders Over Time */}
                <div className='bg-[#D9D9D9]/34 rounded-3xl p-5 border border-dark-red shadow-sm'>
                  <h3 className='text-lg font-bold font-bona text-black mb-4'>
                    Orders over time
                  </h3>
                  {stats && stats.chartData.length > 0 ? (
                    <OrdersBarChart data={stats.chartData} />
                  ) : (
                    <div className='w-full h-[150px] flex items-center justify-center text-[#A68F74] bg-[#f7eee1]/40 rounded-2xl border border-dashed border-[#3F060F]/30'>
                      No orders data for this period
                    </div>
                  )}
                </div>

                {/* Chart: New Users Over Time */}
                <div className='bg-[#D9D9D9]/34 rounded-3xl p-5 border border-dark-red shadow-sm'>
                  <h3 className='text-lg font-bold font-bona text-black mb-4'>
                    New users over time
                  </h3>
                  {stats && stats.chartData.length > 0 ? (
                    <UsersLineChart data={stats.chartData} />
                  ) : (
                    <div className='w-full h-[150px] flex items-center justify-center text-[#A68F74] bg-[#f7eee1]/40 rounded-2xl border border-dashed border-[#3F060F]/30'>
                      No new users data for this period
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </AdminLayout>
  );
}
