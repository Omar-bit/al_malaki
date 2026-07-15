import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '../../components/AdminLayout';
import { orderService } from '../../services';
import type { Order } from '../../types';
import { formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  Search,
  ChevronDown,
  Loader2,
  Clock,
  Eye,
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
                    <svg
                      width='25'
                      height='20'
                      viewBox='0 0 25 20'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <g clip-path='url(#clip0_517_373)'>
                        <path
                          d='M12.5012 19.9742C11.3596 19.9742 10.2146 20.0196 9.07304 19.9645C7.49914 19.89 6.20219 18.5459 6.18193 17.0301C6.16504 15.9127 6.16166 14.792 6.18193 13.6746C6.22921 10.7823 8.78596 8.20093 11.7818 7.89324C15.0512 7.55639 18.1044 9.69728 18.7022 12.7969C18.7799 13.1985 18.8035 13.6163 18.8103 14.0244C18.8272 14.9475 18.8204 15.8706 18.817 16.7936C18.8103 18.6787 17.4559 19.9807 15.4868 19.9936C14.4905 20.0001 13.4941 19.9936 12.4978 19.9936C12.5012 19.9904 12.5012 19.9807 12.5012 19.9742ZM12.5147 18.9993C13.5448 18.9993 14.5749 18.9993 15.6051 18.9993C15.6388 18.9993 15.6726 18.9993 15.7064 18.9993C16.696 18.9702 17.5539 18.2738 17.7396 17.341C17.7734 17.1596 17.797 16.975 17.7937 16.7936C17.7734 15.5564 17.8747 14.3062 17.6957 13.0916C17.3141 10.5297 14.8282 8.61226 11.8898 8.88433C9.35337 9.12077 7.22219 11.3588 7.2053 13.8981C7.19855 14.8859 7.20192 15.8738 7.2053 16.8617C7.21206 18.0957 8.14086 18.9961 9.43105 19.0025C10.4544 19.0058 11.4845 18.9993 12.5147 18.9993Z'
                          fill='black'
                        />
                        <path
                          d='M12.4802 7.27179e-05C14.6756 -0.0128827 16.4792 1.70696 16.4825 3.81546C16.4859 5.90129 14.6959 7.6276 12.514 7.64056C10.3322 7.65351 8.5151 5.91748 8.51172 3.81546C8.50835 1.72639 10.2916 0.0130282 12.4802 7.27179e-05ZM12.4769 6.60412C14.0643 6.61384 15.3849 5.36687 15.4018 3.85109C15.4186 2.30938 14.1318 1.04947 12.5174 1.02679C10.9165 1.00412 9.58913 2.28347 9.58913 3.84461C9.58913 5.33449 10.9131 6.59764 12.4769 6.60412Z'
                          fill='black'
                        />
                        <path
                          d='M5.60725 16.9492C5.66467 17.2958 5.71196 17.5937 5.76599 17.9209C5.66129 17.9273 5.56335 17.9403 5.46878 17.9403C4.53997 17.9403 3.61117 17.9435 2.68237 17.9403C1.08483 17.9338 -0.00609462 16.8909 0.000660307 15.3589C0.00403777 14.4164 -0.0297369 13.4642 0.0749646 12.5314C0.314765 10.4099 2.38515 8.6415 4.60752 8.56377C5.55997 8.53138 6.45162 8.70952 7.2791 9.15648C7.37367 9.2083 7.46148 9.27308 7.57632 9.34434C7.35003 9.60021 7.144 9.83988 7.00552 9.99859C6.31314 9.83664 5.68831 9.59373 5.04997 9.56458C2.83773 9.45446 1.07132 11.1095 1.03079 13.2666C1.01728 13.963 1.02741 14.6561 1.02741 15.3524C1.03079 16.3338 1.64549 16.933 2.67224 16.946C3.51998 16.9557 4.3711 16.9492 5.21885 16.9492C5.34381 16.9492 5.46878 16.9492 5.60725 16.9492Z'
                          fill='black'
                        />
                        <path
                          d='M19.2283 17.9242C19.2823 17.5905 19.3296 17.2926 19.387 16.9493C19.5795 16.9493 19.7788 16.9493 19.9781 16.9493C20.7482 16.9493 21.5182 16.9557 22.2883 16.946C23.3589 16.9363 23.9736 16.3436 23.9703 15.3201C23.9669 14.4845 24.0108 13.6424 23.9162 12.8165C23.619 10.2416 20.7684 8.79055 18.3502 9.95006C18.2623 9.99217 18.1711 10.0343 18.0698 10.0861C17.8503 9.8367 17.6443 9.60026 17.418 9.34439C18.0833 8.89743 18.8027 8.65775 19.5728 8.58002C22.1059 8.33063 24.3587 9.9112 24.8957 12.3047C24.9666 12.6189 24.9902 12.9493 24.997 13.2731C25.0105 13.9889 25.0038 14.708 25.0004 15.4237C24.9936 16.7582 24.075 17.8108 22.6868 17.9112C21.5452 17.9889 20.4003 17.9242 19.2283 17.9242Z'
                          fill='black'
                        />
                        <path
                          d='M4.88161 8.17807C3.14897 8.17483 1.76421 6.83718 1.76758 5.16916C1.77096 3.51734 3.17936 2.17969 4.912 2.17969C6.63789 2.18293 8.02603 3.5303 8.02265 5.19507C8.01252 6.86309 6.62438 8.18455 4.88161 8.17807ZM4.87823 7.14487C6.02995 7.14811 6.93173 6.29629 6.93848 5.19831C6.94524 4.10034 6.04346 3.22584 4.90863 3.21936C3.76704 3.21612 2.85175 4.07766 2.84837 5.16916C2.84162 6.27038 3.73665 7.13839 4.87823 7.14487Z'
                          fill='black'
                        />
                        <path
                          d='M20.1128 8.17807C18.3701 8.18131 16.9819 6.85986 16.9785 5.19184C16.9718 3.52706 18.3667 2.17969 20.0892 2.17969C21.8218 2.17645 23.2269 3.51735 23.2302 5.16917C23.2302 6.84042 21.8488 8.17483 20.1128 8.17807ZM20.1128 7.14488C21.2544 7.14164 22.1562 6.26714 22.1461 5.17241C22.1393 4.07767 21.2274 3.21613 20.0858 3.21937C18.9476 3.22261 18.0492 4.0971 18.0526 5.19508C18.0627 6.29305 18.9645 7.14811 20.1128 7.14488Z'
                          fill='black'
                        />
                      </g>
                      <defs>
                        <clipPath id='clip0_517_373'>
                          <rect width='25' height='20' fill='white' />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                }
              />
              <StatCard
                label='Pending orders'
                value={stats.pendingOrders}
                icon={
                  <div className=' bg-[#D9D9D9] p-[6px] text-sm rounded-full aspect-square font-semibold text-black'>
                    <svg
                      width='21'
                      height='21'
                      viewBox='0 0 21 21'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <g clip-path='url(#clip0_517_381)'>
                        <path
                          d='M13.1947 4.21962C13.164 3.00728 13.5097 1.97888 14.3431 1.14278C15.5472 -0.0639896 17.3953 -0.342689 18.9088 0.443243C20.4168 1.22639 21.2279 2.87908 20.9408 4.59308C20.6676 6.22904 19.3241 7.52221 17.6545 7.76189C17.5513 7.77582 17.4454 7.79533 17.3423 7.80091C17.1723 7.80927 16.9799 7.82042 16.9632 7.58074C16.9493 7.34384 17.1277 7.32433 17.3061 7.31597C17.9081 7.29089 18.4572 7.09858 18.9617 6.77251C20.1798 5.98657 20.7596 4.54012 20.4307 3.09646C20.1269 1.75313 18.9172 0.671777 17.5402 0.504557C16.1131 0.331764 14.725 1.0536 14.0699 2.30496C13.3814 3.6232 13.6044 5.18949 14.633 6.27363C14.6831 6.32659 14.7696 6.37675 14.7779 6.43528C14.7919 6.53561 14.7919 6.66939 14.7333 6.73906C14.6943 6.78923 14.5159 6.7948 14.4602 6.75021C14.3264 6.63873 14.2288 6.48545 14.0811 6.30429C14.017 6.68054 14.1368 6.88399 14.396 6.96481C14.6274 7.03727 14.9033 6.91743 15.0009 6.68611C15.1096 6.43249 15.0483 6.21232 14.8253 6.04789C14.7696 6.00608 14.6748 6.00887 14.6274 5.9587C14.5438 5.87231 14.4825 5.76361 14.4128 5.66328C14.5326 5.61033 14.6608 5.49328 14.7668 5.51279C15.2518 5.5964 15.5667 6.07297 15.5166 6.59414C15.4692 7.07629 15.0594 7.44139 14.5521 7.45811C14.0727 7.47204 13.6407 7.12645 13.5626 6.65824C13.5459 6.56627 13.518 6.44921 13.557 6.37954C13.8163 5.91133 13.5097 5.53229 13.4037 5.11425C13.3173 4.77423 13.164 4.68505 12.8268 4.69341C11.8177 4.71849 10.8087 4.70734 9.79968 4.69898C9.35092 4.6962 8.98856 4.84669 8.6708 5.16162C6.09528 7.74238 3.51696 10.3176 0.94144 12.8983C0.336582 13.5031 0.31707 14.2835 0.913566 14.8827C2.64452 16.6273 4.38383 18.3664 6.12594 20.0999C6.7085 20.6768 7.50568 20.6657 8.09382 20.0776C9.98365 18.1936 11.8679 16.304 13.755 14.4172C14.4518 13.7177 15.1458 13.0154 15.8511 12.3242C16.1688 12.0093 16.3165 11.6414 16.3165 11.1955C16.3138 9.51491 16.3193 7.83435 16.3165 6.15101C16.3138 5.25081 15.7646 4.70734 14.8587 4.69898C14.6274 4.6962 14.3933 4.72128 14.1675 4.68783C14.0644 4.67111 13.9779 4.54291 13.8832 4.46488C13.9835 4.38405 14.0783 4.23356 14.1814 4.23077C14.5772 4.21962 14.987 4.20569 15.3716 4.27815C16.2106 4.43979 16.7792 5.15884 16.782 6.01166C16.7876 7.77582 16.7848 9.54278 16.7848 11.3069C16.7848 11.842 16.573 12.2796 16.1995 12.6531C13.8525 14.9941 11.5139 17.3352 9.17531 19.6735C8.92166 19.9271 8.67359 20.1835 8.41715 20.4316C7.63669 21.1896 6.53847 21.1896 5.76916 20.4232C4.03541 18.6953 2.30446 16.9618 0.576295 15.2282C-0.187443 14.4618 -0.195805 13.3582 0.573508 12.5834C2.29889 10.8471 4.03541 9.12194 5.76637 7.39122C6.62209 6.5384 7.47781 5.68558 8.32795 4.82718C8.73491 4.4175 9.21155 4.21126 9.79411 4.21683C10.8449 4.22798 11.8958 4.21962 12.9466 4.21962C13.0163 4.21962 13.0888 4.21962 13.1947 4.21962Z'
                          fill='black'
                        />
                      </g>
                      <defs>
                        <clipPath id='clip0_517_381'>
                          <rect width='21' height='21' fill='white' />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                }
              />
            </div>

            {/* ── Orders Management Card ── */}
            <div className='min-h-[50vh] bg-[#D9D9D957] rounded-2xl shadow-sm border border-[#3F060F]/40 p-4 md:p-6'>
              <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6'>
                <div>
                  <div className='flex items-center gap-2 mb-1'>
                    <svg
                      width='30'
                      height='33'
                      viewBox='0 0 30 33'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <g clip-path='url(#clip0_517_389)'>
                        <path
                          d='M9.39046 7.91037C9.39046 7.34064 9.39298 6.81249 9.39046 6.28189C9.3779 4.55071 10.2173 3.32812 11.7604 2.52366C11.8735 2.46498 11.9791 2.36228 12.0444 2.25469C13.0974 0.518623 15.0477 -0.334741 17.106 0.122506C18.913 0.523514 20.1193 1.58227 20.5315 3.38925C20.5943 3.668 20.5993 3.96387 20.6018 4.24995C20.6094 5.39674 20.6068 6.54596 20.6094 7.69275C20.6094 7.75143 20.627 7.80767 20.642 7.91037C20.7979 7.91037 20.9411 7.91037 21.0869 7.91037C23.3462 7.91037 25.6056 7.91037 27.865 7.91037C28.4153 7.91037 28.5686 8.05219 28.6013 8.58768C28.7898 11.5757 28.9733 14.5637 29.1643 17.5517C29.3829 20.9602 29.6116 24.3664 29.8353 27.7749C29.8931 28.6552 29.9635 29.533 29.9987 30.4133C30.0062 30.5918 29.9233 30.8289 29.7926 30.9512C29.1291 31.5845 28.448 32.2056 27.7468 32.7973C27.591 32.9293 27.3196 32.988 27.1009 32.9905C21.7504 33.0002 16.3998 32.9978 11.0492 32.9978C7.65887 32.9978 4.27109 32.9978 0.88079 32.9978C0.0438962 32.9978 -0.0390393 32.9196 0.00871142 32.1078C0.136884 29.9144 0.260031 27.7211 0.403283 25.5278C0.559101 23.1193 0.740051 20.7133 0.898382 18.3048C1.06174 15.8352 1.23012 13.3655 1.36332 10.8959C1.39097 10.3629 1.5493 9.95942 1.97403 9.61465C2.54452 9.15251 3.06476 8.6268 3.63274 8.16222C3.80363 8.02285 4.06752 7.92259 4.28868 7.9177C5.82676 7.89814 7.36734 7.90792 8.90793 7.90792C9.04616 7.91037 9.18187 7.91037 9.39046 7.91037ZM27.5709 9.49239C27.1738 9.85183 26.832 10.1453 26.5129 10.4607C26.4425 10.5316 26.4274 10.6807 26.4324 10.7908C26.4576 11.2969 26.5003 11.8031 26.533 12.3092C26.6687 14.4536 26.7968 16.6005 26.9376 18.7449C27.0984 21.1779 27.2693 23.6084 27.4352 26.0413C27.5332 27.4619 27.6337 28.8826 27.7292 30.3032C27.7594 30.7654 27.5835 31.0172 27.2191 31.0368C26.8572 31.0563 26.6712 30.8632 26.636 30.4035C26.5782 29.7066 26.5204 29.0073 26.4777 28.3104C26.3193 25.8163 26.1736 23.3223 26.0152 20.8282C25.8494 18.2363 25.676 15.6469 25.5051 13.0574C25.4573 12.3263 25.4045 11.5928 25.3543 10.8568C23.0296 10.8568 20.7426 10.8568 18.4354 10.8568C18.4354 11.7468 18.438 12.6026 18.4354 13.4609C18.4354 13.8692 18.2394 14.0869 17.8876 14.082C17.5483 14.0771 17.3699 13.879 17.3648 13.4731C17.3598 12.7249 17.3623 11.9742 17.3598 11.226C17.3598 11.0989 17.3472 10.9693 17.3397 10.8495C17.2593 10.8372 17.2216 10.825 17.1864 10.825C15.0502 10.825 12.914 10.8275 10.7803 10.8201C10.539 10.8201 10.4586 10.8935 10.4611 11.1307C10.4737 11.9278 10.4711 12.7249 10.4611 13.522C10.4561 13.8839 10.2525 14.0844 9.92326 14.082C9.59906 14.0795 9.39549 13.8717 9.39046 13.5171C9.38293 12.9743 9.38795 12.429 9.38795 11.8862C9.38795 11.5414 9.38795 11.1942 9.38795 10.8495C7.05068 10.8495 4.77373 10.8495 2.4641 10.8495C2.00419 17.9136 1.54427 24.9556 1.08185 32.0197C1.25274 32.0271 1.37338 32.0368 1.49401 32.0368C9.91321 32.0368 18.3324 32.0393 26.7516 32.0271C26.9476 32.0271 27.1789 31.9219 27.3347 31.7972C27.7544 31.4573 28.1238 31.0612 28.5485 30.7287C28.8526 30.4891 28.9456 30.2397 28.9079 29.8582C28.7948 28.6699 28.722 27.4766 28.6466 26.2834C28.5209 24.3321 28.4028 22.3809 28.2771 20.4272C28.1515 18.4515 28.0183 16.4758 27.8901 14.5001C27.7845 12.8618 27.6815 11.2236 27.5709 9.49239ZM17.3573 7.88836C17.3573 7.3113 17.3447 6.77092 17.3598 6.23054C17.4126 4.16926 15.3945 2.76329 13.4568 3.02981C12.7179 3.13006 12.6727 3.16185 12.6576 3.88562C12.6325 5.16444 12.6425 6.44327 12.64 7.72209C12.64 7.77833 12.6677 7.83457 12.6903 7.91281C14.1479 7.91281 15.5981 7.91281 17.0482 7.91281C17.1336 7.91037 17.2166 7.89814 17.3573 7.88836ZM19.5036 7.90059C19.5161 7.81256 19.5287 7.75388 19.5287 7.69764C19.5287 6.44327 19.5588 5.18645 19.5111 3.93452C19.496 3.5164 19.3553 3.06893 19.1492 2.69971C18.0811 0.790037 15.2663 0.389029 13.6503 1.89281C13.6227 1.91726 13.6177 1.96616 13.5925 2.01996C13.7232 2.01996 13.8212 2.01996 13.9167 2.01996C16.0077 2.02974 17.8097 3.29144 18.2897 5.17667C18.448 5.7953 18.3952 6.46527 18.4279 7.11324C18.4405 7.37243 18.4304 7.63162 18.4304 7.90059C18.82 7.90059 19.1391 7.90059 19.5036 7.90059ZM18.4455 9.86161C18.6164 9.86161 18.7496 9.86161 18.8828 9.86161C20.9285 9.86161 22.9743 9.82249 25.0175 9.88118C25.8519 9.90318 26.151 9.32123 26.6863 8.90066C23.8916 8.90066 21.1748 8.90066 18.448 8.90066C18.4455 9.22098 18.4455 9.50706 18.4455 9.86161ZM10.4837 9.83227C12.7958 9.83227 15.0602 9.83227 17.3271 9.83227C17.3271 9.49728 17.3271 9.19164 17.3271 8.89333C15.0276 8.89333 12.7607 8.89333 10.4837 8.89333C10.4837 9.21853 10.4837 9.5144 10.4837 9.83227ZM3.28592 9.83472C5.37187 9.83472 7.3598 9.83472 9.36031 9.83472C9.36031 9.50217 9.36031 9.19653 9.36031 8.86398C9.20449 8.86398 9.08134 8.86398 8.96071 8.86398C7.4729 8.86398 5.98509 8.86399 4.49728 8.86887C4.42942 8.86887 4.34397 8.89333 4.29622 8.93734C3.97202 9.21364 3.65787 9.49973 3.28592 9.83472ZM11.5392 3.89785C10.549 4.64118 10.0841 6.52396 10.5289 7.88836C10.8582 7.88836 11.1874 7.88836 11.5392 7.88836C11.5392 6.55574 11.5392 5.24758 11.5392 3.89785Z'
                          fill='black'
                        />
                      </g>
                      <defs>
                        <clipPath id='clip0_517_389'>
                          <rect width='30' height='33' fill='white' />
                        </clipPath>
                      </defs>
                    </svg>

                    <h2 className='text-2xl font-bold text-black'>
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
                    className='w-full rounded-xl border border-[#3F060F]/30 bg-[##D9D9D9]/24 px-10 py-2.5 text-sm text-[#000000]/68 placeholder:text-[#000000]/68 focus:outline-none focus:ring-2 focus:ring-dark-red/40 transition'
                  />
                </div>
                <div className='relative w-full sm:w-1/3'>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className='w-full appearance-none rounded-xl border border-[#3F060F]/30 bg-[##D9D9D9]/24 px-4 py-2.5 text-sm text-[#000000]/68 placeholder:text-[#000000]/68 focus:outline-none focus:ring-2 focus:ring-dark-red/40 transition'
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
