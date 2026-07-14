import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '../../components/AdminLayout';
import { orderService } from '../../services';
import type { Order } from '../../types';
import { formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  ShoppingBag,
  Search,
  ChevronDown,
  Loader2,
  Clock,
  Eye,
  MoreHorizontal,
  MapPin,
  Phone,
  Mail,
  CreditCard,
} from 'lucide-react';
import {
  StatCard,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
  Modal,
} from '../../components/ui';

/* ───────────────────────────── custom badge ───────────────────────────── */

function OrderStatusBadge({ status }: { status: string }) {
  let bg = 'bg-gray-200';
  let text = 'text-gray-800';
  let dot = 'bg-gray-500';
  let label = status;

  switch (status) {
    case 'PENDING':
      bg = 'bg-orange-100';
      text = 'text-orange-800';
      dot = 'bg-orange-500';
      label = 'Pending';
      break;
    case 'CONFIRMED':
      bg = 'bg-blue-100';
      text = 'text-blue-800';
      dot = 'bg-blue-500';
      label = 'Confirmed';
      break;
    case 'PROCESSING':
      bg = 'bg-purple-100';
      text = 'text-purple-800';
      dot = 'bg-purple-500';
      label = 'Processing';
      break;
    case 'SHIPPED':
      bg = 'bg-indigo-100';
      text = 'text-indigo-800';
      dot = 'bg-indigo-500';
      label = 'Shipped';
      break;
    case 'DELIVERED':
      bg = 'bg-green-300/60';
      text = 'text-green-800';
      dot = 'bg-green-600';
      label = 'Delivered';
      break;
    case 'CANCELLED':
      bg = 'bg-red-100';
      text = 'text-red-800';
      dot = 'bg-red-500';
      label = 'Cancelled';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold ${bg} ${text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

/* ══════════════════════════ main page ═══════════════════════════════ */

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await orderService.getAllOrders();
      setOrders(data);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleExport = () => {
    const csvContent = [
      ['Order ID', 'Client Name', 'Phone', 'Total (TND)', 'Date', 'Status'],
      ...filteredOrders.map((o) => [
        o.id,
        `${o.firstName} ${o.lastName}`,
        o.phoneNumber,
        o.total.toFixed(2),
        new Date(o.createdAt).toISOString().slice(0, 10),
        o.status,
      ]),
    ]
      .map((e) => e.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatusId(orderId);
      const updatedOrder = await orderService.updateOrderStatus(
        orderId,
        newStatus,
      );
      setOrders(orders.map((o) => (o.id === orderId ? updatedOrder : o)));
      setDropdownOpenId(null);
      toast.success('Order status updated');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const stats = useMemo(() => {
    let totalRevenue = 0;
    let pendingOrders = 0;
    orders.forEach((o) => {
      if (o.status !== 'CANCELLED') {
        totalRevenue += o.total;
      }
      if (o.status === 'PENDING') {
        pendingOrders += 1;
      }
    });
    return {
      totalRevenue,
      totalOrders: orders.length,
      pendingOrders,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.phoneNumber.includes(searchTerm);

      const matchesStatus = statusFilter ? o.status === statusFilter : true;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  return (
    <AdminLayout>
      <div className='px-4 md:px-8 py-5 w-full font-bona!'>
        {/* ── Header ── */}
        <header className='mb-6'>
          <h1 className='text-2xl md:text-3xl font-bold text-black mb-1'>
            Sales & Orders
          </h1>
          <p className='text-sm md:text-base text-[#000000]/68'>
            Manage customer orders and track sales activity.
          </p>
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
                value={formatCurrency(stats.totalRevenue, 'TND')}
                icon={
                  <span className=' bg-[#D9D9D9] p-[6px] text-sm rounded-full aspect-square font-semibold text-black'>
                    DT
                  </span>
                }
              />
              <StatCard
                label='Total orders'
                value={stats.totalOrders.toLocaleString()}
                icon={
                  <div className=' bg-[#D9D9D9] p-[6px] text-sm rounded-full aspect-square font-semibold text-black'>
                    <ShoppingBag className='size-4' />
                  </div>
                }
              />
              <StatCard
                label='Pending orders'
                value={stats.pendingOrders}
                icon={
                  <div className=' bg-[#D9D9D9] p-[6px] text-sm rounded-full aspect-square font-semibold text-black'>
                    <Clock className='size-4' />
                  </div>
                }
              />
            </div>

            {/* ── Orders Management Card ── */}
            <div className='min-h-[50vh] bg-[#D9D9D957] rounded-2xl shadow-sm border border-[#3F060F]/40 p-4 md:p-6'>
              <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6'>
                <div>
                  <div className='flex items-center gap-2 mb-1'>
                    <ShoppingBag className='w-5 text-black' />
                    <h2 className='text-xl font-bold text-black'>
                      Orders management
                    </h2>
                  </div>
                  <p className='text-sm text-[#000000]/68'>
                    Track and manage all customer orders.
                  </p>
                </div>
                <button
                  onClick={handleExport}
                  className='mt-4 sm:mt-0 bg-[#7B7B7B] hover:bg-[#6A6A6A] text-white text-xs font-bold px-6 py-2 rounded-lg transition-colors uppercase tracking-wider'
                >
                  Export
                </button>
              </div>

              <div className='flex flex-col sm:flex-row items-center gap-4 mb-8'>
                <div className='relative w-full sm:w-2/3'>
                  <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500' />
                  <input
                    type='text'
                    placeholder='Search by name or matricule'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='w-full rounded-xl border border-[#3F060F]/30 bg-[#E8DFD1]/50 px-10 py-2.5 text-sm text-[#000000]/68 placeholder:text-[#000000]/68 focus:outline-none focus:ring-2 focus:ring-dark-red/40 transition'
                  />
                </div>
                <div className='relative w-full sm:w-1/3'>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className='w-full appearance-none rounded-xl border border-[#3F060F]/30 bg-[#E8DFD1]/50 px-4 py-2.5 text-sm text-[#000000]/68 placeholder:text-[#000000]/68 focus:outline-none focus:ring-2 focus:ring-dark-red/40 transition'
                  >
                    <option value=''>Filter by status</option>
                    <option value='PENDING'>Pending</option>
                    <option value='CONFIRMED'>Confirmed</option>
                    <option value='PROCESSING'>Processing</option>
                    <option value='SHIPPED'>Shipped</option>
                    <option value='DELIVERED'>Delivered</option>
                    <option value='CANCELLED'>Cancelled</option>
                  </select>
                  <ChevronDown className='absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none' />
                </div>
              </div>

              <div className='mb-4'>
                <div className='flex items-center gap-2 mb-1'>
                  <TrendingUp className='w-4 text-gray-600' />
                  <h3 className='text-lg font-bold text-black'>Performance</h3>
                </div>
                <p className='text-sm text-[#000000]/68'>
                  Recent orders with their status and total value.
                </p>
              </div>

              <TableContainer className='bg-transparent shadow-none border-none  min-h-[30vh]'>
                <Table>
                  <TableHead className='bg-[#D9D9D980]/50'>
                    <TableRow>
                      <TableHeaderCell>
                        <span className='text-[#000000]/68 font-bold font-bona'>
                          Order ID
                        </span>
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <span className='text-[#000000]/68 font-bold font-bona'>
                          Client name
                        </span>
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <span className='text-[#000000]/68 font-bold font-bona'>
                          Phone number
                        </span>
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <span className='text-[#000000]/68 font-bold font-bona'>
                          Total (TND)
                        </span>
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <span className='text-[#000000]/68 font-bold font-bona'>
                          Date
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
                  <TableBody className='max-h-[20vh] overflow-y-auto'>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className='text-center py-12 text-[#a68f74]'
                        >
                          No orders found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow
                          key={order.id}
                          className='border-b border-[#000000]/20 hover:bg-[#D5BD9D]/20'
                        >
                          <TableCell className='font-normal text-gray-500 font-aboreto text-sm'>
                            #{order.id.slice(-4).toUpperCase()}
                          </TableCell>
                          <TableCell className='text-black font-bona text-sm'>
                            {order.firstName} {order.lastName}
                          </TableCell>
                          <TableCell className='text-gray-500 font-aboreto text-sm'>
                            {order.phoneNumber}
                          </TableCell>
                          <TableCell className='text-black font-aboreto text-sm'>
                            {order.total.toFixed(2)}
                          </TableCell>
                          <TableCell className='text-gray-500 font-aboreto text-sm'>
                            {new Date(order.createdAt)
                              .toISOString()
                              .slice(0, 10)}
                          </TableCell>
                          <TableCell>
                            <OrderStatusBadge status={order.status} />
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2 relative'>
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className='flex items-center gap-1.5 px-2.5 py-1 bg-[#b2b2b2]/40 hover:bg-[#b2b2b2]/60 rounded-md transition-colors text-black text-xs font-bold'
                              >
                                <Eye className='w-3.5 h-3.5' />
                                View
                              </button>

                              {/* <div className='relative'>
                                <button
                                  onClick={() =>
                                    setDropdownOpenId(
                                      dropdownOpenId === order.id
                                        ? null
                                        : order.id,
                                    )
                                  }
                                  className='p-1 text-gray-400 hover:text-black transition-colors'
                                >
                                  {updatingStatusId === order.id ? (
                                    <Loader2 className='w-4 h-4 animate-spin' />
                                  ) : (
                                    <MoreHorizontal className='w-4 h-4' />
                                  )}
                                </button>
                                {dropdownOpenId === order.id && (
                                  <div className='absolute right-0 mt-2 w-36 bg-white rounded-md shadow-lg z-50 border border-gray-200'>
                                    <div className='py-1'>
                                      <button
                                        onClick={() => {
                                          toast.error(
                                            'Edit not implemented yet',
                                          );
                                          setDropdownOpenId(null);
                                        }}
                                        className='block w-full text-left px-4 py-2 text-sm font-bona hover:bg-gray-100'
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => {
                                          toast.error(
                                            'Delete not implemented yet',
                                          );
                                          setDropdownOpenId(null);
                                        }}
                                        className='block w-full text-left px-4 py-2 text-sm font-bona text-red-600 hover:bg-red-50'
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div> */}
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

      <Modal
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order #${selectedOrder?.id.slice(-4).toUpperCase()}`}
      >
        {selectedOrder && (
          <div className='font-bona text-black'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
              <div className='bg-[#f0e6d8] p-4 rounded-xl'>
                <h3 className='font-bold text-lg mb-3'>Customer Information</h3>
                <div className='space-y-2 text-sm'>
                  <div className='flex items-center gap-2'>
                    <Eye className='w-4 h-4 text-gray-500' />{' '}
                    {selectedOrder.firstName} {selectedOrder.lastName}
                  </div>
                  <div className='flex items-center gap-2'>
                    <Mail className='w-4 h-4 text-gray-500' />{' '}
                    {selectedOrder.email}
                  </div>
                  <div className='flex items-center gap-2'>
                    <Phone className='w-4 h-4 text-gray-500' />{' '}
                    {selectedOrder.phoneNumber}{' '}
                    {selectedOrder.secondPhone
                      ? `/ ${selectedOrder.secondPhone}`
                      : ''}
                  </div>
                </div>
              </div>
              <div className='bg-[#f0e6d8] p-4 rounded-xl flex flex-col justify-between'>
                <div>
                  <h3 className='font-bold text-lg mb-3'>Shipping & Payment</h3>
                  <div className='space-y-2 text-sm'>
                    <div className='flex items-start gap-2'>
                      <MapPin className='w-4 h-4 text-gray-500 mt-0.5' />{' '}
                      <div>
                        {selectedOrder.address}
                        <br />
                        {selectedOrder.city}, {selectedOrder.postalCode}
                      </div>
                    </div>
                    <div className='flex items-center gap-2 mt-2 pt-2 border-t border-[#d5bd9d]/50'>
                      <CreditCard className='w-4 h-4 text-gray-500' />{' '}
                      {selectedOrder.paymentMethod === 'CARD'
                        ? 'Credit Card'
                        : 'Cash on Delivery'}
                    </div>
                    <div className='flex items-center gap-2'>
                      <Clock className='w-4 h-4 text-gray-500' />{' '}
                      {new Date(selectedOrder.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className='mt-4 pt-4 border-t border-[#d5bd9d]/50'>
                  <h4 className='font-bold text-sm mb-2 text-gray-700'>
                    Update Status
                  </h4>
                  <div className='flex items-center gap-2'>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => {
                        handleUpdateStatus(selectedOrder.id, e.target.value);
                        setSelectedOrder({
                          ...selectedOrder,
                          status: e.target.value as any,
                        });
                      }}
                      disabled={updatingStatusId === selectedOrder.id}
                      className='w-full rounded-lg border border-[#d5bd9d] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dark-red/40 transition disabled:opacity-50'
                    >
                      <option value='PENDING'>Pending</option>
                      <option value='CONFIRMED'>Confirmed</option>
                      <option value='PROCESSING'>Processing</option>
                      <option value='SHIPPED'>Shipped</option>
                      <option value='DELIVERED'>Delivered</option>
                      <option value='CANCELLED'>Cancelled</option>
                    </select>
                    {updatingStatusId === selectedOrder.id && (
                      <Loader2 className='w-5 h-5 animate-spin text-dark-red' />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <h3 className='font-bold text-lg mb-3'>Order Items</h3>
            <div className='border border-[#d5bd9d]/50 rounded-xl overflow-hidden mb-4'>
              <table className='w-full text-sm'>
                <thead className='bg-[#D9D9D980]/50 text-left'>
                  <tr>
                    <th className='px-4 py-2 font-bold'>Product</th>
                    <th className='px-4 py-2 font-bold'>Qty</th>
                    <th className='px-4 py-2 font-bold'>Price</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-[#d5bd9d]/50'>
                  {selectedOrder.items?.map((item) => (
                    <tr key={item.id} className='bg-white/40'>
                      <td className='px-4 py-3'>{item.productName}</td>
                      <td className='px-4 py-3'>{item.quantity}</td>
                      <td className='px-4 py-3 font-aboreto'>
                        {item.price.toFixed(2)} TND
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className='flex justify-between items-center bg-[#D9D9D980]/50 p-4 rounded-xl font-bold'>
              <span>Total</span>
              <span className='font-aboreto text-lg'>
                {selectedOrder.total.toFixed(2)} TND
              </span>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
