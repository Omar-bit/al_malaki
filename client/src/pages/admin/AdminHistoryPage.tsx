import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '../../components/AdminLayout';
import { getActivityLogs } from '../../services/adminService';
import type { ActivityLogEntry } from '../../types/admin';
import toast from 'react-hot-toast';
import {
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  Package,
  ShoppingCart,
  MessageSquare,
  Ticket,
  Users,
  Bell,
  LogIn,
  LogOut,
  Star,
  FolderTree,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
} from '../../components/ui';

const ROLES = [
  { value: '', label: 'All Roles' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'VENDOR', label: 'Vendor' },
];

const ENTITY_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'Product', label: 'Product' },
  { value: 'ProductCategory', label: 'Category' },
  { value: 'Order', label: 'Order' },
  { value: 'ContactMessage', label: 'Contact Message' },
  { value: 'PromoCode', label: 'Promo Code' },
  { value: 'Loyalty', label: 'Loyalty' },
  { value: 'UserInvitation', label: 'Invitation' },
  { value: 'Notification', label: 'Notification' },
  { value: 'Auth', label: 'Authentication' },
];

const ACTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'STATUS_CHANGE', label: 'Status Change' },
  { value: 'ADJUST_POINTS', label: 'Adjust Points' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'SEND_TO_USERS', label: 'Notification to Users' },
  { value: 'SEND_TO_ROLES', label: 'Notification to Roles' },
];

const ENTITY_ICONS: Record<string, typeof Package> = {
  Product: Package,
  ProductCategory: FolderTree,
  Order: ShoppingCart,
  ContactMessage: MessageSquare,
  PromoCode: Ticket,
  Loyalty: Star,
  UserInvitation: UserPlus,
  Notification: Bell,
  Auth: LogIn,
};

