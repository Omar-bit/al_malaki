import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Copy,
  Filter,
  Loader2,
  Plus,
  Search,
  UsersRound,
  X,
} from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { useAuth } from '../../contexts';
import { influencerTrackingService } from '../../services';
import type {
  CreateInfluencerTrackingPayload,
  InfluencerTrackingItem,
} from '../../types';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '../../components/ui';
import { formatCurrency } from '../../utils/format';

const INITIAL_FORM: CreateInfluencerTrackingPayload = {
  influencerName: '',
  influencerHandle: '',
  destinationPath: '/',
  notes: '',
};

export function AdminInfluencerTrackingPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<InfluencerTrackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'disabled'
  >('all');
  const [sortBy, setSortBy] = useState<
    | 'createdAt'
    | 'influencerName'
    | 'clicks'
    | 'accountsCreated'
    | 'orders'
    | 'revenue'
    | 'conversionRate'
  >('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [form, setForm] =
    useState<CreateInfluencerTrackingPayload>(INITIAL_FORM);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      const result = await influencerTrackingService.getInfluencerTrackingLinks(
        {
          search: search || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          sortBy,
          sortOrder,
        },
      );
      setItems(result);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load influencer performance.');
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, sortOrder, statusFilter]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.influencerName?.trim()) {
      toast.error('Influencer name is required.');
      return;
    }

    setCreating(true);

    try {
      await influencerTrackingService.createInfluencerTrackingLink({
        influencerName: form.influencerName.trim(),
        influencerHandle: form.influencerHandle?.trim() || undefined,
        destinationPath: form.destinationPath?.trim() || '/',
        notes: form.notes?.trim() || undefined,
      });
      toast.success('Tracking link created successfully.');
      setForm(INITIAL_FORM);
      setIsCreateModalOpen(false);
      setLoading(true);
      await loadItems();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to create tracking link.',
      );
    } finally {
      setCreating(false);
    }
  };

  const handleSort = (column: typeof sortBy) => {
    setLoading(true);
    setSortBy((prev) => {
      if (prev === column) {
        setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortOrder('desc');
      return column;
    });
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Tracking link copied.');
    } catch {
      toast.error('Unable to copy tracking link.');
    }
  };

  return (
    <AdminLayout>
      <div className='py-4 w-full font-bona! text-black'>
        {/* Header */}
        <header className='mb-4  px-4 md:px-6 '>
          <h1 className='text-xl font-bold font-bona tracking-wide mb-1 text-black'>
            Admin Dashboard
          </h1>
          <p className='text-[11px] font-bona text-[#000000]/68 font-medium uppercase tracking-wider'>
            Manage your platform
          </p>
        </header>
        {/* Divider Line */}
        <div className='w-full h-[0.5px] bg-[#000000]/68 mb-6' />

        <main className='px-4 md:px-6 '>
          <div className='mb-6'>
            <h1 className='text-2xl md:text-3xl font-bold text-black mb-1'>
              Marketing &amp; Influencers
            </h1>
            <p className='text-sm md:text-base text-[#000000]/68'>
              Track influencer performance and manage promotional campaigns.
            </p>
          </div>

          <section className='rounded-[28px] border border-dark-red bg-[#e3e0db] px-4 py-5  md:px-5 min-h-[60vh]'>
            <div className='mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
              <div>
                <div className='flex items-center gap-2'>
                  <svg
                    width='38'
                    height='30'
                    viewBox='0 0 38 30'
                    fill='none'
                    className='size-7 '
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <g clipPath='url(#clip0_474_410)'>
                      <path
                        d='M18.9995 29.9613C17.2643 29.9613 15.524 30.0293 13.7888 29.9467C11.3964 29.835 9.42507 27.8188 9.39427 25.5451C9.3686 23.869 9.36346 22.188 9.39427 20.5119C9.46614 16.1735 13.3524 12.3014 17.906 11.8399C22.8755 11.3346 27.5164 14.5459 28.4251 19.1953C28.5431 19.7977 28.5791 20.4245 28.5894 21.0366C28.615 22.4212 28.6048 23.8058 28.5996 25.1905C28.5894 28.018 26.5307 29.971 23.5377 29.9905C22.0233 30.0002 20.5088 29.9905 18.9944 29.9905C18.9995 29.9856 18.9995 29.971 18.9995 29.9613ZM19.02 28.499C20.5858 28.499 22.1516 28.499 23.7174 28.499C23.7688 28.499 23.8201 28.499 23.8714 28.499C25.3756 28.4552 26.6796 27.4107 26.962 26.0115C27.0133 25.7394 27.0492 25.4625 27.0441 25.1905C27.0133 23.3346 27.1673 21.4593 26.8952 19.6374C26.3151 15.7945 22.5367 12.9184 18.0703 13.3265C14.2149 13.6811 10.9755 17.0382 10.9498 20.8471C10.9395 22.3289 10.9447 23.8107 10.9498 25.2925C10.9601 27.1435 12.3718 28.4941 14.3329 28.5038C15.8885 28.5087 17.4543 28.499 19.02 28.499Z'
                        fill='black'
                      />
                      <path
                        d='M18.9687 0.000109077C22.3056 -0.0193241 25.047 2.56043 25.0522 5.72319C25.0573 8.85193 22.3364 11.4414 19.02 11.4608C15.7036 11.4803 12.9417 8.87622 12.9365 5.72319C12.9314 2.58958 15.642 0.0195423 18.9687 0.000109077ZM18.9635 9.90618C21.3764 9.92076 23.3837 8.05031 23.4094 5.77663C23.435 3.46408 21.4791 1.5742 19.0252 1.54019C16.5918 1.50618 14.5742 3.42521 14.5742 5.76691C14.5742 8.00173 16.5866 9.89647 18.9635 9.90618Z'
                        fill='black'
                      />
                      <path
                        d='M8.52111 25.4235C8.60839 25.9434 8.68026 26.3903 8.7624 26.881C8.60325 26.8908 8.45437 26.9102 8.31063 26.9102C6.89885 26.9102 5.48707 26.915 4.07529 26.9102C1.64702 26.9005 -0.0111779 25.3361 -0.000910396 23.0381C0.00422335 21.6244 -0.0471141 20.196 0.112032 18.7968C0.476528 15.6146 3.62352 12.962 7.00152 12.8454C8.44924 12.7968 9.80455 13.064 11.0623 13.7345C11.2061 13.8122 11.3395 13.9094 11.5141 14.0163C11.1701 14.4001 10.857 14.7596 10.6465 14.9976C9.59406 14.7547 8.64432 14.3903 7.67404 14.3466C4.31144 14.1814 1.62649 16.664 1.56488 19.8997C1.54435 20.9442 1.55975 21.9839 1.55975 23.0284C1.56488 24.5005 2.49922 25.3993 4.05988 25.4187C5.34845 25.4333 6.64216 25.4235 7.93073 25.4235C8.12068 25.4235 8.31063 25.4235 8.52111 25.4235Z'
                        fill='black'
                      />
                      <path
                        d='M29.2263 26.886C29.3084 26.3856 29.3803 25.9386 29.4676 25.4236C29.7602 25.4236 30.0631 25.4236 30.366 25.4236C31.5365 25.4236 32.707 25.4334 33.8775 25.4188C35.5049 25.4042 36.4392 24.5151 36.4341 22.9799C36.4289 21.7265 36.4957 20.4633 36.3519 19.2244C35.9002 15.3621 31.5673 13.1856 27.8915 14.9248C27.758 14.988 27.6194 15.0512 27.4654 15.1289C27.1317 14.7548 26.8186 14.4002 26.4746 14.0163C27.486 13.3459 28.5794 12.9864 29.7499 12.8698C33.6003 12.4957 37.0245 14.8665 37.8407 18.4568C37.9485 18.9281 37.9845 19.4236 37.9947 19.9095C38.0153 20.9831 38.005 22.0617 37.9999 23.1354C37.9896 25.137 36.5932 26.7159 34.4833 26.8665C32.748 26.9831 31.0077 26.886 29.2263 26.886Z'
                        fill='black'
                      />
                      <path
                        d='M7.4179 12.2671C4.78428 12.2622 2.67945 10.2558 2.68458 7.75374C2.68971 5.27601 4.83049 3.26953 7.4641 3.26953C10.0874 3.27439 12.1974 5.29544 12.1923 7.79261C12.1769 10.2946 10.0669 12.2768 7.4179 12.2671ZM7.41276 10.7173C9.16337 10.7222 10.5341 9.44443 10.5443 7.79747C10.5546 6.1505 9.1839 4.83876 7.45897 4.82905C5.72376 4.82419 4.33251 6.11649 4.32738 7.75374C4.31711 9.40556 5.67755 10.7076 7.41276 10.7173Z'
                        fill='black'
                      />
                      <path
                        d='M30.5708 12.2671C27.9218 12.272 25.8118 10.2898 25.8067 7.78776C25.7964 5.29059 27.9166 3.26954 30.5349 3.26954C33.1685 3.26468 35.3041 5.27602 35.3092 7.75375C35.3092 10.2606 33.2095 12.2623 30.5708 12.2671ZM30.5708 10.7173C32.306 10.7125 33.6767 9.40071 33.6613 7.75861C33.651 6.1165 32.2649 4.8242 30.5297 4.82905C28.7997 4.83391 27.4341 6.14565 27.4392 7.79262C27.4546 9.43958 28.8253 10.7222 30.5708 10.7173Z'
                        fill='black'
                      />
                    </g>
                    <defs>
                      <clipPath id='clip0_474_410'>
                        <rect width='38' height='30' fill='white' />
                      </clipPath>
                    </defs>
                  </svg>

                  <h2 className='text-xl font-bona font-bold text-black'>
                    Influencer Performance
                  </h2>
                </div>
                <p className='mt-1 text-[11px] font-bona uppercase tracking-[0.1em] text-[#000000]/68'>
                  Track traffic, conversions, and revenue generated by each
                  influencer.
                </p>
              </div>

              {user?.role === 'ADMIN' && (
                <button
                  type='button'
                  onClick={() => setIsCreateModalOpen(true)}
                  className='inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#000000]/51 px-5 py-3 text-sm font-bold text-white transition hover:opacity-90'
                >
                  <Plus className='h-4 w-4' />
                  Create New Tracking Link
                </button>
              )}
            </div>

            <div className='mb-5 flex flex-col gap-3 lg:flex-row lg:items-center'>
              <div className='relative flex-1'>
                <Search className='absolute left-4 top-1/2  size-6 -translate-y-1/2 text-dark-red' />
                <input
                  type='search'
                  value={search}
                  onChange={(event) => {
                    setLoading(true);
                    setSearch(event.target.value);
                  }}
                  placeholder='Search influencers'
                  className='h-14 w-full rounded-[14px] border border-dark-red bg-[#D9D9D9]/24 pl-13 pr-4 text-base text-black outline-none transition '
                />
              </div>

              <div className='relative min-w-[140px]'>
                <Filter className='pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-red/80' />
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setLoading(true);
                    setStatusFilter(
                      event.target.value as 'all' | 'active' | 'disabled',
                    );
                  }}
                  className='h-14 w-full appearance-none rounded-[14px] border border-dark-red bg-transparent pl-12 pr-8 text-base text-black outline-none transition cursor-pointer'
                >
                  <option value='all'>All</option>
                  <option value='active'>Active</option>
                  <option value='disabled'>Disabled</option>
                </select>
              </div>

              <div className='relative min-w-[170px]'>
                <ArrowUpDown className='pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-red/80' />
                <select
                  value={`${sortBy}:${sortOrder}`}
                  onChange={(event) => {
                    setLoading(true);
                    const [nextSortBy, nextSortOrder] =
                      event.target.value.split(':') as [
                        typeof sortBy,
                        typeof sortOrder,
                      ];
                    setSortBy(nextSortBy);
                    setSortOrder(nextSortOrder);
                  }}
                  className='h-14 w-full appearance-none rounded-[14px] border border-dark-red bg-transparent pl-12 pr-8 text-base text-black outline-none transition cursor-pointer'
                >
                  <option value='createdAt:desc'>Newest</option>
                  <option value='influencerName:asc'>Name A-Z</option>
                  <option value='clicks:desc'>Most clicks</option>
                  <option value='accountsCreated:desc'>Most accounts</option>
                  <option value='orders:desc'>Most orders</option>
                  <option value='revenue:desc'>Highest revenue</option>
                  <option value='conversionRate:desc'>Best conversion</option>
                </select>
              </div>
            </div>

            {/* <div className='overflow-hidden rounded-[22px] border border-dark-red/35 bg-[#f7f0e7]'> */}
            <TableContainer className='w-full border border rounded-xl min-h-[30vh]'>
              <Table>
                <TableHead className=' bg-[#D9D9D980]/50!'>
                  <TableRow>
                    <TableHeaderCell
                      className='text-[#000000]/68! font-bold! font-bona!'
                      onClick={() => handleSort('influencerName')}
                    >
                      <span className='inline-flex items-center gap-1'>
                        Influencer
                        <span className='inline-flex flex-col -gap-1 leading-none'>
                          <ArrowUp
                            className={`h-2.5 w-2.5 ${sortBy === 'clicks' && sortOrder === 'asc' ? 'text-black' : 'text-black/30'}`}
                          />
                          <ArrowDown
                            className={`h-2.5 w-2.5 -mt-1 ${sortBy === 'clicks' && sortOrder === 'desc' ? 'text-black' : 'text-black/30'}`}
                          />
                        </span>
                      </span>
                    </TableHeaderCell>
                    <TableHeaderCell className='text-[#000000]/68! font-bold! font-bona!'>
                      Referral Link
                    </TableHeaderCell>
                    <TableHeaderCell
                      className='text-[#000000]/68! font-bold! font-bona!'
                      onClick={() => handleSort('clicks')}
                    >
                      <span className='inline-flex items-center gap-1'>
                        Clicks
                        <span className='inline-flex flex-col -gap-1 leading-none'>
                          <ArrowUp
                            className={`h-2.5 w-2.5 ${sortBy === 'clicks' && sortOrder === 'asc' ? 'text-black' : 'text-black/30'}`}
                          />
                          <ArrowDown
                            className={`h-2.5 w-2.5 -mt-1 ${sortBy === 'clicks' && sortOrder === 'desc' ? 'text-black' : 'text-black/30'}`}
                          />
                        </span>
                      </span>
                    </TableHeaderCell>
                    <TableHeaderCell
                      className='text-[#000000]/68! font-bold! font-bona!'
                      onClick={() => handleSort('accountsCreated')}
                    >
                      <span className='inline-flex items-center gap-1'>
                        Accounts
                        <span className='inline-flex flex-col -gap-1 leading-none'>
                          <ArrowUp
                            className={`h-2.5 w-2.5 ${sortBy === 'accountsCreated' && sortOrder === 'asc' ? 'text-black' : 'text-black/30'}`}
                          />
                          <ArrowDown
                            className={`h-2.5 w-2.5 -mt-1 ${sortBy === 'accountsCreated' && sortOrder === 'desc' ? 'text-black' : 'text-black/30'}`}
                          />
                        </span>
                      </span>
                    </TableHeaderCell>
                    <TableHeaderCell
                      className='text-[#000000]/68! font-bold! font-bona!'
                      onClick={() => handleSort('orders')}
                    >
                      <span className='inline-flex items-center gap-1'>
                        Orders
                        <span className='inline-flex flex-col -gap-1 leading-none'>
                          <ArrowUp
                            className={`h-2.5 w-2.5 ${sortBy === 'orders' && sortOrder === 'asc' ? 'text-black' : 'text-black/30'}`}
                          />
                          <ArrowDown
                            className={`h-2.5 w-2.5 -mt-1 ${sortBy === 'orders' && sortOrder === 'desc' ? 'text-black' : 'text-black/30'}`}
                          />
                        </span>
                      </span>
                    </TableHeaderCell>
                    <TableHeaderCell
                      className='text-[#000000]/68! font-bold! font-bona!'
                      onClick={() => handleSort('revenue')}
                    >
                      <span className='inline-flex items-center gap-1'>
                        Revenue
                        <span className='inline-flex flex-col -gap-1 leading-none'>
                          <ArrowUp
                            className={`h-2.5 w-2.5 ${sortBy === 'revenue' && sortOrder === 'asc' ? 'text-black' : 'text-black/30'}`}
                          />
                          <ArrowDown
                            className={`h-2.5 w-2.5 -mt-1 ${sortBy === 'revenue' && sortOrder === 'desc' ? 'text-black' : 'text-black/30'}`}
                          />
                        </span>
                      </span>
                    </TableHeaderCell>
                    <TableHeaderCell
                      className='text-[#000000]/68! font-bold! font-bona!'
                      onClick={() => handleSort('conversionRate')}
                    >
                      <span className='inline-flex items-center gap-1'>
                        Conv %
                        <span className='inline-flex flex-col -gap-1 leading-none'>
                          <ArrowUp
                            className={`h-2.5 w-2.5 ${sortBy === 'conversionRate' && sortOrder === 'asc' ? 'text-black' : 'text-black/30'}`}
                          />
                          <ArrowDown
                            className={`h-2.5 w-2.5 -mt-1 ${sortBy === 'conversionRate' && sortOrder === 'desc' ? 'text-black' : 'text-black/30'}`}
                          />
                        </span>
                      </span>
                    </TableHeaderCell>
                    <TableHeaderCell className='text-[#000000]/68! font-bold! font-bona!'>
                      Status
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className='py-14 text-center'>
                        <div className='flex items-center justify-center gap-3 text-[#6D5A46]'>
                          <Loader2 className='h-5 w-5 animate-spin' />
                          Loading influencer performance...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className='py-14 text-center text-[#6D5A46]'
                      >
                        No influencer tracking links match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, itemIndex) => (
                      <TableRow
                        key={item.id}
                        className={`${itemIndex === 0 ? 'border-t' : 'border-y'} border-[#000000]/68 hover:bg-[#efe2cf]/60`}
                      >
                        <TableCell className='align-top'>
                          <div className='min-w-[180px]'>
                            <p className='text-base font-bold text-black leading-tight'>
                              {item.influencerName}
                            </p>
                            <p className='text-sm text-[#000000]/68 font-bold'>
                              {item.influencerHandle
                                ? `@${item.influencerHandle.replace(/^@+/, '')}`
                                : `@${item.code}`}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className='align-top'>
                          <div className='flex min-w-[220px] items-center gap-2'>
                            <span className=' bg-[#D9D9D9] border px-2 py-1 text-sm text-[#000000]/68'>
                              {item.trackingUrl.replace(/^https?:\/\//, '')}
                            </span>
                            <button
                              type='button'
                              onClick={() => copyLink(item.trackingUrl)}
                              className='rounded-md p-2 text-[#6D5A46] transition hover:bg-[#e2d4c3] hover:text-dark-red'
                              title='Copy tracking link'
                            >
                              <Copy className='h-4 w-4' />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className='font-aboreto text-md text-black'>
                          {item.clicks.toLocaleString()}
                        </TableCell>
                        <TableCell className='font-aboreto text-md text-black'>
                          {item.accountsCreated.toLocaleString()}
                        </TableCell>
                        <TableCell className='font-aboreto text-md text-black'>
                          <svg
                            width='21'
                            height='21'
                            viewBox='0 0 21 21'
                            fill='none'
                            className='size-4! inline-block mr-1'
                            xmlns='http://www.w3.org/2000/svg'
                          >
                            <g clip-path='url(#clip0_517_1190)'>
                              <path
                                d='M0.875 0.875H4.375L6.72 12.5912C6.80001 12.9941 7.01917 13.356 7.3391 13.6135C7.65903 13.8711 8.05936 14.0079 8.47 14H16.975C17.3856 14.0079 17.786 13.8711 18.1059 13.6135C18.4258 13.356 18.645 12.9941 18.725 12.5912L20.125 5.25H5.25M8.75 18.375C8.75 18.8582 8.35825 19.25 7.875 19.25C7.39175 19.25 7 18.8582 7 18.375C7 17.8917 7.39175 17.5 7.875 17.5C8.35825 17.5 8.75 17.8917 8.75 18.375ZM18.375 18.375C18.375 18.8582 17.9832 19.25 17.5 19.25C17.0167 19.25 16.625 18.8582 16.625 18.375C16.625 17.8917 17.0167 17.5 17.5 17.5C17.9832 17.5 18.375 17.8917 18.375 18.375Z'
                                stroke='#1E1E1E'
                                stroke-width='3.5'
                                stroke-linecap='round'
                                stroke-linejoin='round'
                              />
                            </g>
                            <defs>
                              <clipPath id='clip0_517_1190'>
                                <rect width='21' height='21' fill='white' />
                              </clipPath>
                            </defs>
                          </svg>

                          <span className='inline'>
                            {item.orders.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className='font-aboreto text-md text-black'>
                          {formatCurrency(item.revenue, 'TND', true)} DT
                        </TableCell>
                        <TableCell className='font-aboreto text-md text-black'>
                          {item.conversionRate.toFixed(1)}%
                        </TableCell>
                        <TableCell className='align-top'>
                          <button
                            type='button'
                            role='switch'
                            aria-checked={item.status === 'active'}
                            onClick={async () => {
                              const nextStatus =
                                item.status === 'active'
                                  ? 'disabled'
                                  : 'active';
                              try {
                                await influencerTrackingService.updateInfluencerTrackingLink(
                                  item.id,
                                  { status: nextStatus },
                                );
                                setItems((current) =>
                                  current.map((i) =>
                                    i.id === item.id
                                      ? { ...i, status: nextStatus }
                                      : i,
                                  ),
                                );
                                toast.success(
                                  `Link ${nextStatus === 'active' ? 'enabled' : 'disabled'} for ${item.influencerName}`,
                                );
                              } catch (error) {
                                console.error(error);
                                toast.error('Failed to update link status.');
                              }
                            }}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                              item.status === 'active'
                                ? 'bg-dark-red'
                                : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                                item.status === 'active'
                                  ? 'translate-x-[22px]'
                                  : 'translate-x-[2px]'
                              }`}
                            />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {/* </div> */}
          </section>
        </main>
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm'>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className='w-full max-w-2xl rounded-[28px] border border-dark-red bg-[#f7eee1] p-6 shadow-xl'
            >
              <div className='mb-5 flex items-start justify-between gap-4'>
                <div>
                  <h2 className='text-2xl font-bold text-black'>
                    Create tracking link
                  </h2>
                  <p className='text-sm text-[#6D5A46]'>
                    Add an influencer and generate a referral link for campaign
                    tracking.
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => setIsCreateModalOpen(false)}
                  className='rounded-full p-2 text-[#6D5A46] transition hover:bg-[#eadbc6]'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>

              <form onSubmit={handleCreate} className='space-y-4'>
                <div className='grid gap-4 md:grid-cols-2'>
                  <label className='block text-sm'>
                    <span className='mb-2 block text-black'>
                      Influencer name
                    </span>
                    <input
                      value={form.influencerName ?? ''}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          influencerName: event.target.value,
                        }))
                      }
                      placeholder='e.g. Amal Ben Salah'
                      className='h-12 w-full rounded-xl border border-dark-red/35 bg-[#fff9f1] px-4 text-black outline-none transition focus:ring-2 focus:ring-dark-red/10'
                    />
                  </label>

                  <label className='block text-sm'>
                    <span className='mb-2 block text-black'>Handle</span>
                    <input
                      value={form.influencerHandle ?? ''}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          influencerHandle: event.target.value,
                        }))
                      }
                      placeholder='e.g. amal'
                      className='h-12 w-full rounded-xl border border-dark-red/35 bg-[#fff9f1] px-4 text-black outline-none transition focus:ring-2 focus:ring-dark-red/10'
                    />
                  </label>
                </div>

                <label className='block text-sm'>
                  <span className='mb-2 block text-black'>
                    Destination path
                  </span>
                  <input
                    value={form.destinationPath ?? '/'}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        destinationPath: event.target.value,
                      }))
                    }
                    placeholder='/'
                    className='h-12 w-full rounded-xl border border-dark-red/35 bg-[#fff9f1] px-4 text-black outline-none transition focus:ring-2 focus:ring-dark-red/10'
                  />
                </label>

                <label className='block text-sm'>
                  <span className='mb-2 block text-black'>Notes</span>
                  <textarea
                    value={form.notes ?? ''}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder='Campaign details or internal notes'
                    rows={4}
                    className='w-full rounded-xl border border-dark-red/35 bg-[#fff9f1] px-4 py-3 text-black outline-none transition focus:ring-2 focus:ring-dark-red/10'
                  />
                </label>

                <div className='flex items-center justify-end gap-3 pt-2'>
                  <button
                    type='button'
                    onClick={() => setIsCreateModalOpen(false)}
                    className='rounded-full border border-[#6D5A46] bg-white px-5 py-2 text-sm font-semibold text-[#6D5A46]'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={creating}
                    className='inline-flex items-center gap-2 rounded-full bg-dark-red px-6 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60'
                  >
                    {creating ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <Plus className='h-4 w-4' />
                    )}
                    Create link
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
