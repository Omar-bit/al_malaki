import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '../../components/AdminLayout';
import { contactService } from '../../services';
import type { ContactMessage } from '../../types';
import toast from 'react-hot-toast';
import { Loader2, Send, ArrowLeft } from 'lucide-react';

/* ────────────────────────── helpers ────────────────────────── */

type Chat = {
  key: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  avatar: string;
  messages: ContactMessage[];
  lastMessage: ContactMessage;
  unreadCount: number;
};

function buildChats(messages: ContactMessage[]): Chat[] {
  const groups = new Map<string, ContactMessage[]>();
  for (const m of messages) {
    const key = m.userId || `${m.phoneNumber}|${m.email}`;
    const list = groups.get(key);
    if (list) list.push(m);
    else groups.set(key, [m]);
  }

  const chats: Chat[] = [];
  for (const [key, list] of groups) {
    list.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const last = list[list.length - 1];
    chats.push({
      key,
      firstName: last.firstName,
      lastName: last.lastName,
      phoneNumber: last.phoneNumber,
      email: last.email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        last.firstName,
      )}+${encodeURIComponent(last.lastName)}&background=random`,
      messages: list,
      lastMessage: last,
      unreadCount: list.filter((m) => m.status === 'UNREAD').length,
    });
  }

  chats.sort(
    (a, b) =>
      new Date(b.lastMessage.createdAt).getTime() -
      new Date(a.lastMessage.createdAt).getTime(),
  );
  return chats;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ══════════════════════════ main page ═══════════════════════════════ */

export function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const chats = useMemo(() => buildChats(messages), [messages]);
  const selectedChat = useMemo(
    () => chats.find((c) => c.key === selectedKey) ?? null,
    [chats, selectedKey],
  );

  // Auto-scroll to latest message when chat changes or new message arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedKey, selectedChat?.messages.length]);

  // Mark unread as READ when opening a chat
  useEffect(() => {
    if (!selectedChat) return;
    const unread = selectedChat.messages.filter((m) => m.status === 'UNREAD');
    if (unread.length === 0) return;

    (async () => {
      try {
        const updated = await Promise.all(
          unread.map((m) =>
            contactService.updateContactMessageStatus(m.id, { status: 'READ' }),
          ),
        );
        setMessages((prev) =>
          prev.map((m) => {
            const found = updated.find((u) => u.id === m.id);
            return found ?? m;
          }),
        );
      } catch {
        /* silent */
      }
    })();
  }, [selectedChat]);

  const handleReply = async () => {
    if (!selectedChat || !draft.trim()) return;
    const subject = encodeURIComponent('Re: Your message to Al Malaki');
    const body = encodeURIComponent(draft.trim());
    window.location.href = `mailto:${selectedChat.email}?subject=${subject}&body=${body}`;

    try {
      const pending = selectedChat.messages.filter(
        (m) => m.status !== 'RESPONDED',
      );
      const updated = await Promise.all(
        pending.map((m) =>
          contactService.updateContactMessageStatus(m.id, {
            status: 'RESPONDED',
          }),
        ),
      );
      setMessages((prev) =>
        prev.map((m) => {
          const found = updated.find((u) => u.id === m.id);
          return found ?? m;
        }),
      );
      toast.success('Reply opened in your mail app');
      setDraft('');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update status');
    }
  };

  return (
    <AdminLayout>
      <div className='px-4 md:px-8 py-5 w-full font-bona!'>
        {/* Header */}
        <header className='mb-6'>
          <h1 className='text-2xl md:text-3xl font-bold text-black mb-1'>
            Contact Messages
          </h1>
          <p className='text-sm md:text-base text-[#000000]/68'>
            View and manage client inquiries.
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
            transition={{ duration: 0.4 }}
            className='flex flex-col md:flex-row gap-4 md:gap-6'
          >
            {/* ─── LEFT: Old chats ─── */}
            <aside
              className={`w-full md:w-[300px] lg:w-[320px] shrink-0 bg-[#EFE0C9]/39 rounded-[30px] border border-dark-red shadow-sm  h-[70vh] flex-col ${
                selectedChat ? 'hidden md:flex' : 'flex'
              }`}
            >
              <header className='flex items-center justify-center p-5'>
                <h2 className='text-lg md:text-2xl font-bold text-black mb-4 pl-1 font-abhaya'>
                  Old chats
                </h2>
              </header>

              <div className='flex-1 overflow-y-auto custom-scrollbar '>
                {chats.length === 0 ? (
                  <div className='text-center text-sm text-[#000000]/50 py-10'>
                    No conversations yet.
                  </div>
                ) : (
                  chats.map((chat) => {
                    const isActive = chat.key === selectedKey;
                    return (
                      <button
                        key={chat.key}
                        onClick={() => setSelectedKey(chat.key)}
                        className={`border-t  w-full border-dark-red w-full text-left flex items-center gap-2 p-4  transition-colors ${
                          isActive ? 'bg-[#EFD9B8]' : 'hover:bg-[#EFD9B8]/60'
                        }`}
                      >
                        <img
                          src={chat.avatar}
                          alt={chat.firstName}
                          className='w-10 h-10 rounded-full object-cover shrink-0'
                        />
                        <div className='min-w-0 flex-1'>
                          <div className='flex items-center justify-between gap-2'>
                            <span className='font-bold  text-black truncate'>
                              {chat.firstName}{' '}
                              <span className='font-normal text-sm text-[#000000] font-aboreto'>
                                ({chat.phoneNumber})
                              </span>
                            </span>
                            {chat.unreadCount > 0 && (
                              <span className='flex h-5 min-w-[20px] items-center justify-center rounded-full bg-dark-red px-1.5 text-[10px] font-bold text-white'>
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className='text-sm text-[#000000] truncate'>
                            {chat.lastMessage.message || 'Have a good day..'}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            {/* ─── RIGHT: Chat panel ─── */}
            <section
              className={`flex-1 bg-[#EFE0C9]/39 rounded-2xl border border-dark-red shadow-sm h-[70vh] flex-col overflow-hidden ${
                selectedChat ? 'flex' : 'hidden md:flex'
              }`}
            >
              {!selectedChat ? (
                <div className='flex-1 flex flex-col'>
                  {/* Title */}
                  <div className='flex-1 flex items-start justify-center pt-10 md:pt-14'>
                    <h2 className='text-2xl md:text-4xl font-bold text-black tracking-wide font-aboreto!'>
                      NO CHATS FOR NOW
                    </h2>
                  </div>

                  {/* Decorative empty bubbles + input */}
                  <div className='px-4 md:px-8 pb-6 space-y-3 max-w-2xl w-full mx-auto'>
                    <div className='flex items-center gap-2'>
                      <img
                        src='https://ui-avatars.com/api/?name=A&background=EEE'
                        alt=''
                        className='w-8 h-8 rounded-full shrink-0'
                      />
                      <div className='flex-1 h-8 rounded-full bg-[#D9D9D9]' />
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='flex-1 h-8 rounded-full bg-dark-red' />
                      <img
                        src='https://ui-avatars.com/api/?name=A&background=EEE'
                        alt=''
                        className='w-8 h-8 rounded-full shrink-0'
                      />
                    </div>
                    <div className='relative pt-2'>
                      <div className='w-full h-9 rounded-full border border-dark-red bg-transparent' />
                      <div className='cursor-pointer absolute bg-[#C6BCBC] right-2 top-1/2 -translate-y-1/2 mt-1 w-7 h-7 rounded-full  flex items-center justify-center'>
                        <Send className='w-4 h-4 text-black rotate-[10deg] ' />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='flex-1 flex flex-col min-h-0'>
                  {/* Chat header */}
                  <div className='flex items-center gap-3 px-4 md:px-6 py-4 border-b border-[#3F060F]/15'>
                    <button
                      onClick={() => setSelectedKey(null)}
                      className='md:hidden p-1 text-black'
                      aria-label='Back'
                    >
                      <ArrowLeft className='w-5 h-5' />
                    </button>
                    <img
                      src={selectedChat.avatar}
                      alt=''
                      className='w-10 h-10 rounded-full'
                    />
                    <div className='min-w-0'>
                      <div className='font-bold text-black truncate'>
                        {selectedChat.firstName} {selectedChat.lastName}
                      </div>
                      <div className='text-xs text-[#000000]/60 truncate'>
                        {selectedChat.phoneNumber} · {selectedChat.email}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div
                    ref={scrollRef}
                    className='flex-1 overflow-y-auto custom-scrollbar px-4 md:px-6 py-4 space-y-3'
                  >
                    {selectedChat.messages.map((m) => (
                      <div
                        key={m.id}
                        className='flex items-end gap-2 max-w-[80%]'
                      >
                        <img
                          src={selectedChat.avatar}
                          alt=''
                          className='w-7 h-7 rounded-full shrink-0'
                        />
                        <div>
                          <div className='px-4 py-2 rounded-2xl rounded-bl-sm bg-[#D9D9D9] text-black  break-words'>
                            {m.message}
                          </div>
                          <div className='text-sm text-[#000000]/50 mt-1 pl-1 font-aboreto font-semibold'>
                            {formatTime(m.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className='px-4 md:px-6 pb-5 pt-3 border-t border-[#3F060F]/15'>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleReply();
                      }}
                      className='relative'
                    >
                      <input
                        type='text'
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder='Type your reply…'
                        className='w-full h-11 rounded-full border border-[#3F060F]/30 bg-transparent pl-5 pr-14 text-sm text-black placeholder:text-[#000000]/40 focus:outline-none focus:ring-2 focus:ring-dark-red/30 transition'
                      />
                      <button
                        type='submit'
                        disabled={!draft.trim()}
                        className='absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-[#3F060F] hover:bg-[#3F060F]/10 disabled:opacity-40 disabled:hover:bg-transparent transition'
                        aria-label='Send'
                      >
                        <Send className='w-4 h-4 -rotate-12' />
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </section>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
}
