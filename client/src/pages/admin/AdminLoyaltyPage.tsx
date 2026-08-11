import { useState } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '../../components/AdminLayout';
import { adjustCustomerPoints } from '../../services/adminService';
import type { LoyaltyCustomer } from '../../types/admin';
import { formatCurrency } from '../../utils/format';
import { useAdminLoyalty } from '../../hooks/useAdminLoyalty';
import toast from 'react-hot-toast';
import { Search, Loader2, ChevronRight, Users } from 'lucide-react';
import crown from '../../assets/crown.png';
export function AdminLoyaltyPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<string | undefined>(undefined);
  const { customers, isLoading, mutate } = useAdminLoyalty(appliedSearch);
  const [adjustingCustomerId, setAdjustingCustomerId] = useState<string | null>(
    null,
  );
  const [adjustPoints, setAdjustPoints] = useState<number>(0);
  const [adjustDescription, setAdjustDescription] = useState('');

  const topClients = [...customers]
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchQuery || undefined);
  };

  const handleAdjustPoints = async (customer: LoyaltyCustomer) => {
    if (adjustPoints === 0) {
      toast.error('Please enter a non-zero point amount');
      return;
    }

    try {
      setAdjustingCustomerId(customer.userId);
      await adjustCustomerPoints(
        customer.userId,
        adjustPoints,
        adjustDescription,
      );
      void mutate();
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
      <div className='py-5 w-full font-bona! text-black'>
        {/* Header */}
        <header className='mb-4  px-4 md:px-8 '>
          <h1 className='text-xl font-bold font-bona tracking-wide mb-1 text-black'>
            Admin Dashboard
          </h1>
          <p className='text-[11px] font-bona text-[#000000]/68 font-medium uppercase tracking-wider'>
            Manage your platform
          </p>
        </header>

        {/* Divider Line */}
        <div className='w-full h-[0.5px] bg-[#000000]/68 mb-6' />
        <main className='px-4 md:px-8 '>
          <div className='mb-6'>
            <h1 className='text-2xl md:text-3xl font-bold text-black mb-1'>
              Customers & Loyalty
            </h1>
            <p className='text-sm md:text-base text-[#000000]/68'>
              Manage customer points and identify your most valuable clients.
            </p>
          </div>

          {/* Top Clients Section */}
          <div className='mb-8 bg-[#D9D9D9]/34 rounded-2xl shadow-sm border border-dark-red p-6'>
            <div className='flex items-start gap-2 mb-4'>
              <div className=''>
                <svg
                  width='26'
                  height='32'
                  viewBox='0 0 26 32'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <g clip-path='url(#clip0_517_960)'>
                    <path
                      d='M3.6593 3.10833C3.54215 2.47546 3.42227 1.82918 3.29967 1.18559C3.14982 0.394507 3.46041 0.00566943 4.28322 0.00298779C10.1082 0.000306153 15.9359 0.000306153 21.761 0.00298779C22.5347 0.00298779 22.848 0.39987 22.7064 1.16146C22.5865 1.80773 22.4611 2.45401 22.3195 3.1995C23.0333 3.1995 23.6926 3.18609 24.352 3.20218C25.2565 3.22632 25.9512 3.83773 25.9867 4.69854C26.142 8.69418 25.0249 12.2366 22.0361 15.0604C21.3713 15.6879 20.6003 16.2269 19.8184 16.715C18.7095 17.4095 17.538 18.0021 16.4182 18.6779C16.2193 18.7986 16.0722 19.0936 16.0122 19.3349C15.5518 21.1906 16.3174 22.6923 17.4426 24.1002C18.2763 25.1434 19.2217 25.8701 20.6793 25.5885C20.9926 25.5268 21.3278 25.5778 21.652 25.5805C22.4802 25.5858 22.7418 25.8325 22.7472 26.637C22.7527 27.8518 22.7472 29.0639 22.7472 30.3833C23.0442 30.3833 23.3166 30.3672 23.5836 30.386C24.0659 30.4208 24.3601 30.6997 24.3547 31.1663C24.3492 31.6597 24.0468 31.9413 23.5319 31.9708C23.4229 31.9762 23.3166 31.9735 23.2077 31.9735C16.4073 31.9735 9.60691 31.9735 2.80653 31.9735C2.63216 31.9735 2.39785 32.0325 2.29977 31.9467C2.04912 31.7268 1.69493 31.4452 1.68948 31.1797C1.68403 30.9276 2.01915 30.5924 2.2916 30.4369C2.52591 30.3028 2.88009 30.3726 3.25607 30.3457C3.25607 29.1336 3.25607 27.9242 3.25607 26.7175C3.25607 25.8191 3.49583 25.5831 4.40037 25.5805C4.96434 25.5778 5.53104 25.5322 6.08957 25.5912C6.78432 25.6663 7.31015 25.4437 7.727 24.9181C8.33729 24.1485 9.05928 23.4352 9.517 22.5851C9.89571 21.8825 10.0428 21.0244 10.1382 20.2172C10.2335 19.4046 9.88208 18.8495 9.06473 18.3481C7.2938 17.2647 5.33215 16.4656 3.83095 14.9585C0.959313 12.0891 -0.146838 8.60569 0.0166325 4.66368C0.0493266 3.84846 0.763148 3.229 1.62137 3.20218C2.24801 3.18341 2.87737 3.19146 3.50401 3.18341C3.54215 3.18341 3.58029 3.14855 3.6593 3.10833ZM5.04608 1.65756C5.81439 5.78728 6.50369 9.85533 7.35374 13.8885C7.74062 15.7281 9.03204 16.9858 10.9283 17.38C11.9881 17.5999 13.1215 17.5919 14.2141 17.5329C16.4836 17.4122 18.2845 15.8166 18.7231 13.6123C19.1754 11.3383 19.5868 9.0562 20.0091 6.77681C20.3224 5.08738 20.6248 3.39794 20.9409 1.65488C15.6363 1.65756 10.3861 1.65756 5.04608 1.65756ZM4.92075 30.3431C10.3207 30.3431 15.6798 30.3431 21.0716 30.3431C21.0716 29.2919 21.0716 28.2809 21.0716 27.2404C15.6717 27.2404 10.3153 27.2404 4.92075 27.2404C4.92075 28.2943 4.92075 29.3053 4.92075 30.3431ZM16.8432 25.551C16.1294 24.6043 15.3175 23.714 14.729 22.7004C14.1187 21.6438 14.2304 20.4183 14.4347 19.2196C13.4376 19.2196 12.514 19.2196 11.5195 19.2196C12.2006 21.8718 11.0019 23.8133 8.96665 25.551C11.7402 25.551 14.3121 25.551 16.8432 25.551ZM5.76535 14.5241C5.68634 14.0762 5.64002 13.8054 5.59098 13.5372C5.07877 10.7805 4.56656 8.02109 4.04346 5.26436C4.01349 5.10615 3.87999 4.84871 3.78463 4.84335C3.08443 4.8058 2.38151 4.82457 1.65679 4.82457C1.52601 8.67809 2.66213 11.9014 5.76535 14.5241ZM24.3411 4.81117C23.7171 4.81117 23.1014 4.82189 22.4857 4.8058C22.1506 4.79776 22.0034 4.89162 21.938 5.25364C21.5757 7.32654 21.1806 9.39141 20.7965 11.459C20.6167 12.4243 20.4396 13.3897 20.2597 14.3551C23.3221 11.9014 24.48 8.68614 24.3411 4.81117Z'
                      fill='black'
                    />
                    <path
                      d='M10.2794 11.2145C10.2821 11.1716 10.274 11.126 10.2876 11.0885C10.6608 9.99707 10.2195 9.19795 9.42663 8.44172C8.80272 7.8464 9.03158 7.13577 9.90342 7.02046C11.0341 6.8676 11.7643 6.37954 12.241 5.33907C12.5898 4.57748 13.3363 4.62843 13.7967 5.34979C13.8185 5.38466 13.8458 5.4222 13.8621 5.45974C14.2245 6.401 14.9002 6.84615 15.9355 6.97219C17.0062 7.1009 17.2405 7.8169 16.4668 8.55703C15.7121 9.28108 15.4723 10.0346 15.6876 11.0563C15.8837 11.9842 15.2407 12.3918 14.3362 12.0137C14.1972 11.9547 14.0501 11.9064 13.9248 11.826C13.2954 11.4264 12.6797 11.4478 12.0531 11.842C11.8732 11.9547 11.6635 12.0298 11.4591 12.0968C10.7589 12.3247 10.2603 11.9493 10.2794 11.2145ZM13.794 9.86567C13.9602 9.38298 14.1482 8.83324 14.3008 8.39345C13.8512 8.06361 13.3935 7.73109 13.0121 7.44952C12.5816 7.75522 12.1048 8.09311 11.7125 8.36932C11.876 8.87615 12.0503 9.41248 12.1975 9.86567C12.7287 9.86567 13.2982 9.86567 13.794 9.86567Z'
                      fill='black'
                    />
                  </g>
                  <defs>
                    <clipPath id='clip0_517_960'>
                      <rect width='26' height='32' fill='white' />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <div>
                <h2 className='text-xl font-bold text-black'>Top Clients</h2>
                <p className='text-sm text-[#000000]/68'>
                  Your most valuable customers ranked by loyalty points.
                </p>
              </div>
            </div>

            {isLoading ? (
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
                    className='bg-[#EDE7DF] drop-shadow-lg drop-shadow-[#000000]/25 rounded-xl px-5 py-4 space-y-3 gap-3 border border-dark-red relative'
                  >
                    <header className='flex items-center justify-between mb-2'>
                      <div className='   font-badoni text-black text-sm px-2 py-1 rounded-md font-bold'>
                        <div className='flex items-center gap-3'>
                          <img src={crown} alt='crown' className='w-10 ' />

                          <span className='block'>VIP #{index + 1}</span>
                        </div>
                      </div>
                      <button
                        className='text-xs font-aboreto text-[#000000]/68 mb-1 cursor-pointer'
                        title={`Customer ID: ${customer.userId}. Click to copy.`}
                        onClick={() => {
                          window.navigator.clipboard.writeText(customer.userId);
                          toast.success('Customer ID copied to clipboard');
                        }}
                      >
                        {/* CL-{customer.userId.slice(0, 6).toUpperCase()} */}
                        {customer.userId.slice(0, 6).toUpperCase()}...
                        {customer.userId.slice(6, 12).toUpperCase()}
                      </button>
                    </header>
                    <div className='flex items-center gap-3 mb-3'>
                      <div className='w-12 h-12 rounded-full bg-[#D9D9D9] flex items-center justify-center text-black font-bona  text-lg'>
                        {customer.user.firstName.charAt(0)}
                        {customer.user.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className='font-semibold text-black! font-bona '>
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
                        <p className='font-aboreto  text-black text-lg'>
                          {customer.points.toLocaleString()}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-xs text-[#000000]/68'>Total spent</p>
                        <p className='font-aboreto text-lg text-black'>
                          {formatCurrency(customer.totalSpent, 'TND', true)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Loyalty Control Section */}
          <div className='bg-[#D9D9D9]/34 rounded-2xl shadow-sm border border-dark-red p-6'>
            <div className='flex flex-col md:flex-row gap-4 mb-6 items-center justify-between'>
              <div>
                <div className='flex items-center gap-2 mb-1'>
                  <Users />

                  <h2 className='text-xl font-bold text-black mb-1'>
                    Loyalty control
                  </h2>
                </div>
                <p className='text-sm text-[#000000]/68 uppercase tracking-wider'>
                  Manage points balance and view client profiles.
                </p>
              </div>
              <button className='bg-[#000000]/46 text-white px-6 py-2 rounded-xl font-semibold hover:bg-[#6D5A46]/80 transition'>
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
                  className='w-full pl-14 pr-6 py-4 rounded-2xl border border-dark-red bg-[#D9D9D9]/24 text-black placeholder:text-[#000000]/68  transition '
                />
              </div>
            </form>

            <div className='overflow-x-auto border border-dark-red rounded-2xl'>
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
                  {isLoading ? (
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
                            {/* <div className='w-10 h-10 rounded-full bg-dark-red flex items-center justify-center text-dark-red font-bold'>
                              {customer.user.firstName.charAt(0)}
                              {customer.user.lastName.charAt(0)}
                            </div> */}
                            <div>
                              <p className='font-semibold text-black'>
                                {customer.user.firstName}{' '}
                                {customer.user.lastName}
                              </p>
                              <p className='text-xs text-[#000000]/68'>
                                {customer.user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td
                          className='px-6 py-4 text-[#000000]/68 font-aboreto cursor-pointer'
                          title={`Customer ID: ${customer.userId}. Click to copy.`}
                          onClick={() => {
                            window.navigator.clipboard.writeText(
                              customer.userId,
                            );
                            toast.success('Customer ID copied to clipboard');
                          }}
                        >
                          {customer.userId.slice(0, 6).toUpperCase()}...
                          {customer.userId.slice(6, 12).toUpperCase()}
                        </td>
                        <td className='px-6 py-4'>
                          <span
                            className={`font-aboreto  ${
                              customer.points > 0
                                ? 'text-dark-red'
                                : 'text-black'
                            }`}
                          >
                            {customer.points.toLocaleString()} PTS
                          </span>
                        </td>
                        <td className='px-6 py-4 text-black font-aboreto'>
                          {formatCurrency(customer.totalSpent, 'TND', true)}
                        </td>
                        <td className='px-6 py-4'>
                          <div className='flex items-center gap-2'>
                            {adjustingCustomerId === customer.userId ? (
                              <div className='flex items-center gap-2'>
                                <input
                                  type='number'
                                  value={adjustPoints}
                                  onChange={(e) =>
                                    setAdjustPoints(
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                  placeholder='Points'
                                  className='w-24 px-2 font-aboreto py-1 rounded border border-dark-red bg-[#D9D9D9]/34 text-sm focus:outline-none'
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
                                {/* <button
                                  className='p-2 rounded-lg hover:bg-[#D5BD9D]/40 transition text-dark-red'
                                  title='View Profile'
                                >
                                  <Eye className='w-5 h-5' />
                                </button> */}
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
        </main>
      </div>
    </AdminLayout>
  );
}
