export type MessageStatus = 'UNREAD' | 'READ' | 'RESPONDED';

export type Role = 'CUSTOMER' | 'ADMIN' | 'VENDOR';

export interface ContactMessageReply {
  id: string;
  contactMessageId: string;
  authorId: string;
  authorRole: Role;
  body: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  message: string;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
  replies?: ContactMessageReply[];
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateContactMessagePayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  message: string;
}

export interface UpdateContactMessageStatusPayload {
  status: MessageStatus;
}

export interface CreateReplyPayload {
  body: string;
}

export type ContactStreamEvent =
  | { kind: 'connected' }
  | { kind: 'message.created'; message: ContactMessage }
  | {
      kind: 'reply.created';
      contactMessageId: string;
      customerId: string;
      reply: ContactMessageReply;
    }
  | {
      kind: 'message.status.updated';
      contactMessageId: string;
      customerId: string;
      status: MessageStatus;
    };
