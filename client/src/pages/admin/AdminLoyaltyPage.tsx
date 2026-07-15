import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '../../components/AdminLayout';
import {
  getLoyaltyCustomers,
  adjustCustomerPoints,
} from '../../services/adminService';
import type { LoyaltyCustomer } from '../../types/admin';
import { formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';
import { Search, Loader2, Eye, ChevronRight } from 'lucide-react';

export function AdminLoyaltyPage() {
  const [customers, setCustomers] = useState<LoyaltyCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [adjustingCustomerId, setAdjustingCustomerId] = useState<string | null>(
    null,
  );
  const [adjustPoints, setAdjustPoints] = useState<number>(0);
  const [adjustDescription, setAdjustDescription] = useState('');

  const fetchCustomers = useCallback(async (search?: string) => {
    try {
      setLoading(true);
      const data = await getLoyaltyCustomers(search);
      setCustomers(data);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get top clients sorted by points descending and take top 3
  const topClients = [...customers]
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(searchQuery);
  };

  const handleAdjustPoints = async (customer: LoyaltyCustomer) => {
    if (adjustPoints === 0) {
      toast.error('Please enter a non-zero point amount');
      return;
    }

    try {
      setAdjustingCustomerId(customer.userId);
      const updated = await adjustCustomerPoints(
        customer.userId,
        adjustPoints,
        adjustDescription,
      );
      setCustomers((prev) =>
        prev.map((c) => (c.userId === updated.userId ? updated : c)),
      );
      setAdjustPoints(0);
      setAdjustDescription('');
      setAdjustingCustomerId(null);
      toast.success('Points adjusted successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to adjust points');
    } finally {
      setAdjustingCustomerId(null);
    }
  };

  return (
    <AdminLayout>
      <div className='px-4 md:px-8 py-5 w-full font-bona!'>
        <div className='mb-6'>
          <h1 className='text-2xl md:text-3xl font-bold text-black mb-1'>
            Customers & Loyalty
          </h1>
          <p className='text-sm md:text-base text-[#000000]/68'>
            Manage customer points and identify your most valuable clients.
          </p>
        </div>

        {/* Top Clients Section */}
        <div className='mb-8 bg-[#D9D9D9]/34 rounded-2xl shadow-sm border border-[#3F060F]/40 p-6'>
          <div className='flex items-center gap-2 mb-4'>
            <div className='bg-dark-red p-2 rounded-full'>
              <svg
                className='w-5 h-5 text-white'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'
                />
              </svg>
            </div>
            <div>
              <h2 className='text-xl font-bold text-black'>Top Clients</h2>
              <p className='text-sm text-[#000000]/68'>
                Your most valuable customers ranked by loyalty points.
              </p>
            </div>
          </div>

          {loading ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='w-8 h-8 animate-spin text-dark-red' />
            </div>
          ) : topClients.length === 0 ? (
            <div className='text-center py-8 text-[#6D5A46]'>
              No top clients yet
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {topClients.map((customer, index) => (
                <div
                  key={customer.userId}
                  className='bg-[#EDE7DF] rounded-xl p-5 border border-[#3F060F]/30 relative'
                >
                  <div className='absolute top-3 right-3 bg-dark-red text-white text-xs px-2 py-1 rounded-md font-bold'>
                    VIP #{index + 1}
                  </div>
                  <div className='text-xs text-[#000000]/68 mb-1'>
                    CL-{customer.userId.slice(0, 6).toUpperCase()}
                  </div>
                  <div className='flex items-center gap-3 mb-3'>
                    <div className='w-12 h-12 rounded-full bg-[#3F060F]/20 flex items-center justify-center text-dark-red font-bold text-lg'>
                      {customer.user.firstName.charAt(0)}
                      {customer.user.lastName.charAt(0)}
                    </div>
                    <div>
                      <p className='font-semibold text-black'>
                        {customer.user.firstName} {customer.user.lastName}
                      </p>
                      <p className='text-xs text-[#000000]/68'>
                        Loyalty member
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center justify-between gap-4'>
                    <div>
                      <p className='text-xs text-[#000000]/68'>Points</p>
                      <p className='font-aboreto font-bold text-dark-red text-lg'>
                        {customer.points.toLocaleString()}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='text-xs text-[#000000]/68'>Total spent</p>
                      <p className='font-aboreto font-semibold text-black'>
                        {formatCurrency(customer.totalSpent, 'USD')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Loyalty Control Section */}
        <div className='bg-[#D9D9D9]/34 rounded-2xl shadow-sm border border-[#3F060F]/40 p-6'>
          <div className='flex flex-col md:flex-row gap-4 mb-6 items-center justify-between'>
            <div>
              <h2 className='text-xl font-bold text-black mb-1'>
                Loyalty control
              </h2>
              <p className='text-sm text-[#000000]/68 uppercase tracking-wider'>
                Manage points balance and view client profiles.
              </p>
            </div>
            <button className='bg-[#6D5A46] text-white px-6 py-2 rounded-xl font-semibold hover:bg-[#6D5A46]/80 transition'>
              Export
            </button>
          </div>

          <form onSubmit={handleSearch} className='mb-6'>
            <div className='relative max-w-md'>
              <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[#6D5A46]' />
              <input
                type='text'
                placeholder='Search by name or matricule'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-14 pr-6 py-4 rounded-2xl border-2 border-[#3F060F] bg-[#EDE7DF] text-black placeholder:text-[#000000]/68 focus:outline-none focus:ring-2 focus:ring-dark-red/40 transition text-sm'
              />
            </div>
          </form>

          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-[#D9D9D9]/50'>
                <tr>
                  <th className='px-6 py-4 text-left text-sm font-bold text-[#000000]/68 font-bona!'>
                    Client Name
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-bold text-[#000000]/68 font-bona!'>
                    Matricule
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-bold text-[#000000]/68 font-bona!'>
                    Total Points
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-bold text-[#000000]/68 font-bona!'>
                    Total Purchases (TND)
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-bold text-[#000000]/68 font-bona!'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className='px-6 py-12 text-center'>
                      <Loader2 className='w-8 h-8 animate-spin mx-auto text-dark-red' />
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className='px-6 py-12 text-center text-[#6D5A46]'
                    >
                      No customers found
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <motion.tr
                      key={customer.userId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='border-b border-[#000000]/51 hover:bg-[#D5BD9D]/20 transition-colors'
                    >
                      <td className='px-6 py-4'>
                        <div className='flex items-center gap-3'>
                          <div className='w-10 h-10 rounded-full bg-[#3F060F]/20 flex items-center justify-center text-dark-red font-bold'>
                            {customer.user.firstName.charAt(0)}
                            {customer.user.lastName.charAt(0)}
                          </div>
                          <div>
                            <p className='font-semibold text-black'>
                              {customer.user.firstName} {customer.user.lastName}
                            </p>
                            <p className='text-xs text-[#000000]/68'>
                              {customer.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4 text-black font-aboreto'>
                        CL-{customer.userId.slice(0, 6).toUpperCase()}
                      </td>
                      <td className='px-6 py-4'>
                        <span
                          className={`font-aboreto font-semibold ${
                            customer.points > 0
                              ? 'text-dark-red'
                              : 'text-[#6D5A46]'
                          }`}
                        >
                          {customer.points.toLocaleString()} PTS
                        </span>
                      </td>
                      <td className='px-6 py-4 text-black font-aboreto'>
                        {formatCurrency(customer.totalSpent, 'USD')}
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center gap-2'>
                          {adjustingCustomerId === customer.userId ? (
                            <div className='flex items-center gap-2'>
                              <input
                                type='number'
                                value={adjustPoints}
                                onChange={(e) =>
                                  setAdjustPoints(parseInt(e.target.value) || 0)
                                }
                                placeholder='Points'
                                className='w-24 px-2 py-1 rounded border border-[#3F060F]/30 bg-[#D9D9D9]/34 text-sm focus:outline-none'
                              />
                              <button
                                onClick={() => handleAdjustPoints(customer)}
                                className='px-3 py-1 bg-dark-red text-white rounded text-sm font-semibold hover:bg-dark-red/90 transition'
                              >
                                Apply
                              </button>
                              <button
                                onClick={() => {
                                  setAdjustingCustomerId(null);
                                  setAdjustPoints(0);
                                  setAdjustDescription('');
                                }}
                                className='px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm font-semibold hover:bg-gray-400 transition'
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  setAdjustingCustomerId(customer.userId)
                                }
                                className='p-2 rounded-lg hover:bg-[#D5BD9D]/40 transition text-dark-red'
                                title='Adjust Points'
                              >
                                <ChevronRight className='w-5 h-5' />
                              </button>
                              <button
                                className='p-2 rounded-lg hover:bg-[#D5BD9D]/40 transition text-dark-red'
                                title='View Profile'
                              >
                                <Eye className='w-5 h-5' />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
