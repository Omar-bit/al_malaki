import type { ContactMessage } from '../types/contact';

export type TimelineItem =
  | { kind: 'message'; id: string; createdAt: string; text: string }
  | { kind: 'reply'; id: string; createdAt: string; text: string; fromStaff: boolean };

export function buildTimeline(messages: ContactMessage[]): TimelineItem[] {
  const items: TimelineItem[] = [];
  for (const m of messages) {
    items.push({ kind: 'message', id: m.id, createdAt: m.createdAt, text: m.message });
    for (const r of m.replies ?? []) {
      items.push({ kind: 'reply', id: r.id, createdAt: r.createdAt, text: r.body, fromStaff: r.authorRole !== 'CUSTOMER' });
    }
  }
  items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return items;
}

export function formatChatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
