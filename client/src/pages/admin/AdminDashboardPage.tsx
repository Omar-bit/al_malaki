import React from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '../../components/AdminLayout';
import { useAuth } from '../../contexts';

export function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <AdminLayout>
      <div className='p-8 md:p-12 pl-12 max-w-6xl'>
        <header className='mb-10'>
          <p className='text-sm font-medium text-[#6D5A46] uppercase tracking-wide mb-1'>
            Dashboard Overview
          </p>
          <h1 className='text-3xl font-bold text-[#3f060f] mb-3'>
            Welcome back, {user ? user.firstName : 'Super Admin'}
          </h1>

          <p className='text-[#6D5A46]'>
            Here's what's happening across your store today.
          </p>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='grid grid-cols-1 md:grid-cols-4 gap-6'
        >
          {/* Top Stats Cards */}
          <div className='bg-[#EAD5BA] rounded-3xl p-6 shadow-sm border border-[#D5BD9D]/40 h-32 flex flex-col justify-between hover:shadow-md transition-shadow'>
            <h3 className='text-[#3f060f] font-semibold text-lg'>
              Total Sales
            </h3>
            <div className='mt-auto text-2xl font-bold text-[#3f060f]'>--</div>
          </div>

          <div className='bg-[#EAD5BA] rounded-3xl p-6 shadow-sm border border-[#D5BD9D]/40 h-32 flex flex-col justify-between hover:shadow-md transition-shadow'>
            <h3 className='text-[#3f060f] font-semibold text-lg'>Orders</h3>
            <div className='mt-auto text-2xl font-bold text-[#3f060f]'>--</div>
          </div>

          <div className='bg-[#EAD5BA] rounded-3xl p-6 shadow-sm border border-[#D5BD9D]/40 h-32 flex flex-col justify-between hover:shadow-md transition-shadow'>
            <h3 className='text-[#3f060f] font-semibold text-lg'>Customers</h3>
            <div className='mt-auto text-2xl font-bold text-[#3f060f]'>--</div>
          </div>

          <div className='bg-[#EAD5BA] rounded-3xl p-6 shadow-sm border border-[#D5BD9D]/40 h-32 flex flex-col justify-between hover:shadow-md transition-shadow'>
            <h3 className='text-[#3f060f] font-semibold text-lg'>Conversion</h3>
            <div className='mt-auto text-2xl font-bold text-[#3f060f]'>--</div>
          </div>

          {/* Charts/Big Sections */}
          <div className='col-span-1 md:col-span-3 bg-[#EAD5BA] rounded-3xl p-6 shadow-sm border border-[#D5BD9D]/40 h-[380px] relative'>
            <div className='flex justify-between items-center mb-6'>
              <h3 className='text-[#3f060f] font-semibold text-lg'>
                Sales Overview
              </h3>
              <span className='text-xs uppercase tracking-widest text-[#A68F74] font-bold'>
                Last 7 Days
              </span>
            </div>
            {/* Chart Placeholder */}
            <div className='w-full h-[80%] flex items-center justify-center text-[#A68F74] bg-[#D5BD9D]/20 rounded-2xl border border-dashed border-[#D5BD9D]/50'>
              Chart Data Placeholder
            </div>
          </div>

          <div className='col-span-1 md:col-span-1 bg-[#EAD5BA] rounded-3xl p-6 shadow-sm border border-[#D5BD9D]/40 h-[380px]'>
            <h3 className='text-[#3f060f] font-semibold text-lg mb-6'>
              Recent Activity
            </h3>
            {/* Activity Placeholder */}
            <div className='w-full h-[80%] flex items-center justify-center text-[#A68F74] bg-[#D5BD9D]/20 rounded-2xl border border-dashed border-[#D5BD9D]/50'>
              No recent activity
            </div>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
