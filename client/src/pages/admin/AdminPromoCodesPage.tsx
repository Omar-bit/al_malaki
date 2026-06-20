import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '../../components/AdminLayout';
import { promoService, productService } from '../../services';
import type {
  PromoCode,
  PromoCodeStats,
  CreatePromoCodePayload,
} from '../../types';
import type { ProductAnalyticsProduct } from '../../types/product';
import { formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  Tag,
  UsersRound,
  Trash2,
  Loader2,
  X,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import {
  StatCard,
  StatusBadge,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
} from '../../components/ui';

/* ───────────────────────────── helpers ───────────────────────────── */

/* ────────────────────────── empty state ───────────────────────────── */

const INITIAL_FORM: CreatePromoCodePayload = {
  code: '',
  discountType: 'percentage',
  value: 0,
  usageLimit: undefined,
  productId: undefined,
  startDate: new Date().toISOString().slice(0, 10),
  expiration: undefined,
  isLifetime: false,
  source: undefined,
};

/* ══════════════════════════ main page ═══════════════════════════════ */

export function AdminPromoCodesPage() {
  /* ── state ── */
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [stats, setStats] = useState<PromoCodeStats>({
    totalRevenue: 0,
    totalRedemptions: 0,
    activeCodes: 0,
  });
  const [products, setProducts] = useState<ProductAnalyticsProduct[]>([]);
  const [form, setForm] = useState<CreatePromoCodePayload>({ ...INITIAL_FORM });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState<PromoCode | null>(null);

  /* ── fetch ── */
  const fetchAll = useCallback(async () => {
    try {
      const [codes, s, prods] = await Promise.all([
        promoService.getPromoCodes(),
        promoService.getPromoStats(),
        productService.getProducts(),
      ]);
      setPromoCodes(codes);
      setStats(s);
      setProducts(prods);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ── create ── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.code.trim()) {
      toast.error('Code name is required');
      return;
    }
    if (form.value <= 0) {
      toast.error('Value must be greater than 0');
      return;
    }

    setCreating(true);
    try {
      const payload: CreatePromoCodePayload = {
        ...form,
        code: form.code.trim(),
        expiration: form.isLifetime ? undefined : form.expiration || undefined,
      };
      const created = await promoService.createPromoCode(payload);
      setPromoCodes((prev) => [created, ...prev]);
      setStats((prev) => ({
        ...prev,
        activeCodes: prev.activeCodes + 1,
      }));
      setForm({ ...INITIAL_FORM });
      setIsAddModalOpen(false);
      toast.success('Promo code created!');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to create promo code');
    } finally {
      setCreating(false);
    }
  };

  /* ── delete ── */
  const confirmDelete = (promo: PromoCode) => setPromoToDelete(promo);

  const handleDelete = async () => {
    if (!promoToDelete) return;
    setDeletingId(promoToDelete.id);
    try {
      await promoService.deletePromoCode(promoToDelete.id);
      setPromoCodes((prev) => prev.filter((p) => p.id !== promoToDelete.id));
      const statsRefresh = await promoService.getPromoStats();
      setStats(statsRefresh);
      toast.success('Promo code deleted');
      setPromoToDelete(null);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  /* ── toggle ── */
  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      const updated = await promoService.togglePromoStatus(id);
      setPromoCodes((prev) => prev.map((p) => (p.id === id ? updated : p)));
      const statsRefresh = await promoService.getPromoStats();
      setStats(statsRefresh);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to toggle status');
    } finally {
      setTogglingId(null);
    }
  };

  /* ── form helpers ── */
  const updateField = <K extends keyof CreatePromoCodePayload>(
    key: K,
    value: CreatePromoCodePayload[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  /* ══════════════════════════ render ═══════════════════════════════ */

  return (
    <AdminLayout>
      <div className='px-4 md:px-8 py-5 w-full font-bona!'>
        {/* ── Header ── */}
        <header className='mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl md:text-3xl font-bold text-black mb-1'>
              Promo Codes
            </h1>
            <p className='text-sm md:text-base text-[#000000]/68'>
              Create, track and optimize your marketing promo codes.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className='w-full sm:w-auto justify-center bg-dark-red hover:bg-dark-red/90 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md'
          >
            <Plus className='w-4 h-4' />
            Create Code
          </button>
        </header>

        {loading ? (
          <div className='flex items-center justify-center h-64'>
            <Loader2 className='w-8 h-8 animate-spin text-dark-red' />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className='space-y-6 p-0'
          >
            {/* ── Stats Row ── */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-15'>
              <StatCard
                label='Total revenue'
                value={formatCurrency(stats.totalRevenue, 'USD')}
                icon={
                  <span className=' bg-[#D9D9D9] p-[6px] text-sm rounded-full aspect-square font-semibold text-black'>
                    DT
                  </span>
                }
              />
              <StatCard
                label='Redemptions'
                value={stats.totalRedemptions.toLocaleString()}
                icon={
                  <div className=' bg-[#D9D9D9] p-[6px] text-sm rounded-full aspect-square font-semibold text-black'>
                    <UsersRound className='size-4' />
                  </div>
                }
              />
              <StatCard
                label='Active codes'
                value={stats.activeCodes}
                icon={
                  <div className=' bg-[#D9D9D9] p-[6px] text-sm rounded-full aspect-square font-semibold text-black'>
                    <Tag className='size-4' />
                  </div>
                }
              />
            </div>

            {/* ── Performance Table Card ── */}
            <div className='min-h-[50vh] bg-[#D9D9D957] rounded-2xl shadow-sm border border-[#3F060F]/40'>
              <div className='pt-5 pl-4'>
                <div className='flex items-center gap-2 mb-1'>
                  <TrendingUp className='w-5  text-dark-red' />
                  <h2 className='text-xl font-bold text-black'>Performance</h2>
                </div>
                <p className='text-sm text-[#000000]/68 mb-5'>
                  All promo codes with attribution and revenue impact.
                </p>
              </div>

              <TableContainer>
                <Table>
                  <TableHead className=' bg-[#D9D9D980]/50'>
                    <TableRow>
                      <TableHeaderCell>
                        <span className='text-[#000000]/68 font-bold font-bona'>
                          Code
                        </span>
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <span className='text-[#000000]/68 font-bold font-bona'>
                          Discount
                        </span>
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <span className='text-[#000000]/68 font-bold font-bona'>
                          Usage
                        </span>
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <span className='text-[#000000]/68 font-bold font-bona'>
                          Revenue
                        </span>
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <span className='text-[#000000]/68 font-bold font-bona'>
                          Source
                        </span>
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <span className='text-[#000000]/68 font-bold font-bona'>
                          Status
                        </span>
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <span className='text-[#000000]/68 font-bold font-bona'>
                          Actions
                        </span>
                      </TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody className=''>
                    {promoCodes.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className='text-center py-12 text-[#a68f74]'
                        >
                          No promo codes yet. Create your first one above.
                        </TableCell>
                      </TableRow>
                    ) : (
                      promoCodes.map((promo) => (
                        <TableRow
                          key={promo.id}
                          className='border-b border-[#000000]/51 hover:bg-[#D5BD9D]/20'
                        >
                          <TableCell className='font-normal text-black font-bona!'>
                            {promo.code}
                          </TableCell>
                          <TableCell className='text-black font-aboreto'>
                            {promo.discountType === 'percentage'
                              ? `${promo.value}%`
                              : formatCurrency(promo.value, 'USD')}
                          </TableCell>
                          <TableCell className='text-black font-aboreto'>
                            {promo.totalUsage.toLocaleString()}
                          </TableCell>
                          <TableCell className='text-black font-aboreto'>
                            {formatCurrency(promo.totalRevenue, 'USD')}
                          </TableCell>
                          <TableCell className='text-black font-bona'>
                            {promo.source ?? '—'}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={promo.status} />
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-4'>
                              <button
                                onClick={() => handleToggle(promo.id)}
                                disabled={togglingId === promo.id}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-dark-red focus:ring-offset-2 disabled:opacity-50 ${
                                  promo.status === 'active'
                                    ? 'bg-green-500'
                                    : 'bg-gray-300'
                                }`}
                                title={
                                  promo.status === 'active'
                                    ? 'Disable'
                                    : 'Enable'
                                }
                              >
                                {togglingId === promo.id ? (
                                  <Loader2
                                    className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-white ${promo.status === 'active' ? 'left-[20px]' : 'left-0.5'}`}
                                  />
                                ) : (
                                  <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                      promo.status === 'active'
                                        ? 'translate-x-5'
                                        : 'translate-x-0'
                                    }`}
                                  />
                                )}
                              </button>

                              <button
                                onClick={() => confirmDelete(promo)}
                                title='Delete'
                                className='p-1.5 rounded-lg hover:bg-red-100 transition-colors text-[#6D5A46] hover:text-red-600'
                              >
                                <Trash2 className='w-4 h-4' />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {/* ── Add Promo Code Modal ── */}
        {isAddModalOpen && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm font-bona! '>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className='bg-[#ede7de] rounded-2xl p-6 shadow- w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar border border-dark-red'
            >
              <div className='flex items-center justify-between mb-5'>
                <div>
                  <h2 className='text-2xl font-bold text-black mb-1'>
                    Create promo code
                  </h2>
                  <p className='text-sm text-[#000000]/68'>
                    Set up a new code for a campaign, influencer or channel.
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => setIsAddModalOpen(false)}
                  className='p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors'
                >
                  <X className='w-5 h-5' />
                </button>
              </div>

              <form onSubmit={handleCreate}>
                {/* Row 1 */}
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
                  <div>
                    <label
                      htmlFor='promo-code-name'
                      className='block text-sm  text-black mb-0.5'
                    >
                      Code name
                    </label>
                    <input
                      id='promo-code-name'
                      type='text'
                      placeholder='e.g. SUMMER25'
                      value={form.code}
                      onChange={(e) => updateField('code', e.target.value)}
                      className='w-full rounded-xl border border-[#3F060F]/30 bg-[#D9D9D9]/34 px-4 py-2.5 text-sm text-[#000000]/68 placeholder:text-[#000000]/68 focus:outline-none focus:ring-2 focus:ring-dark-red/40 transition'
                    />
                  </div>

                  <div>
                    <label
                      htmlFor='promo-discount-type'
                      className='block text-sm  text-black mb-0.5'
                    >
                      Discount type
                    </label>
                    <select
                      id='promo-discount-type'
                      value={form.discountType}
                      onChange={(e) =>
                        updateField(
                          'discountType',
                          e.target.value as 'percentage' | 'fixed',
                        )
                      }
                      className='w-full rounded-xl border border-[#3F060F]/30 bg-[#D9D9D9]/34 px-4 py-2.5 text-sm text-[#000000]/68 placeholder:text-[#000000]/68 focus:outline-none focus:ring-2 focus:ring-dark-red/40 transition'
                    >
                      <option value='percentage'>Percentage (%)</option>
                      <option value='fixed'>Fixed (TND)</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor='promo-value'
                      className='block text-sm  text-black mb-0.5 '
                    >
                      Value{' '}
                      {form.discountType === 'percentage' ? '(%)' : '(TND)'}
                    </label>
                    <input
                      id='promo-value'
                      type='number'
                      min={0}
                      step='any'
                      value={form.value || ''}
                      onChange={(e) =>
                        updateField('value', parseFloat(e.target.value) || 0)
                      }
                      className='w-full rounded-xl border border-[#3F060F]/30 bg-[#D9D9D9]/34 px-4 py-2.5 text-sm text-[#000000]/68 placeholder:text-[#000000]/68 focus:outline-none focus:ring-2 focus:ring-dark-red/40 transition font-aboreto'
                    />
                  </div>

                  <div>
                    <label
                      htmlFor='promo-usage-limit'
                      className='block text-sm  text-black mb-0.5 '
                    >
                      Usage limit per user
                    </label>
                    <input
                      id='promo-usage-limit'
                      type='number'
                      min={1}
                      placeholder='Unlimited'
                      value={form.usageLimit ?? ''}
                      onChange={(e) =>
                        updateField(
                          'usageLimit',
                          e.target.value ? parseInt(e.target.value) : undefined,
                        )
                      }
                      className='w-full rounded-xl border border-[#3F060F]/30 bg-[#D9D9D9]/34 px-4 py-2.5 text-sm text-[#000000]/68 placeholder:text-[#000000]/68 focus:outline-none focus:ring-2 focus:ring-dark-red/40 transition font-aboreto'
                    />
                  </div>
                </div>

                {/* Row 2 */}
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4'>
                  <div>
                    <label
                      htmlFor='promo-product'
                      className='block text-xs  text-black mb-1.5'
                    >
                      Apply to specific product (optional)
                    </label>
                    <select
                      id='promo-product'
                      value={form.productId ?? ''}
                      onChange={(e) =>
                        updateField('productId', e.target.value || undefined)
                      }
                      className='w-full rounded-xl border border-[#3F060F]/30 bg-[#D9D9D9]/34 px-4 py-2.5 text-sm text-[#000000]/68 placeholder:text-[#000000]/68 focus:outline-none focus:ring-2 focus:ring-dark-red/40 transition'
                    >
                      <option value=''>All products</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor='promo-start-date'
                      className='block text-sm  text-black mb-0.5'
                    >
                      Start date
                    </label>
                    <input
                      id='promo-start-date'
                      type='date'
                      value={form.startDate.slice(0, 10)}
                      onChange={(e) => updateField('startDate', e.target.value)}
                      className='w-full rounded-xl border border-[#3F060F]/30 bg-[#D9D9D9]/34 px-4 py-2.5 text-sm text-[#000000]/68 placeholder:text-[#000000]/68 focus:outline-none focus:ring-2 focus:ring-dark-red/40 transition'
                    />
                  </div>

                  <div>
                    <label
                      htmlFor='promo-expiration'
                      className='block text-sm  text-black mb-0.5'
                    >
                      Expiration
                    </label>
                    <input
                      id='promo-expiration'
                      type='date'
                      disabled={form.isLifetime}
                      value={form.expiration?.slice(0, 10) ?? ''}
                      onChange={(e) =>
                        updateField('expiration', e.target.value || undefined)
                      }
                      className='w-full rounded-xl border border-[#3F060F]/30 bg-[#D9D9D9]/34 px-4 py-2.5 text-sm text-[#000000]/68 placeholder:text-[#000000]/68 focus:outline-none focus:ring-2 focus:ring-dark-red/40 transition disabled:opacity-50 disabled:cursor-not-allowed'
                    />
                  </div>
                </div>

                {/* Row 3 – Lifetime + submit */}
                <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between mt-6 pt-4 border-t border-[#3F060F]/10 gap-4'>
                  <label
                    htmlFor='promo-lifetime'
                    className='flex items-center gap-2.5 cursor-pointer select-none'
                  >
                    <input
                      id='promo-lifetime'
                      type='checkbox'
                      checked={form.isLifetime}
                      onChange={(e) => {
                        updateField('isLifetime', e.target.checked);
                        if (e.target.checked)
                          updateField('expiration', undefined);
                      }}
                      className='w-4 h-4 rounded border-[#3F060F]/40 accent-dark-red'
                    />
                    <span className='text-sm text-black'>
                      Lifetime code (no expiration)
                    </span>
                  </label>

                  <div className='flex items-center gap-3 w-full sm:w-auto'>
                    <button
                      type='button'
                      onClick={() => setIsAddModalOpen(false)}
                      className='flex-1 sm:flex-none px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors'
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      disabled={creating}
                      className='flex-1 sm:flex-none justify-center bg-dark-red hover:bg-dark-red/90 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md'
                    >
                      {creating ? (
                        <Loader2 className='w-4 h-4 animate-spin' />
                      ) : (
                        <Plus className='w-4 h-4' />
                      )}
                      Create code
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* ── Delete Confirmation Modal ── */}
        {promoToDelete && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm font-bona!'>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className='bg-white rounded-2xl p-6 shadow-xl w-full max-w-md'
            >
              <div className='flex items-center gap-3 text-red-600 mb-4'>
                <div className='bg-red-100 p-2 rounded-full'>
                  <AlertTriangle className='w-6 h-6' />
                </div>
                <h2 className='text-xl font-bold'>Delete Promo Code</h2>
              </div>
              <p className='text-gray-600 mb-6'>
                Are you sure you want to delete the promo code{' '}
                <strong className='text-black'>{promoToDelete.code}</strong>?
                This action cannot be undone and will permanently remove its
                tracking data.
              </p>
              <div className='flex items-center justify-end gap-3 mt-4 w-full sm:w-auto'>
                <button
                  onClick={() => setPromoToDelete(null)}
                  disabled={deletingId === promoToDelete.id}
                  className='flex-1 sm:flex-none px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50'
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deletingId === promoToDelete.id}
                  className='flex-1 sm:flex-none justify-center px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50'
                >
                  {deletingId === promoToDelete.id ? (
                    <Loader2 className='w-4 h-4 animate-spin' />
                  ) : (
                    <Trash2 className='w-4 h-4' />
                  )}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
