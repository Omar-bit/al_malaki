import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { contactService } from '../services';
import { useAuth } from '../contexts';
import type {
  ContactMessage,
  ContactStreamEvent,
} from '../types/contact';
import { buildTimeline, formatChatTime } from '../utils/chat';

export function CustomerChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [seenAt, setSeenAt] = useState<number>(() =>
    Number(localStorage.getItem('customerChatSeenAt') ?? '0'),
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const isCustomer = !!user && user.role === 'CUSTOMER';

  const loadMessages = useCallback(async () => {
    try {
      const data = await contactService.getMyContactMessages();
      setMessages(data);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    if (!isCustomer) {
      setMessages([]);
      return;
    }
    void loadMessages();
  }, [isCustomer, loadMessages]);

  // Real-time updates via SSE
  useEffect(() => {
    if (!isCustomer) return;
    const stream = contactService.createUserMessagesStream();
    stream.onmessage = (event) => {
      const payload = JSON.parse(event.data) as ContactStreamEvent;
      if (payload.kind === 'message.created') {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.message.id)) return prev;
          return [payload.message, ...prev];
        });
      } else if (payload.kind === 'reply.created') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === payload.contactMessageId
              ? {
                  ...m,
                  replies: [
                    ...(m.replies ?? []).filter((r) => r.id !== payload.reply.id),
                    payload.reply,
                  ],
                }
              : m,
          ),
        );
      } else if (payload.kind === 'message.status.updated') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === payload.contactMessageId
              ? { ...m, status: payload.status }
              : m,
          ),
        );
      }
    };
    return () => stream.close();
  }, [isCustomer]);

  const timeline = useMemo(() => buildTimeline(messages), [messages]);

  const latestStaffReplyAt = useMemo(() => {
    let latest = 0;
    for (const m of messages) {
      for (const r of m.replies ?? []) {
        if (r.authorRole !== 'CUSTOMER') {
          latest = Math.max(latest, new Date(r.createdAt).getTime());
        }
      }
    }
    return latest;
  }, [messages]);

  const unread = latestStaffReplyAt > seenAt;

  // Mark seen when the panel is open
  useEffect(() => {
    if (open && latestStaffReplyAt > seenAt) {
      setSeenAt(latestStaffReplyAt);
      localStorage.setItem('customerChatSeenAt', String(latestStaffReplyAt));
    }
  }, [open, latestStaffReplyAt, seenAt]);

  // Auto-scroll
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, timeline.length]);

  if (!isCustomer) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !user) return;
    const body = draft.trim();
    setDraft('');

    // Prefer replying to the latest existing thread; otherwise create a new one.
    const latestThread = messages
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];

    try {
      if (latestThread) {
        const reply = await contactService.createReply(latestThread.id, {
          body,
        });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === latestThread.id
              ? {
                  ...m,
                  replies: [
                    ...(m.replies ?? []).filter((r) => r.id !== reply.id),
                    reply,
                  ],
                }
              : m,
          ),
        );
      } else {
        const created = await contactService.createContactMessage({
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          email: user.email,
          phoneNumber: user.phoneNumber ?? '',
          message: body,
        });
        setMessages((prev) => [created, ...prev]);
      }
    } catch {
      setDraft(body);
    }
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close messages' : 'Open messages'}
        className='fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-dark-red text-white shadow-lg hover:bg-[#5a0b18] transition-colors flex items-center justify-center'
      >
        {open ? (
          <X className='w-6 h-6' />
        ) : (
          <>
            <MessageCircle className='w-6 h-6' />
            {unread && (
              <span className='absolute top-1 right-1 w-3 h-3 rounded-full bg-[#f6c453] border-2 border-dark-red' />
            )}
          </>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className='fixed bottom-24 right-6 z-40 w-[92vw] max-w-[360px] h-[520px] max-h-[70vh] rounded-2xl bg-[#fff9f1] border border-dark-red shadow-2xl flex flex-col overflow-hidden'
          role='dialog'
          aria-label='Support chat'
        >
          {/* Header */}
          <div className='bg-dark-red text-white px-4 py-3'>
            <div className='font-bona text-base font-bold leading-tight'>
              Al Malaki support
            </div>
            <div className='text-xs opacity-80 leading-tight'>
              We usually reply within a few hours
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className='flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-[#fff9f1]'
          >
            {timeline.length === 0 ? (
              <div className='text-center text-sm text-[#000000]/50 py-10 px-4'>
                No messages yet. Send us a note and we'll get back to you.
              </div>
            ) : (
              timeline.map((item) => {
                const fromMe =
                  item.kind === 'message' ||
                  (item.kind === 'reply' && !item.fromStaff);
                return (
                  <div
                    key={`${item.kind}-${item.id}`}
                    className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className='max-w-[80%]'>
                      <div
                        className={`px-3 py-2 rounded-2xl text-sm break-words ${
                          fromMe
                            ? 'bg-dark-red text-white rounded-br-sm'
                            : 'bg-[#EFE0C9] text-[#3f060f] rounded-bl-sm'
                        }`}
                      >
                        {item.text}
                      </div>
                      <div
                        className={`text-[10px] text-[#000000]/50 mt-0.5 ${
                          fromMe ? 'text-right pr-1' : 'pl-1'
                        }`}
                      >
                        {formatChatTime(item.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className='border-t border-dark-red/20 p-2 bg-[#fff9f1]'
          >
            <div className='relative'>
              <input
                type='text'
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder='Type a message…'
                className='w-full h-10 rounded-full border border-dark-red/40 bg-white pl-4 pr-11 text-sm text-[#3f060f] placeholder:text-[#000000]/40 focus:outline-none focus:ring-2 focus:ring-dark-red/30 transition'
              />
              <button
                type='submit'
                disabled={!draft.trim()}
                aria-label='Send'
                className='absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-dark-red text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#5a0b18] transition-colors'
              >
                <Send className='w-4 h-4 -rotate-12' />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