const ACTION_ICONS: Record<string, typeof LogIn> = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  CREATE: UserPlus,
  DELETE: UserMinus,
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function RoleBadge({ role }: { role: string | null }) {
  if (!role) return null;
  const isAdmin = role === 'ADMIN';
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
        isAdmin ? 'bg-[#3F060F] text-[#FDF8F0]' : 'bg-[#D5BD9D] text-[#3F060F]'
      }`}
    >
      {isAdmin ? 'ADMIN' : 'VENDOR'}
    </span>
  );
}

function EntityIcon({
  entityType,
  action,
}: {
  entityType: string;
  action: string;
}) {
  const Icon = ENTITY_ICONS[entityType] || ACTION_ICONS[action] || Clock;
  return (
    <div className='w-10 h-10 rounded-full bg-[#FCECD8] flex items-center justify-center flex-shrink-0'>
      <Icon className='w-5 h-5 text-dark-red' />
    </div>
  );
}

function ChangesRow({ entry }: { entry: ActivityLogEntry }) {
  const changes = entry.changes;
  if (!changes || Object.keys(changes).length === 0) return null;

  return (
    <tr className='border-b border-[#3F060F]/20 bg-[#FDF8F0]'>
      <td colSpan={5} className='p-0'>
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className='overflow-hidden'
        >
          <div className='p-4 border-t border-[#3F060F]/20'>
            <p className='text-xs font-semibold text-[#000000]/68 mb-2 uppercase tracking-wider'>
              Changed fields
            </p>
            <table className='w-full text-xs'>
              <thead>
                <tr className='text-[#000000]/68 border-b border-[#3F060F]/10'>
                  <th className='py-1.5 pr-3 text-left font-semibold font-bona'>
                    Field
                  </th>
                  <th className='py-1.5 px-3 text-left font-semibold font-bona'>
                    Old Value
                  </th>
                  <th className='py-1.5 pl-3 text-left font-semibold font-bona'>
                    New Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(changes).map(([field, change]) => (
                  <tr key={field} className='border-b border-[#3F060F]/5'>
                    <td className='py-1.5 pr-3 font-medium text-dark-red capitalize font-bona'>
                      {field}
                    </td>
                    <td className='py-1.5 px-3 text-[#000000]/68 max-w-[250px] truncate font-aboreto'>
                      {String(change.old ?? '(empty)')}
                    </td>
                    <td className='py-1.5 pl-3 text-black max-w-[250px] truncate font-aboreto'>
                      {String(change.new ?? '(empty)')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </td>
    </tr>
  );
}

export function AdminHistoryPage() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [role, setRole] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getActivityLogs({
        page,
        limit,
        entityType: entityType || undefined,
        action: action || undefined,
        actorRole: role || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search || undefined,
      });
      setLogs(result.data);
      setTotal(result.total);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  }, [page, limit, entityType, action, role, startDate, endDate, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleFilterChange = () => {
    setPage(1);
  };

  return (
    <AdminLayout>
      <div className='px-4 md:px-8 py-5 w-full font-bona!'>
        <header className='mb-6'>
          <h1 className='text-2xl md:text-3xl font-bold text-black mb-1'>
            Activity History
          </h1>
          <p className='text-sm md:text-base text-[#000000]/68'>
            Track all actions performed by admins and vendors on the platform.
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
          >
            <div className='mb-6 bg-[#D9D9D957] rounded-2xl shadow-sm border border-[#3F060F]/40 p-4 md:p-6'>
              <div className='flex items-center gap-2 mb-4'>
                <Clock className='w-5 h-5 text-dark-red' />
                <h2 className='text-xl font-bold text-black'>
                  Activity Timeline
                </h2>
              </div>

              <form onSubmit={handleSearch} className='mb-4'>
                <div className='relative w-full sm:w-2/3'>
                  <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500' />
                  <input
                    type='text'
                    placeholder='Search descriptions...'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='w-full rounded-xl border border-[#3F060F]/30 bg-[##D9D9D9]/24 px-10 py-2.5 text-sm text-[#000000]/68 placeholder:text-[#000000]/68 focus:outline-none focus:ring-2 focus:ring-dark-red/40 transition'
                  />
                </div>
              </form>

              <div className='flex flex-wrap gap-3'>
                <select
                  value={entityType}
                  onChange={(e) => {
                    setEntityType(e.target.value);
                    handleFilterChange();
                  }}
                  className='appearance-none rounded-xl border border-[#3F060F]/30 bg-[##D9D9D9]/24 px-4 py-2.5 text-sm text-[#000000]/68 focus:outline-none focus:ring-2 focus:ring-dark-red/40 transition'
                >
                  {ENTITY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <select
                  value={action}
                  onChange={(e) => {
                    setAction(e.target.value);
                    handleFilterChange();
                  }}
                  className='appearance-none rounded-xl border border-[#3F060F]/30 bg-[##D9D9D9]/24 px-4 py-2.5 text-sm text-[#000000]/68 focus:outline-none focus:ring-2 focus:ring-dark-red/40 transition'
                >
                  {ACTIONS.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    handleFilterChange();
                  }}
                  className='appearance-none rounded-xl border border-[#3F060F]/30 bg-[##D9D9D9]/24 px-4 py-2.5 text-sm text-[#000000]/68 focus:outline-none focus:ring-2 focus:ring-dark-red/40 transition'
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <input
                  type='date'
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    handleFilterChange();
                  }}
                  className='rounded-xl border border-[#3F060F]/30 bg-[##D9D9D9]/24 px-4 py-2.5 text-sm text-[#000000]/68 focus:outline-none focus:ring-2 focus:ring-dark-red/40 transition'
                />
                <input
                  type='date'
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    handleFilterChange();
                  }}
                  className='rounded-xl border border-[#3F060F]/30 bg-[##D9D9D9]/24 px-4 py-2.5 text-sm text-[#000000]/68 focus:outline-none focus:ring-2 focus:ring-dark-red/40 transition'
                />
              </div>
            </div>

            <div className='bg-[#D9D9D957] rounded-2xl shadow-sm border border-[#3F060F]/40 p-4 md:p-6'>
              {logs.length === 0 ? (
                <div className='text-center py-12 text-[#a68f74]'>
                  <Clock className='w-12 h-12 mx-auto mb-3 opacity-40' />
                  <p className='text-lg font-semibold'>
                    No activity logged yet
                  </p>
                  <p className='text-sm mt-1'>
                    Actions performed by admins will appear here
                  </p>
                </div>
              ) : (
                <>
                  <TableContainer className='bg-transparent shadow-none border-none'>
                    <Table>
                      <TableHead className='bg-[#D9D9D980]/50'>
                        <TableRow>
                          <TableHeaderCell>
                            <span className='text-[#000000]/68 font-bold font-bona'>
                              Actor
                            </span>
                          </TableHeaderCell>
                          <TableHeaderCell>
                            <span className='text-[#000000]/68 font-bold font-bona'>
                              Action
                            </span>
                          </TableHeaderCell>
                          <TableHeaderCell>
                            <span className='text-[#000000]/68 font-bold font-bona'>
                              Description
                            </span>
                          </TableHeaderCell>
                          <TableHeaderCell>
                            <span className='text-[#000000]/68 font-bold font-bona'>
                              Time
                            </span>
                          </TableHeaderCell>
                          <TableHeaderCell>
                            <span className='text-[#000000]/68 font-bold font-bona'>
                              Details
                            </span>
                          </TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {logs.map((entry) => (
                          <Fragment key={entry.id}>
                            <TableRow className='border-b border-[#000000]/20 hover:bg-[#D5BD9D]/20'>
                              <TableCell className='py-3'>
                                <div className='flex items-center gap-2'>
                                  <EntityIcon
                                    entityType={entry.entityType}
                                    action={entry.action}
                                  />
                                  <div>
                                    <p className='font-semibold text-black text-sm'>
                                      {entry.actorName || 'Unknown'}
                                    </p>
                                    <RoleBadge role={entry.actorRole} />
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className='text-black font-bona text-sm'>
                                <div className='flex items-center gap-2'>
                                  <span className='text-[10px] px-2 py-0.5 rounded-full bg-[#FCECD8] text-dark-red font-medium'>
                                    {entry.entityType}
                                  </span>
                                  <span className='text-[11px] text-[#000000]/68 uppercase tracking-wider font-semibold'>
                                    {entry.action.replace(/_/g, ' ')}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className='text-gray-500 font-bona text-sm max-w-[300px]'>
                                <span className='truncate block'>
                                  {entry.description ||
                                    `${entry.action} on ${entry.entityType}`}
                                </span>
                              </TableCell>
                              <TableCell className='text-gray-500 font-aboreto text-sm whitespace-nowrap'>
                                {formatRelativeTime(entry.createdAt)}
                              </TableCell>
                              <TableCell className='text-center'>
                                {entry.changes &&
                                Object.keys(entry.changes).length > 0 ? (
                                  <button
                                    onClick={() =>
                                      setExpandedId(
                                        expandedId === entry.id
                                          ? null
                                          : entry.id,
                                      )
                                    }
                                    className='inline-flex items-center gap-1 text-dark-red text-xs font-semibold hover:underline'
                                  >
                                    {expandedId === entry.id ? 'Hide' : 'View'}{' '}
                                    changes
                                    {expandedId === entry.id ? (
                                      <ChevronUp className='w-3 h-3' />
                                    ) : (
                                      <ChevronDown className='w-3 h-3' />
                                    )}
                                  </button>
                                ) : (
                                  <span className='text-[10px] text-[#000000]/40'>
                                    —
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                            {expandedId === entry.id && (
                              <ChangesRow entry={entry} />
                            )}
                          </Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {totalPages > 1 && (
                    <div className='flex items-center justify-between mt-6 pt-4 border-t border-[#3F060F]/20'>
                      <span className='text-sm text-[#000000]/68 font-bona'>
                        Page {page} of {totalPages} ({total} entries)
                      </span>
                      <div className='flex gap-1.5'>
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page <= 1}
                          className='p-2 rounded-lg border border-[#3F060F]/30 disabled:opacity-30 hover:bg-[#D5BD9D]/40 transition'
                        >
                          <ChevronLeft className='w-4 h-4 text-[#000000]/68' />
                        </button>
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (page <= 3) {
                              pageNum = i + 1;
                            } else if (page >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = page - 2 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setPage(pageNum)}
                                className={`w-9 h-9 rounded-lg text-sm font-medium transition font-bona ${
                                  pageNum === page
                                    ? 'bg-dark-red text-white'
                                    : 'border border-[#3F060F]/30 hover:bg-[#D5BD9D]/40 text-[#000000]/68'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          },
                        )}
                        <button
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={page >= totalPages}
                          className='p-2 rounded-lg border border-[#3F060F]/30 disabled:opacity-30 hover:bg-[#D5BD9D]/40 transition'
                        >
                          <ChevronRight className='w-4 h-4 text-[#000000]/68' />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
}
