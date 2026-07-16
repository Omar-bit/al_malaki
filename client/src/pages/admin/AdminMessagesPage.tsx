import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '../../components/AdminLayout';
import { contactService } from '../../services';
import type { ContactMessage } from '../../types';
import toast from 'react-hot-toast';
import { Search, ChevronDown, Loader2, Eye, Check, Bell } from 'lucide-react';
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

function MessageStatusBadge({ status }: { status: string }) {
  let bg = 'bg-gray-200';
  let text = 'text-gray-800';
  let dot = 'bg-gray-500';
  let label = status;

  switch (status) {
    case 'UNREAD':
      bg = 'bg-orange-100';
      text = 'text-orange-800';
      dot = 'bg-orange-500';
      label = 'Unread';
      break;
    case 'READ':
      bg = 'bg-blue-100';
      text = 'text-blue-800';
      dot = 'bg-blue-500';
      label = 'Read';
      break;
    case 'RESPONDED':
      bg = 'bg-green-300/60';
      text = 'text-green-800';
      dot = 'bg-green-600';
      label = 'Responded';
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

export function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(
    null,
  );
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const data = await contactService.getAllContactMessages();
      setMessages(data);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleUpdateStatus = async (messageId: string, newStatus: string) => {
    try {
      setUpdatingStatusId(messageId);
      const updatedMessage = await contactService.updateContactMessageStatus(
        messageId,
        { status: newStatus as any },
      );
      setMessages(
        messages.map((m) => (m.id === messageId ? updatedMessage : m)),
      );
      toast.success('Message status updated');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const stats = useMemo(() => {
    let unreadMessages = 0;
    messages.forEach((m) => {
      if (m.status === 'UNREAD') {
        unreadMessages += 1;
      }
    });
    return {
      totalMessages: messages.length,
      unreadMessages,
    };
  }, [messages]);

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      const matchesSearch =
        m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phoneNumber.includes(searchTerm) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter ? m.status === statusFilter : true;
      return matchesSearch && matchesStatus;
    });
  }, [messages, searchTerm, statusFilter]);

  return (
    <AdminLayout>
      <div className='px-4 md:px-8 py-5 w-full font-bona!'>
        {/* ── Header ── */}
        <header className='mb-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl md:text-3xl font-bold text-black mb-1'>
                Contact Messages
              </h1>
              <p className='text-sm md:text-base text-[#000000]/68'>
                View and manage client inquiries.
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <div className='relative'>
                <Bell className='w-5 h-5 text-black' />
                {stats.unreadMessages > 0 && (
                  <span className='absolute -top-1 -right-1 w-4 h-4 bg-dark-red text-white text-xs rounded-full flex items-center justify-center'>
                    {stats.unreadMessages}
                  </span>
                )}
              </div>
            </div>
          </div>
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
            <div className='grid grid-cols-1 md:grid-cols-2 gap-15'>
              <StatCard
                label='Total messages'
                value={stats.totalMessages.toLocaleString()}
                icon={
                  <div className=' bg-[#D9D9D9] p-[6px] text-sm rounded-full aspect-square font-semibold text-black'>
                    <svg
                      width='25'
                      height='20'
                      viewBox='0 0 25 20'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <g clipPath='url(#clip0_517_373)'>
                        <path
                          d='M12.5012 19.9742C11.3596 19.9742 10.2146 20.0196 9.07304 19.9645C7.49914 19.89 6.20219 18.5459 6.18193 17.0301C6.16504 15.9127 6.16166 14.792 6.18193 13.6746C6.22921 10.7823 8.78596 8.20093 11.7818 7.89324C15.0512 7.55639 18.1044 9.69728 18.7022 12.7969C18.7799 13.1985 18.8035 13.6163 18.8103 14.0244C18.8272 14.9475 18.8204 15.8706 18.817 16.7936C18.8103 18.6787 17.4559 19.9807 15.4868 19.9936C14.4905 20.0001 13.4941 19.9936 12.4978 19.9936C12.5012 19.9904 12.5012 19.9807 12.5012 19.9742ZM12.5147 18.9993C13.5448 18.9993 14.5749 18.9993 15.6051 18.9993C15.6388 18.9993 15.6726 18.9993 15.7064 18.9993C16.696 18.9702 17.5539 18.2738 17.7396 17.341C17.7734 17.1596 17.797 16.975 17.7937 16.7936C17.7734 15.5564 17.8747 14.3062 17.6957 13.0916C17.3141 10.5297 14.8282 8.61226 11.8898 8.88433C9.35337 9.12077 7.22219 11.3588 7.2053 13.8981C7.19855 14.8859 7.20192 15.8738 7.2053 16.8617C7.21206 18.0957 8.14086 18.9961 9.43105 19.0025C10.4544 19.0058 11.4845 18.9993 12.5147 18.9993Z'
                          fill='black'
                        />
                        <path
                          d='M12.4802 7.27179e-05C14.6756 -0.0128827 16.4792 1.70696 16.4825 3.81546C16.4859 5.90129 14.6959 7.6276 12.514 7.64056C10.3322 7.65351 8.5151 5.91748 8.51172 3.81546C8.50835 1.72639 10.2916 0.0130282 12.4802 7.27179e-05ZM12.4769 6.60412C14.0643 6.61384 15.3849 5.36687 15.4018 3.85109C15.4186 2.30938 14.1318 1.04947 12.5174 1.02679C10.9165 1.00412 9.58913 2.28347 9.58913 3.84461C9.58913 5.33449 10.9131 6.59764 12.4769 6.60412Z'
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
                label='Unread messages'
                value={stats.unreadMessages}
                icon={
                  <div className=' bg-[#D9D9D9] p-[6px] text-sm rounded-full aspect-square font-semibold text-black'>
                    <Bell className='w-5 h-5' />
                  </div>
                }
              />
            </div>

            {/* ── Messages Management Card ── */}
            <div className='min-h-[50vh] bg-[#D9D9D957] rounded-2xl shadow-sm border border-[#3F060F]/40 p-4 md:p-6'>
              <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6'>
                <div>
                  <div className='flex items-center gap-2 mb-1'>
                    <h2 className='text-2xl font-bold text-black'>
                      Messages management
                    </h2>
                  </div>
                  <p className='text-sm text-[#000000]/68'>
                    Track and manage all client inquiries.
                  </p>
                </div>
              </div>

              <div className='flex flex-col sm:flex-row items-center gap-4 mb-8'>
                <div className='relative w-full sm:w-2/3'>
                  <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500' />
                  <input
                    type='text'
                    placeholder='Search messages'
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
                    <option value=''>All status</option>
                    <option value='UNREAD'>Unread</option>
                    <option value='READ'>Read</option>
                    <option value='RESPONDED'>Responded</option>
                  </select>
                  <ChevronDown className='absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none' />
                </div>
              </div>

              <TableContainer className='bg-transparent shadow-none border-none  min-h-[30vh]'>
                <Table>
                  <TableHead className='bg-[#D9D9D980]/50'>
                    <TableRow>
                      <TableHeaderCell>
                        <span className='text-[#000000]/68 font-bold font-bona'>
                          Client Name
                        </span>
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <span className='text-[#000000]/68 font-bold font-bona'>
                          Phone
                        </span>
                      </TableHeaderCell>
                      <TableHeaderCell>
                        <span className='text-[#000000]/68 font-bold font-bona'>
                          Message
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
                    {filteredMessages.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className='text-center py-12 text-[#a68f74]'
                        >
                          No messages found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMessages.map((message) => (
                        <TableRow
                          key={message.id}
                          className='border-b border-[#000000]/20 hover:bg-[#D5BD9D]/20'
                        >
                          <TableCell className='text-black font-bona text-sm'>
                            {message.firstName} {message.lastName}
                          </TableCell>
                          <TableCell className='text-gray-500 font-aboreto text-sm'>
                            {message.phoneNumber}
                          </TableCell>
                          <TableCell className='text-gray-500 font-bona text-sm max-w-xs truncate'>
                            {message.message}
                          </TableCell>
                          <TableCell className='text-gray-500 font-aboreto text-sm'>
                            {new Date(message.createdAt)
                              .toISOString()
                              .slice(0, 10)}
                          </TableCell>
                          <TableCell>
                            <MessageStatusBadge status={message.status} />
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2 relative'>
                              <button
                                onClick={() => {
                                  setSelectedMessage(message);
                                  if (message.status === 'UNREAD') {
                                    handleUpdateStatus(message.id, 'READ');
                                  }
                                }}
                                className='flex items-center gap-1.5 px-2.5 py-1 bg-[#b2b2b2]/40 hover:bg-[#b2b2b2]/60 rounded-md transition-colors text-black text-xs font-bold'
                              >
                                <Eye className='w-3.5 h-3.5' />
                                View
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdateStatus(message.id, 'RESPONDED')
                                }
                                disabled={updatingStatusId === message.id}
                                className='flex items-center gap-1.5 px-2.5 py-1 bg-green-500/40 hover:bg-green-500/60 rounded-md transition-colors text-black text-xs font-bold disabled:opacity-50'
                              >
                                {updatingStatusId === message.id ? (
                                  <Loader2 className='w-3.5 h-3.5 animate-spin' />
                                ) : (
                                  <Check className='w-3.5 h-3.5' />
                                )}
                                Mark read
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

      <Modal
        open={!!selectedMessage}
        onClose={() => setSelectedMessage(null)}
        title={`Message from ${selectedMessage?.firstName} ${selectedMessage?.lastName}`}
      >
        {selectedMessage && (
          <div className='font-bona text-black'>
            <div className='bg-[#f0e6d8] p-4 rounded-xl mb-6'>
              <h3 className='font-bold text-lg mb-3'>Contact Information</h3>
              <div className='space-y-2 text-sm'>
                <div>
                  <span className='text-gray-600'>Name:</span>{' '}
                  {selectedMessage.firstName} {selectedMessage.lastName}
                </div>
                <div>
                  <span className='text-gray-600'>Email:</span>{' '}
                  {selectedMessage.email}
                </div>
                <div>
                  <span className='text-gray-600'>Phone:</span>{' '}
                  {selectedMessage.phoneNumber}
                </div>
                <div>
                  <span className='text-gray-600'>Date:</span>{' '}
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </div>
                <div>
                  <span className='text-gray-600'>Status:</span>{' '}
                  <MessageStatusBadge status={selectedMessage.status} />
                </div>
              </div>
            </div>

            <div>
              <h3 className='font-bold text-lg mb-3'>Message</h3>
              <div className='bg-white p-4 rounded-xl border border-[#d5bd9d]/50 min-h-[150px]'>
                <p className='text-gray-800 leading-relaxed'>
                  {selectedMessage.message}
                </p>
              </div>
            </div>

            <div className='mt-6 pt-4 border-t border-[#d5bd9d]/50'>
              <h4 className='font-bold text-sm mb-2 text-gray-700'>
                Update Status
              </h4>
              <div className='flex items-center gap-2'>
                <select
                  value={selectedMessage.status}
                  onChange={(e) => {
                    handleUpdateStatus(selectedMessage.id, e.target.value);
                    setSelectedMessage({
                      ...selectedMessage,
                      status: e.target.value as any,
                    });
                  }}
                  disabled={updatingStatusId === selectedMessage.id}
                  className='w-full rounded-lg border border-[#d5bd9d] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dark-red/40 transition disabled:opacity-50'
                >
                  <option value='UNREAD'>Unread</option>
                  <option value='READ'>Read</option>
                  <option value='RESPONDED'>Responded</option>
                </select>
                {updatingStatusId === selectedMessage.id && (
                  <Loader2 className='w-5 h-5 animate-spin text-dark-red' />
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
